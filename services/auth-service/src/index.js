'use strict';

require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');

const { connectDB } = require('../../shared/db');
const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.AUTH_SERVICE_PORT || 4000;

// ── Global middleware ────────────────────────────────────────
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

// ── Health check ────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ success: true, data: { service: 'auth-service', status: 'ok', timestamp: new Date().toISOString() } });
});

// ── Routes ───────────────────────────────────────────────────
app.use('/auth', authRoutes);

// ── 404 handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[auth-service] Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ── Bootstrap ────────────────────────────────────────────────
connectDB({ serviceKey: 'auth', serviceLabel: 'auth-service' })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[auth-service] Running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[auth-service] DB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
