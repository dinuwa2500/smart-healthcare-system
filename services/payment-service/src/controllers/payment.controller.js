'use strict';

const stripe  = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { validationResult } = require('express-validator');
const Payment  = require('../models/Payment.model');
const { ok, fail } = require('../utils/response');
const mq       = require('../publishers/rabbitmq');
const { confirmAppointment } = require('../utils/appointmentClient');

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
    try {
      const payment = await Payment.findOneAndUpdate(
        { stripePaymentIntentId: intent.id },
        {
          status:        'succeeded',
          stripeChargeId: intent.latest_charge || null,
        },
        { new: true }
      );

      if (payment) {
        // Best-effort PATCH to appointment-service
        confirmAppointment(payment.appointmentId, payment._id.toString()).catch((err) =>
          console.error('[payment] confirmAppointment failed:', err.message)
        );

        mq.publish('payment.succeeded', {
          paymentId:     payment._id,
          appointmentId: payment.appointmentId,
          patientId:     payment.patientId,
          doctorId:      payment.doctorId,
          amount:        payment.amount,
          currency:      payment.currency,
        });
      }
    } catch (err) {
      console.error('[payment] webhook succeeded handler:', err.message);
    }
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

  // Always return 200 so Stripe stops retrying
  res.json({ received: true });
};

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

// ── GET /payments/admin/all  (role:admin, paginated) ─────────
exports.adminAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const skip = (Number(page) - 1) * Number(limit);
    const [payments, total] = await Promise.all([
      Payment.find(filter).select('-stripeClientSecret').sort({ createdAt: -1 })
        .skip(skip).limit(Number(limit)),
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
