'use strict';

require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');

const { connectDB }   = require('../../shared/db');
const doctorRoutes    = require('./routes/doctor.routes');
const patientRoutes   = require('./routes/patient.routes');

const app  = express();
const PORT = process.env.DOCTOR_SERVICE_PORT || 4002;

// ── Global middleware ────────────────────────────────────────
app.use(helmet());
// Internal service behind gateway
// app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: { service: 'doctor-service', status: 'ok', timestamp: new Date().toISOString() },
  });
});

// ── Routes ───────────────────────────────────────────────────
app.use('/doctors',  doctorRoutes);
app.use('/patients', patientRoutes);

// ── 404 ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[doctor-service] Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ── Bootstrap ─────────────────────────────────────────────────
connectDB({ serviceKey: 'doctor', serviceLabel: 'doctor-service' })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[doctor-service] Running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[doctor-service] DB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;
