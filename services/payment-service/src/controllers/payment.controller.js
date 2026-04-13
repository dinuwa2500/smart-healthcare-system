
'use strict';

const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { validationResult } = require('express-validator');
const Payment  = require('../models/Payment.model');
const { ok, fail } = require('../utils/response');
const mq       = require('../publishers/rabbitmq');
const { confirmAppointment, getAppointment } = require('../utils/appointmentClient');
const { getPatient } = require('../utils/patientClient');
const { getDoctor }  = require('../utils/doctorClient');
const { getUser }    = require('../utils/authClient');

// ── POST /payments/create-intent ─────────────────────────────
exports.createIntent = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, errors.array(), 422);

  try {
    const { appointmentId, patientId, doctorId, amountLKR } = req.body;

    const intent = await stripe.paymentIntents.create({
      amount:   Math.round(amountLKR * 100),
      currency: 'lkr',
      metadata: { appointmentId, patientId },
    });

    const payment = await Payment.create({
      appointmentId,
      patientId,
      doctorId,
      amount:                amountLKR,
      currency:              'lkr',
      stripePaymentIntentId: intent.id,
      stripeClientSecret:    intent.client_secret,
    });

    return ok(res, { clientSecret: intent.client_secret, paymentId: payment._id }, 201);
  } catch (err) {
    console.error('[payment] createIntent:', err.message);
    return fail(res, err.message || 'Internal server error', 500);
  }
};

// ── POST /payments/webhook  (raw body – NO JWT) ───────────────
exports.webhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,                             // raw Buffer from express.raw()
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('[payment] Webhook signature failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  const intent = event.data.object;

  if (event.type === 'payment_intent.succeeded') {
    await handlePaymentSuccess(intent.id, intent.latest_charge);
  } else if (event.type === 'payment_intent.payment_failed') {
    try {
      const payment = await Payment.findOneAndUpdate(
        { stripePaymentIntentId: intent.id },
        {
          status:         'failed',
          failureMessage: intent.last_payment_error?.message || 'Payment failed',
        },
        { new: true }
      );

      if (payment) {
        mq.publish('payment.failed', {
          paymentId:      payment._id,
          appointmentId:  payment.appointmentId,
          patientId:      payment.patientId,
          failureMessage: payment.failureMessage,
        });
      }
    } catch (err) {
      console.error('[payment] webhook failed handler:', err.message);
    }
  }

  res.json({ received: true });
};

/**
 * Shared logic for successful payment processing.
 * Can be called by Webhook OR Manual Confirm endpoint.
 */
async function handlePaymentSuccess(stripeIntentId, chargeId = null) {
  try {
    const payment = await Payment.findOneAndUpdate(
      { stripePaymentIntentId: stripeIntentId },
      {
        status:        'succeeded',
        stripeChargeId: chargeId || null,
      },
      { new: true }
    );

    if (!payment || payment.status !== 'succeeded') return;

    // 1. Confirm appointment status (async)
    confirmAppointment(payment.appointmentId, payment._id.toString()).catch((err) =>
      console.error('[payment] confirmAppointment failed:', err.message)
    );

    // 2. Fetch enrichment details for notifications (best-effort)
    const [appt, patient, doctor] = await Promise.all([
      getAppointment(payment.appointmentId),
      getPatient(payment.patientId),
      getDoctor(payment.doctorId),
    ]);

    const [patientAuth, doctorAuth] = await Promise.all([
      getUser(patient?.authUserId),
      getUser(doctor?.authUserId),
    ]);

    // 3. Publish enriched message
    const payload = {
      paymentId:     payment._id,
      appointmentId: payment.appointmentId,
      patientId:     payment.patientId,
      doctorId:      payment.doctorId,
      amount:        payment.amount,
      currency:      payment.currency,
      patientName:   patient?.firstName ? `${patient.firstName} ${patient.lastName}` : (appt?.patientName || 'Patient'),
      patientEmail:  patientAuth?.email || '',
      patientPhone:  patient?.phone || '',
      doctorName:    doctor?.firstName ? `${doctor.firstName} ${doctor.lastName}` : (appt?.doctorName || 'Doctor'),
      doctorEmail:   doctorAuth?.email || '',
      doctorPhone:   doctor?.phone || '',
      slotDate:      appt?.slotDate || '',
      slotTime:      appt?.slotTime || '',
      type:          appt?.consultationType || 'video',
    };
    
    console.log('[payment] Enriched Notification Payload Dump:', JSON.stringify({
      dbPayment: payment,
      resolvedPatient: patient,
      resolvedDoctor: doctor,
      resolvedPatientAuth: patientAuth,
      resolvedDoctorAuth: doctorAuth,
      finalPayload: payload
    }, null, 2));

    mq.publish('payment.succeeded', payload);

    console.log(`[payment] Processed success for intent: ${stripeIntentId}`);
  } catch (err) {
    console.error(`[payment] handlePaymentSuccess error:`, err.message);
    throw err;
  }
}

// ── GET /payments/:appointmentId ─────────────────────────────
exports.getByAppointment = async (req, res) => {
  try {
    const payment = await Payment.findOne({ appointmentId: req.params.appointmentId })
      .select('-stripeClientSecret');

    if (!payment) return fail(res, 'Payment not found', 404);

    // Only the patient, doctor involved, or admin may view
    if (
      req.userRole !== 'admin' &&
      req.userId !== payment.patientId &&
      req.userId !== payment.doctorId
    ) {
      return fail(res, 'Forbidden', 403);
    }

    return ok(res, payment);
  } catch (err) {
    console.error('[payment] getByAppointment:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── GET /payments/admin/all (role:admin, paginated) ──────────
exports.adminAll = async (req, res) => {
  try {
    const { page = 1, limit = 100, status, from, to } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    
    if (from || to) {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999); // End of the day
        filter.createdAt.$lte = toDate;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .select('-stripeClientSecret')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Payment.countDocuments(filter),
    ]);

    return ok(res, { payments, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[payment] adminAll:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── POST /payments/:id/refund  (role:admin) ──────────────────
exports.refund = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return fail(res, 'Payment not found', 404);

    if (payment.status !== 'succeeded') {
      return fail(res, `Cannot refund a payment with status '${payment.status}'`, 422);
    }

    await stripe.refunds.create({ payment_intent: payment.stripePaymentIntentId });

    payment.status     = 'refunded';
    payment.refundedAt = new Date();
    await payment.save();

    mq.publish('payment.refunded', {
      paymentId:     payment._id,
      appointmentId: payment.appointmentId,
      patientId:     payment.patientId,
      amount:        payment.amount,
    });

    return ok(res, { refunded: true, id: payment._id, refundedAt: payment.refundedAt });
  } catch (err) {
    console.error('[payment] refund:', err.message);
    return fail(res, err.message || 'Internal server error', 500);
  }
};

// ── POST /payments/:id/confirm ───────────────────────────────
exports.confirmPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id);
    if (!payment) return fail(res, 'Payment not found', 404);

    if (payment.status === 'succeeded') {
      return ok(res, { status: 'succeeded', message: 'Already processed' });
    }

    // Sync appointmentId if the frontend provides it (since it was 'pending')
    if (req.body.appointmentId && payment.appointmentId === 'pending') {
      payment.appointmentId = req.body.appointmentId;
      await payment.save();
    }

    // Re-verify with Stripe source of truth
    const intent = await stripe.paymentIntents.retrieve(payment.stripePaymentIntentId);

    if (intent.status === 'succeeded') {
      await handlePaymentSuccess(intent.id, intent.latest_charge);
      return ok(res, { status: 'succeeded', message: 'Payment confirmed and booking processed' });
    }

    return ok(res, { status: intent.status, message: `Payment is currently ${intent.status}` });
  } catch (err) {
    console.error('[payment] confirmPayment:', err.message);
    return fail(res, err.message || 'Internal server error', 500);
  }
};
