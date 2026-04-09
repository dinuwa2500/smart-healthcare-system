'use strict';

require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const morgan  = require('morgan');

const { connectDB }      = require('../../shared/db');
const { connect: mqConnect } = require('./publishers/rabbitmq');
const appointmentRoutes  = require('./routes/appointment.routes');

const app  = express();
const PORT = process.env.APPOINTMENT_SERVICE_PORT || 4003;

// ── Global middleware ────────────────────────────────────────
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: { service: 'appointment-service', status: 'ok', timestamp: new Date().toISOString() },
  });
});

// ── Routes ───────────────────────────────────────────────────
app.use('/appointments', appointmentRoutes);

// ── 404 ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[appointment-service] Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ── Bootstrap ─────────────────────────────────────────────────
async function start() {
  await connectDB({ serviceKey: 'appointment', serviceLabel: 'appointment-service' });
  // Connect to RabbitMQ best-effort; service still starts if broker is down
  await mqConnect();
  app.listen(PORT, () => {
    console.log(`[appointment-service] Running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('[appointment-service] Startup failed:', err.message);
  process.exit(1);
});

module.exports = app;
