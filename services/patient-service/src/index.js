'use strict';

require('dotenv').config();
const express = require('express');
const helmet  = require('helmet');
const cors    = require('cors');
const morgan  = require('morgan');

const { connectDB }   = require('../../shared/db');
const patientRoutes   = require('./routes/patient.routes');
const { extractUser, canAccessFile } = require('./middleware/verifyAccess');
const patientCtrl     = require('./controllers/patient.controller');

const app  = express();
const PORT = process.env.PATIENT_SERVICE_PORT || 4001;

// ── Global middleware ────────────────────────────────────────
app.use(helmet());
// app.use(cors()); // Handled by API Gateway
app.use(morgan('dev'));
app.use(express.json());

// ── Health check ─────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: { service: 'patient-service', status: 'ok', timestamp: new Date().toISOString() },
  });
});

// ── Protected file-serving route ─────────────────────────────
// Mounted before /patients so it keeps the /files prefix
app.get(
  '/files/:patientId/:filename',
  extractUser,
  canAccessFile,
  patientCtrl.serveFile
);

// ── Patient API routes ────────────────────────────────────────
app.use('/patients', patientRoutes);

// ── 404 ──────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

// ── Global error handler ─────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[patient-service] Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ── Bootstrap ─────────────────────────────────────────────────
connectDB({ serviceKey: 'patient', serviceLabel: 'patient-service' })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`[patient-service] Running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('[patient-service] DB connection failed:', err.message);
    process.exit(1);
  });

module.exports = app;