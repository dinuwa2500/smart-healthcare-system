'use strict';

const twilio = require('twilio');

let _client = null;

function getClient() {
  if (_client) return _client;
  _client = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);
  return _client;
}

/**
 * Send an SMS via Twilio.
 * @param {string} to   E.164 phone number e.g. +94771234567
 * @param {string} body message text (≤ 160 chars recommended)
 */
exports.sendSms = async function sendSms(to, body) {
  if (!to) {
    console.warn('[sms] No recipient number – skipping SMS');
    return;
  }

  try {
    const msg = await getClient().messages.create({
      from: process.env.TWILIO_FROM,
      to,
      body,
    });
    console.log(`[sms] SMS sent to ${to} (SID: ${msg.sid})`);
  } catch (err) {
    console.error(`[sms] Failed to send SMS to ${to}:`, err.message);
    throw err;
  }
};
