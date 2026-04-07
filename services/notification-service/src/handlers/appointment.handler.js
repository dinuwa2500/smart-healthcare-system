'use strict';

const { sendEmail } = require('../utils/mailer');
const { sendSms }   = require('../utils/sms');
const { render }    = require('../utils/templateRenderer');

// ── appointment.booked ───────────────────────────────────────
exports.booked = async (payload) => {
  const { appointmentId, patientEmail, patientPhone,
          doctorEmail, doctorPhone, scheduledAt, doctorName } = payload;

  const vars = { appointmentId, scheduledAt, doctorName };

  await Promise.allSettled([
    sendEmail(patientEmail, 'Appointment Booked – MediConnect',  render('appointment.booked', vars)),
    sendEmail(doctorEmail,  'New Appointment – MediConnect',     render('appointment.booked', vars)),
    sendSms(patientPhone, `Your appointment with Dr. ${doctorName} is booked for ${scheduledAt}. Ref:${appointmentId}`),
    sendSms(doctorPhone,  `New appointment booked for ${scheduledAt}. Ref:${appointmentId}`),
  ]);
};

// ── appointment.confirmed ────────────────────────────────────
exports.confirmed = async (payload) => {
  const { appointmentId, patientEmail, patientPhone,
          doctorEmail, scheduledAt, doctorName } = payload;

  const vars = { appointmentId, scheduledAt, doctorName };

  await Promise.allSettled([
    sendEmail(patientEmail, 'Appointment Confirmed – MediConnect', render('appointment.confirmed', vars)),
    sendEmail(doctorEmail,  'Appointment Confirmed – MediConnect', render('appointment.confirmed', vars)),
    sendSms(patientPhone, `Appointment confirmed with Dr. ${doctorName} on ${scheduledAt}. Ref:${appointmentId}`),
  ]);
};

// ── appointment.cancelled ────────────────────────────────────
exports.cancelled = async (payload) => {
  const { appointmentId, patientEmail, patientPhone,
          doctorEmail, doctorPhone, reason } = payload;

  const vars = { appointmentId, reason: reason || 'No reason provided' };

  await Promise.allSettled([
    sendEmail(patientEmail, 'Appointment Cancelled – MediConnect', render('appointment.cancelled', vars)),
    sendEmail(doctorEmail,  'Appointment Cancelled – MediConnect', render('appointment.cancelled', vars)),
    sendSms(patientPhone, `Your appointment (${appointmentId}) has been cancelled.`),
    sendSms(doctorPhone,  `Appointment (${appointmentId}) has been cancelled.`),
  ]);
};

// ── appointment.completed ────────────────────────────────────
exports.completed = async (payload) => {
  const { appointmentId, patientEmail, patientPhone, doctorName } = payload;

  const vars = { appointmentId, doctorName };

  await Promise.allSettled([
    sendEmail(patientEmail, 'Appointment Completed – MediConnect', render('appointment.completed', vars)),
    sendSms(patientPhone, `Your appointment with Dr. ${doctorName} is complete. Ref:${appointmentId}`),
  ]);
};
