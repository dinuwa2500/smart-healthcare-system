'use strict';

const { v4: uuidv4 }  = require('uuid');
const { validationResult } = require('express-validator');
const VideoSession    = require('../models/VideoSession.model');
const { buildToken }  = require('../utils/agora');
const { patchAgoraChannel } = require('../utils/appointmentClient');
const mq              = require('../publishers/rabbitmq');
const { ok, fail }    = require('../utils/response');

const TOKEN_EXPIRY_SECS  = 3600;        // 1 hour
const REGEN_THRESHOLD    = 10 * 60;     // regenerate if < 10 min remain

// ── POST /sessions/create ────────────────────────────────────
exports.create = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, errors.array(), 422);

  try {
    const { appointmentId, patientId, doctorId, scheduledAt } = req.body;

    const existing = await VideoSession.findOne({ appointmentId });
    if (existing) return ok(res, _sessionPayload(existing));

    const channelName = 'mc-' + uuidv4().replace(/-/g, '').slice(0, 8);
    const patientUid  = Math.floor(Math.random() * 900000) + 100000;
    const doctorUid   = patientUid + 1;

    const patientRtcToken = buildToken(channelName, patientUid);
    const doctorRtcToken  = buildToken(channelName, doctorUid);

    const session = await VideoSession.create({
      appointmentId,
      patientId,
      doctorId,
      channelName,
      patientUid,
      doctorUid,
      patientRtcToken,
      doctorRtcToken,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : undefined,
      status: 'scheduled',
    });

    // Write channel name back to appointment-service (best-effort)
    patchAgoraChannel(appointmentId, channelName).catch((err) =>
      console.error('[session] patchAgoraChannel failed:', err.message)
    );

    return ok(res, _sessionPayload(session), 201);
  } catch (err) {
    console.error('[session] create:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── GET /sessions/:appointmentId ─────────────────────────────
exports.getSession = async (req, res) => {
  try {
    const session = await VideoSession.findOne({ appointmentId: req.params.appointmentId });
    if (!session) return fail(res, 'Session not found', 404);

    // Access guard: only involved patient / doctor / admin
    if (
      req.userRole !== 'admin' &&
      req.userId !== session.patientId &&
      req.userId !== session.doctorId
    ) {
      return fail(res, 'Forbidden', 403);
    }

    // Regenerate tokens if token issued more than (TOKEN_EXPIRY_SECS - REGEN_THRESHOLD) ago
    const issuedMs   = new Date(session.updatedAt).getTime();
    const elapsedSec = (Date.now() - issuedMs) / 1000;

    if (elapsedSec > TOKEN_EXPIRY_SECS - REGEN_THRESHOLD) {
      session.patientRtcToken = buildToken(session.channelName, session.patientUid);
      session.doctorRtcToken  = buildToken(session.channelName, session.doctorUid);
      await session.save();
      console.log(`[session] Tokens regenerated for channel ${session.channelName}`);
    }

    return ok(res, _sessionPayload(session));
  } catch (err) {
    console.error('[session] getSession:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── POST /sessions/:appointmentId/start  (role:doctor) ───────
exports.startSession = async (req, res) => {
  try {
    const session = await VideoSession.findOne({ appointmentId: req.params.appointmentId });
    if (!session) return fail(res, 'Session not found', 404);

    if (session.doctorId !== req.userId) return fail(res, 'Forbidden', 403);
    if (session.status !== 'scheduled')
      return fail(res, `Cannot start a session with status '${session.status}'`, 422);

    session.status    = 'active';
    session.startedAt = new Date();
    await session.save();

    return ok(res, { id: session._id, status: session.status, startedAt: session.startedAt });
  } catch (err) {
    console.error('[session] startSession:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── POST /sessions/:appointmentId/end  (role:doctor) ─────────
exports.endSession = async (req, res) => {
  try {
    const session = await VideoSession.findOne({ appointmentId: req.params.appointmentId });
    if (!session) return fail(res, 'Session not found', 404);

    if (session.doctorId !== req.userId) return fail(res, 'Forbidden', 403);
    if (session.status !== 'active')
      return fail(res, `Cannot end a session with status '${session.status}'`, 422);

    const endedAt = new Date();
    const durationSeconds = session.startedAt
      ? Math.round((endedAt - session.startedAt) / 1000)
      : 0;

    session.status          = 'ended';
    session.endedAt         = endedAt;
    session.durationSeconds = durationSeconds;
    await session.save();

    mq.publish('session.ended', {
      sessionId:      session._id,
      appointmentId:  session.appointmentId,
      patientId:      session.patientId,
      doctorId:       session.doctorId,
      channelName:    session.channelName,
      durationSeconds,
    });

    return ok(res, {
      id: session._id,
      status: session.status,
      endedAt: session.endedAt,
      durationSeconds,
    });
  } catch (err) {
    console.error('[session] endSession:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── Internal helper ──────────────────────────────────────────
function _sessionPayload(session) {
  return {
    sessionId:       session._id,
    appointmentId:   session.appointmentId,
    channelName:     session.channelName,
    patientUid:      session.patientUid,
    patientRtcToken: session.patientRtcToken,
    doctorUid:       session.doctorUid,
    doctorRtcToken:  session.doctorRtcToken,
    agoraAppId:      process.env.AGORA_APP_ID,
    scheduledAt:     session.scheduledAt,
    status:          session.status,
  };
}
