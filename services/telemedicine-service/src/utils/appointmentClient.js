'use strict';

const axios = require('axios');

const APPOINTMENT_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://appointment-service:4003';

/**
 * Write the Agora channelName back to the appointment document.
 * Called after session creation so the appointment-service stores it.
 */
exports.patchAgoraChannel = async (appointmentId, channelName) => {
  await axios.patch(
    `${APPOINTMENT_URL}/appointments/${appointmentId}/agora`,
    { agoraChannelName: channelName },
    { timeout: 5000 }
  );
};
