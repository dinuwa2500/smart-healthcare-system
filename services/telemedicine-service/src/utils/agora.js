'use strict';

const { RtcTokenBuilder, RtcRole } = require('agora-access-token');

/**
 * Build an Agora RTC token for a publisher.
 * @param {string} channelName
 * @param {number} uid
 * @param {number} expirySecs  default 3600 (1 hour)
 */
function buildToken(channelName, uid, expirySecs = 3600) {
  return RtcTokenBuilder.buildTokenWithUid(
    process.env.AGORA_APP_ID,
    process.env.AGORA_APP_CERTIFICATE,
    channelName,
    uid,
    RtcRole.PUBLISHER,
    Math.floor(Date.now() / 1000) + expirySecs
  );
}

/**
 * Returns the remaining token lifetime in seconds.
 * Agora tokens embed the expiry as the last numeric segment in the token string.
 * For simplicity we track token issue time externally, so this helper
 * accepts the absolute expiry epoch (seconds) stored on the session.
 */
function remainingSecs(issuedAtMs, expirySecs = 3600) {
  const elapsedSecs = (Date.now() - issuedAtMs) / 1000;
  return Math.max(0, expirySecs - elapsedSecs);
}

module.exports = { buildToken, remainingSecs };
