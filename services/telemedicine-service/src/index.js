'use strict';

require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');

const { connectDB }          = require('../shared/db');
const { connect: mqConnect } = require('./publishers/rabbitmq');
const { start: startConsumer } = require('./consumers/consumer');
const sessionRoutes          = require('./routes/session.routes');

const app  = express();
const PORT = process.env.PORT || 4006;

// ── Global middleware ────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: { service: 'telemedicine-service', status: 'ok', timestamp: new Date().toISOString() },
  });
});

// ── Routes ───────────────────────────────────────────────────
app.use('/sessions', sessionRoutes);

// ── 404 ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[telemedicine-service] Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ── Bootstrap ─────────────────────────────────────────────────
async function start() {
  await connectDB({ serviceKey: 'telemedicine', serviceLabel: 'telemedicine-service' });
  await mqConnect();
  startConsumer();
  app.listen(PORT, () => {
    console.log(`[telemedicine-service] Running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('[telemedicine-service] Startup failed:', err.message);
  process.exit(1);
});

module.exports = app;
