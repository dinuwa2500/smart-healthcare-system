'use strict';

const axios = require('axios');

const DOCTOR_URL = process.env.DOCTOR_SERVICE_URL || 'http://doctor-service:4002';

/**
 * Fetch doctor details (email, phone, name) by ID.
 * Internal service request – best-effort.
 */
exports.getDoctor = async (doctorId) => {
  try {
    if (!doctorId) return null;
    const url = `${DOCTOR_URL}/doctors/${doctorId}`;
    console.log(`[doctorClient] Fetching from: ${url}`);

    const res = await axios.get(url, { 
      timeout: 5000,
      headers: { 'X-Internal-Secret': process.env.INTERNAL_SERVICE_SECRET || 'mediconnect_secret_2024' }
    });
    return res.data.data;
  } catch (err) {
    console.error(`[doctorClient] Error for ${doctorId} at ${DOCTOR_URL}:`, err.response?.data || err.message);
    return null;
  }
};
