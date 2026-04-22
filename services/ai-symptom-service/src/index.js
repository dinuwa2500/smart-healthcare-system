'use strict';

require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');

const { connectDB }   = require('../shared/db');
const symptomRoutes   = require('./routes/symptom.routes');

const app  = express();
const PORT = process.env.PORT || 4007;

// ── Global middleware ────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(morgan('dev'));
app.use(express.json());

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: { service: 'ai-symptom-service', status: 'ok', timestamp: new Date().toISOString() },
  });
});

// ── Routes ───────────────────────────────────────────────────
app.use('/symptoms', symptomRoutes);

// ── 404 ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[ai-symptom-service] Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ── Bootstrap ─────────────────────────────────────────────────
connectDB({ serviceKey: 'ai_symptom', serviceLabel: 'ai-symptom-service' })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[ai-symptom-service] Running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[ai-symptom-service] DB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
