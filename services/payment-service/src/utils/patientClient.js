'use strict';

const axios = require('axios');

const PATIENT_URL = process.env.PATIENT_SERVICE_URL || 'http://patient-service:4001';

/**
 * Fetch patient details (email, phone, name) by ID.
 * Internal service request – best-effort.
 */
exports.getPatient = async (patientId) => {
  try {
    if (!patientId) return null;
    const url = `${PATIENT_URL}/patients/${patientId}`;
    console.log(`[patientClient] Fetching from: ${url}`);
    
    const res = await axios.get(url, { 
      timeout: 5000,
      headers: { 'X-Internal-Secret': process.env.INTERNAL_SERVICE_SECRET || 'mediconnect_secret_2024' }
    });
    return res.data.data;
  } catch (err) {
    console.error(`[patientClient] Error for ${patientId} at ${PATIENT_URL}:`, err.response?.data || err.message);
    return null;
  }
};
