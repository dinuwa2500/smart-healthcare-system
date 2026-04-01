'use strict';

const axios = require('axios');

const AUTH_URL = process.env.AUTH_SERVICE_URL || 'http://auth-service:4000';

/**
 * Fetch user details (email, role) from auth-service by authUserId.
 * Internal service request – best-effort.
 */
exports.getUser = async (userId) => {
  try {
    if (!userId) {
      console.warn(`[authClient] No userId provided to getUser`);
      return null;
    }
    
    const url = `${AUTH_URL}/auth/users/${userId}`;
    console.log(`[authClient] Fetching user from: ${url}`);

    const res = await axios.get(url, { 
      timeout: 5000,
      headers: { 'X-Internal-Secret': process.env.INTERNAL_SERVICE_SECRET || 'mediconnect_secret_2024' }
    });
    
    console.log(`[authClient] Successfully fetched user: ${userId}`);
    return res.data.data;
  } catch (err) {
    console.error(`[authClient] Error fetching user ${userId} from ${AUTH_URL}:`, err.response?.data || err.message);
    return null;
  }
};
