'use strict';

const axios = require('axios');

const APPOINTMENT_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:4003';

/**
 * PATCH appointment status to 'confirmed' after payment success.
 * Called from webhook handler – best-effort, errors are logged.
 */
exports.confirmAppointment = async (appointmentId, paymentId) => {
  await axios.patch(
    `${APPOINTMENT_URL}/appointments/${appointmentId}/status`,
    { status: 'confirmed', paymentStatus: 'paid', paymentId },
    { timeout: 5000 }
  );
};
