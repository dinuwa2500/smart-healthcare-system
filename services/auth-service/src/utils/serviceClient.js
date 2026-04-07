'use strict';

const axios = require('axios');

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://doctor-service:4002';
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://patient-service:4001';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'mediconnect_secret_2024';

/**
 * Service-to-service communication client.
 * Uses a shared secret to bypass user authentication for internal orchestration.
 */
class ServiceClient {
  static async createProfile(role, authUserId, profileData) {
    const url = role === 'doctor' 
      ? `${DOCTOR_SERVICE_URL}/doctors/register` 
      : `${PATIENT_SERVICE_URL}/patients/register`;

    try {
      console.log(`[auth-service] Attempting to create ${role} profile for ${authUserId}`);
      
      const response = await axios.post(
        url,
        { ...profileData, authUserId },
        {
          headers: {
            'X-Internal-Secret': INTERNAL_SECRET,
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      return response.data;
    } catch (err) {
      console.error(`[auth-service] Profile creation failed for ${role}:`, err.message);
      if (err.response) {
        console.error(`[auth-service] Response error:`, err.response.data);
      }
      throw new Error(`Failed to create ${role} profile: ${err.message}`);
    }
  }
}

module.exports = ServiceClient;
