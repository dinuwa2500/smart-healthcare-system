'use strict';

require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.API_GATEWAY_PORT || 3000;

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));

// ── Health check ────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// ── Service route map ────────────────────────────────────────
const routes = [
  { prefix: '/api/auth',         target: `http://auth-service:${process.env.AUTH_SERVICE_PORT || 4000}` },
  { prefix: '/api/patients',     target: `http://patient-service:${process.env.PATIENT_SERVICE_PORT || 4001}` },
  { prefix: '/api/doctors',      target: `http://doctor-service:${process.env.DOCTOR_SERVICE_PORT || 4002}` },
  { prefix: '/api/appointments', target: `http://appointment-service:${process.env.APPOINTMENT_SERVICE_PORT || 4003}` },
  { prefix: '/api/payments',     target: `http://payment-service:${process.env.PAYMENT_SERVICE_PORT || 4004}` },
  { prefix: '/api/notifications',target: `http://notification-service:${process.env.NOTIFICATION_SERVICE_PORT || 4005}` },
  { prefix: '/api/telemedicine', target: `http://telemedicine-service:${process.env.TELEMEDICINE_SERVICE_PORT || 4006}` },
  { prefix: '/api/ai',           target: `http://ai-symptom-service:${process.env.AI_SYMPTOM_SERVICE_PORT || 4007}` },
];

routes.forEach(({ prefix, target }) => {
  app.use(
    prefix,
    createProxyMiddleware({
      target,
      changeOrigin: true,
      on: {
        error: (err, _req, res) => {
          console.error(`[Proxy] ${prefix} → ${target} error:`, err.message);
          res.status(502).json({ error: 'Bad Gateway', service: prefix });
        },
      },
    })
  );
});

app.listen(PORT, () => {
  console.log(`[api-gateway] Running on port ${PORT}`);
});

module.exports = app;
