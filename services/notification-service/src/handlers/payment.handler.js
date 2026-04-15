'use strict';

const { sendEmail } = require('../utils/mailer');
const { sendSms }   = require('../utils/sms');
const { render }    = require('../utils/templateRenderer');

// ── payment.succeeded ────────────────────────────────────────
exports.succeeded = async (payload) => {
  const { 
    paymentId, appointmentId, amount, currency,
    patientName, patientEmail, patientPhone,
    doctorName, doctorEmail, doctorPhone,
    slotDate, slotTime, type
  } = payload;

  const dateStr = slotDate ? new Date(slotDate).toLocaleDateString('en-US', { 
    weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' 
  }) : 'TBD';

  const amountStr = `${currency?.toUpperCase() || 'LKR'} ${amount}`;
  const vars = { 
    paymentId, appointmentId, amount: amountStr,
    patientName, doctorName, slotDate: dateStr, slotTime, type,
    consultationType: type === 'video' ? 'Video Visit' : 'In-person Visit'
  };

  const smsText = `MediConnect: Booking confirmed with Dr. ${doctorName} on ${dateStr} at ${slotTime}. Ref: ${paymentId}`;

  await Promise.allSettled([
    sendEmail(patientEmail, 'Booking Confirmed – MediConnect', render('payment.succeeded', vars)),
    sendEmail(doctorEmail,  'New Appointment Paid – MediConnect', render('payment.succeeded', vars)),
    sendSms(patientPhone, smsText),
    sendSms(doctorPhone,  `New paid appt: ${patientName} on ${dateStr} at ${slotTime}.`),
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
