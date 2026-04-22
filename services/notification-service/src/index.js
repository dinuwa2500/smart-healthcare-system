'use strict';

require('dotenv').config();
const express = require('express');
const { start: startConsumer } = require('./consumers/consumer');

const app  = express();
const PORT = process.env.PORT || 4005;

// ── Health check (only HTTP endpoint) ───────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: { service: 'notification-service', status: 'ok', timestamp: new Date().toISOString() },
  });
});

// ── Start HTTP + RabbitMQ consumer ───────────────────────────
app.listen(PORT, () => {
  console.log(`[notification-service] Health endpoint on port ${PORT}`);
});

startConsumer().catch((err) => {
  console.error('[notification-service] Consumer failed to start:', err.message);
});
