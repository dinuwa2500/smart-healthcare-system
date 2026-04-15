'use strict';

const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:4000';
const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'mediconnect_secret_2024';

class ServiceClient {
  static async updateUserVerification(authUserId, isVerified) {
    try {
      // Using native fetch instead of axios to avoid dependency issues
      const response = await fetch(`${AUTH_SERVICE_URL}/auth/users/${authUserId}/status`, {
        method: 'PATCH',
        headers: {
          'X-Internal-Secret': INTERNAL_SECRET,
          'X-User-Role': 'admin',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isVerified }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      console.error(`[doctor-service] Failed to update auth verification for ${authUserId}:`, err.message);
      throw err;
    }
  }
}

module.exports = ServiceClient;
