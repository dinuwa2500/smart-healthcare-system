'use strict';

require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const morgan  = require('morgan');

const { connectDB }          = require('../../shared/db');
const { connect: mqConnect } = require('./publishers/rabbitmq');
const paymentRoutes          = require('./routes/payment.routes');

const app  = express();
const PORT = process.env.PAYMENT_SERVICE_PORT || 4004;

// ── Global middleware ────────────────────────────────────────
app.use(helmet());
app.use(morgan('dev'));

// ── Stripe webhook MUST receive raw body ─────────────────────
// Mount raw body parser ONLY for the webhook path, BEFORE express.json()
app.use(
  '/payments/webhook',
  express.raw({ type: 'application/json' })
);

// JSON parser for all other routes
app.use(express.json());

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: { service: 'payment-service', status: 'ok', timestamp: new Date().toISOString() },
  });
});

// ── Routes ───────────────────────────────────────────────────
app.use('/payments', paymentRoutes);

// ── 404 ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[payment-service] Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ── Bootstrap ─────────────────────────────────────────────────
async function start() {
  await connectDB({ serviceKey: 'payment', serviceLabel: 'payment-service' });
  await mqConnect();
  app.listen(PORT, () => {
    console.log(`[payment-service] Running on port ${PORT}`);
  });
}

start().catch((err) => {
  console.error('[payment-service] Startup failed:', err.message);
  process.exit(1);
});

module.exports = app;
