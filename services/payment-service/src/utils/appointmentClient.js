'use strict';

const axios = require('axios');

const APPOINTMENT_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:4003';

exports.confirmAppointment = async (appointmentId, paymentId) => {
  await axios.patch(
    `${APPOINTMENT_URL}/appointments/${appointmentId}/status`,
    { status: 'confirmed', paymentStatus: 'paid', paymentId },
    { 
      timeout: 5000,
      headers: { 'X-Internal-Secret': process.env.INTERNAL_SERVICE_SECRET }
    }
  );
};

/**
 * Fetch appointment details by ID.
 */
exports.getAppointment = async (appointmentId) => {
  try {
    const res = await axios.get(`${APPOINTMENT_URL}/appointments/${appointmentId}`, {
      timeout: 5000,
      headers: { 'X-Internal-Secret': process.env.INTERNAL_SERVICE_SECRET || 'mediconnect_secret_2024'}
    });
    return res.data.data;
  } catch (err) {
    console.error(`[apptClient] Failed to fetch appt ${appointmentId}:`, err.message);
    return null;
  }
};
