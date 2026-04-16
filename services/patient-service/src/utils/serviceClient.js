'use strict';

const axios = require('axios');

const APPOINTMENT_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:4003';
const DOCTOR_URL      = process.env.DOCTOR_SERVICE_URL      || 'http://doctor-service:4002';

/**
 * Fetch appointment history for a patient.
 * Forwards the original Authorization header so the downstream service
 * can verify the caller's identity.
 */
exports.getPatientHistory = async (patientId, incomingHeaders) => {
  const { data } = await axios.get(
    `${APPOINTMENT_URL}/appointments/my/history`,
    {
      headers: {
        authorization: incomingHeaders['authorization'] || '',
        'x-user-id': incomingHeaders['x-user-id'] || '',
        'x-user-role': incomingHeaders['x-user-role'] || '',
      },
      timeout: 8000,
    }
  );
  return data.data;
};

/**
 * Fetch prescriptions issued to a patient.
 */
exports.getPatientPrescriptions = async (patientId, incomingHeaders) => {
  const { data } = await axios.get(
    `${DOCTOR_URL}/doctors/prescriptions?patientId=${patientId}`,
    {
      headers: {
        authorization: incomingHeaders['authorization'] || '',
        'x-user-id': incomingHeaders['x-user-id'] || '',
        'x-user-role': incomingHeaders['x-user-role'] || '',
      },
      timeout: 8000,
    }
  );
  return data.data;
};
