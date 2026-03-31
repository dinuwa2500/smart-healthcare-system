'use strict';

const { sendEmail } = require('../utils/mailer');
const { sendSms }   = require('../utils/sms');
const { render }    = require('../utils/templateRenderer');

// ── payment.succeeded ────────────────────────────────────────
exports.succeeded = async (payload) => {
  const { paymentId, appointmentId, patientEmail, patientPhone,
          doctorEmail, doctorPhone, amount, currency } = payload;

  const amountStr = `${currency?.toUpperCase() || 'LKR'} ${amount}`;
  const vars = { paymentId, appointmentId, amount: amountStr };

  await Promise.allSettled([
    sendEmail(patientEmail, 'Payment Received – MediConnect', render('payment.succeeded', vars)),
    sendEmail(doctorEmail,  'Payment Received – MediConnect', render('payment.succeeded', vars)),
    sendSms(patientPhone, `Payment ${amountStr} received. Ref:${paymentId}`),
    sendSms(doctorPhone,  `Payment ${amountStr} confirmed for appt ${appointmentId}.`),
  ]);
};

// ── payment.failed ───────────────────────────────────────────
exports.failed = async (payload) => {
  const { paymentId, appointmentId, patientEmail, failureMessage } = payload;

  const vars = { paymentId, appointmentId, failureMessage: failureMessage || 'Unknown error' };

  await Promise.allSettled([
    sendEmail(patientEmail, 'Payment Failed – MediConnect', render('payment.failed', vars)),
  ]);
};
