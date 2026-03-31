'use strict';

const amqp = require('amqplib');
const { v4: uuidv4 } = require('uuid');
const VideoSession = require('../models/VideoSession.model');
const { buildToken } = require('../utils/agora');
const { patchAgoraChannel } = require('../utils/appointmentClient');

const EXCHANGE    = 'mediconnect';
const EXCH_TYPE   = 'direct';
const QUEUE       = 'telemedicine.confirmed';
const ROUTING_KEY = 'appointment.confirmed';

let _retryDelay = 1000;
const MAX_DELAY  = 32000;

async function setup() {
  const conn    = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672');
  const channel = await conn.createChannel();
  channel.prefetch(1);

  await channel.assertExchange(EXCHANGE, EXCH_TYPE, { durable: true });
  await channel.assertQueue(QUEUE, { durable: true });
  await channel.bindQueue(QUEUE, EXCHANGE, ROUTING_KEY);

  conn.on('close', () => { console.warn('[tele-consumer] Connection closed – reconnecting…'); scheduleReconnect(); });
  conn.on('error', (err) => { console.error('[tele-consumer] Connection error:', err.message); });

  _retryDelay = 1000;
  console.log(`[tele-consumer] Listening for '${ROUTING_KEY}'`);

  channel.consume(QUEUE, async (msg) => {
    if (!msg) return;

    let payload;
    try {
      payload = JSON.parse(msg.content.toString());
    } catch {
      console.error('[tele-consumer] Bad JSON – discarding');
      channel.ack(msg);
      return;
    }

    const { appointmentId, patientId, doctorId, scheduledAt } = payload;

    try {
      // Idempotent – skip if session already exists for this appointment
      const exists = await VideoSession.findOne({ appointmentId });
      if (exists) {
        console.log(`[tele-consumer] Session already exists for appointment ${appointmentId}`);
        channel.ack(msg);
        return;
      }

      const channelName = 'mc-' + uuidv4().replace(/-/g, '').slice(0, 8);
      const patientUid  = Math.floor(Math.random() * 900000) + 100000;
      const doctorUid   = patientUid + 1;

      const patientRtcToken = buildToken(channelName, patientUid);
      const doctorRtcToken  = buildToken(channelName, doctorUid);

      await VideoSession.create({
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

      // Patch channel name back to appointment-service (best-effort)
      patchAgoraChannel(appointmentId, channelName).catch((err) =>
        console.error('[tele-consumer] patchAgoraChannel failed:', err.message)
      );

      console.log(`[tele-consumer] Session created for appointment ${appointmentId} channel ${channelName}`);
      channel.ack(msg);
    } catch (err) {
      console.error('[tele-consumer] Failed to create session:', err.message);
      channel.nack(msg, false, true); // requeue once
    }
  }, { noAck: false });
}

function scheduleReconnect() {
  console.log(`[tele-consumer] Reconnecting in ${_retryDelay / 1000}s…`);
  setTimeout(async () => {
    try {
      await setup();
    } catch (err) {
      console.error('[tele-consumer] Reconnect failed:', err.message);
      _retryDelay = Math.min(_retryDelay * 2, MAX_DELAY);
      scheduleReconnect();
    }
  }, _retryDelay);
  _retryDelay = Math.min(_retryDelay * 2, MAX_DELAY);
}

exports.start = async function start() {
  try {
    await setup();
  } catch (err) {
    console.error('[tele-consumer] Initial connect failed:', err.message);
    _retryDelay = Math.min(_retryDelay * 2, MAX_DELAY);
    scheduleReconnect();
  }
};
