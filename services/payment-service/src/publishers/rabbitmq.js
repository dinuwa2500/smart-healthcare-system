'use strict';

const amqp = require('amqplib');

const EXCHANGE  = 'mediconnect';
const EXCH_TYPE = 'direct';

let _channel = null;

async function connect() {
  try {
    const conn = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672');
    _channel   = await conn.createChannel();
    await _channel.assertExchange(EXCHANGE, EXCH_TYPE, { durable: true });
    console.log('[RabbitMQ] Channel ready on exchange:', EXCHANGE);

    conn.on('close', () => { console.warn('[RabbitMQ] Connection closed'); _channel = null; });
    conn.on('error', (err) => { console.error('[RabbitMQ] Error:', err.message); _channel = null; });
  } catch (err) {
    console.error('[RabbitMQ] Failed to connect:', err.message);
    _channel = null;
  }
}

function publish(routingKey, payload) {
  setImmediate(async () => {
    try {
      if (!_channel) await connect();
      if (!_channel) { console.error(`[RabbitMQ] No channel – dropping: ${routingKey}`); return; }
      _channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), { persistent: true });
    } catch (err) {
      console.error(`[RabbitMQ] Publish failed (${routingKey}):`, err.message);
    }
  });
}

module.exports = { connect, publish };
