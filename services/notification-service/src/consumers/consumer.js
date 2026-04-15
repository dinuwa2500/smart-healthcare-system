'use strict';

const amqp     = require('amqplib');
const { dispatch } = require('../handlers/index');

const EXCHANGE   = 'mediconnect';
const EXCH_TYPE  = 'direct';
const QUEUE      = 'notifications';
const DLQ        = 'notifications.dlq';
const MAX_RETRIES = 3;

const ROUTING_KEYS = [
  'appointment.booked',
  'appointment.confirmed',
  'appointment.cancelled',
  'appointment.completed',
  'payment.succeeded',
  'payment.failed',
];

let _conn    = null;
let _channel = null;
let _retryDelay = 1000;
const MAX_DELAY  = 32000;

// ── Connection + channel setup ───────────────────────────────
async function setup() {
  _conn    = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672');
  _channel = await _conn.createChannel();
  _channel.prefetch(1);

  // Main exchange
  await _channel.assertExchange(EXCHANGE, EXCH_TYPE, { durable: true });

  // Dead-letter queue (plain, no DLX of its own)
  await _channel.assertQueue(DLQ, { durable: true });

  // Main consumer queue – bind all routing keys
  await _channel.assertQueue(QUEUE, { durable: true });

  for (const key of ROUTING_KEYS) {
    await _channel.bindQueue(QUEUE, EXCHANGE, key);
  }

  _conn.on('close', () => {
    console.warn('[consumer] Connection closed – reconnecting…');
    _conn = _channel = null;
    scheduleReconnect();
  });
  _conn.on('error', (err) => {
    console.error('[consumer] Connection error:', err.message);
    _conn = _channel = null;
  });

  _retryDelay = 1000; // reset backoff on successful connect
  console.log(`[consumer] Listening on queue: ${QUEUE}`);

  _channel.consume(QUEUE, handleMessage, { noAck: false });
}

// ── Message handler ──────────────────────────────────────────
async function handleMessage(msg) {
  if (!msg) return;

  const routingKey  = msg.fields.routingKey;
  const retryCount  = parseInt(msg.properties.headers?.['x-retry-count'] || 0, 10);

  let payload;
  try {
    payload = JSON.parse(msg.content.toString());
  } catch (parseErr) {
    console.error('[consumer] Bad JSON – discarding:', parseErr.message);
    _channel.ack(msg);
    return;
  }

  try {
    await dispatch(routingKey, payload);
    _channel.ack(msg);
  } catch (err) {
    console.error(`[consumer] Handler error (retry ${retryCount}/${MAX_RETRIES}) [${routingKey}]:`, err.message);

    if (retryCount < MAX_RETRIES) {
      // Re-publish with incremented retry counter, ack the current copy
      _channel.publish(EXCHANGE, routingKey, msg.content, {
        persistent: true,
        headers: {
          ...msg.properties.headers,
          'x-retry-count': retryCount + 1,
        },
      });
      _channel.ack(msg);
    } else {
      // Max retries exhausted – move to DLQ
      console.error(`[consumer] Max retries reached – sending to DLQ [${routingKey}]`);
      _channel.sendToQueue(DLQ, msg.content, {
        persistent: true,
        headers: {
          ...msg.properties.headers,
          'x-failed-routing-key': routingKey,
          'x-retry-count':        retryCount,
        },
      });
      _channel.ack(msg);
    }
  }
}

// ── Exponential backoff reconnect ────────────────────────────
function scheduleReconnect() {
  console.log(`[consumer] Reconnecting in ${_retryDelay / 1000}s…`);
  setTimeout(async () => {
    try {
      await setup();
    } catch (err) {
      console.error('[consumer] Reconnect failed:', err.message);
      _retryDelay = Math.min(_retryDelay * 2, MAX_DELAY);
      scheduleReconnect();
    }
  }, _retryDelay);
  _retryDelay = Math.min(_retryDelay * 2, MAX_DELAY);
}

// ── Start ────────────────────────────────────────────────────
exports.start = async function start() {
  try {
    await setup();
  } catch (err) {
    console.error('[consumer] Initial connect failed:', err.message);
    _retryDelay = Math.min(_retryDelay * 2, MAX_DELAY);
    scheduleReconnect();
  }
};
