'use strict';

require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet());
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:3001';
app.use(cors({ credentials: true, origin: true })); // Reflect origin for reliability with credentials
app.use(morgan('combined'));

// ── Health check 
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway', timestamp: new Date().toISOString() });
});

// ── Service route map
const routes = {
  '/auth':         process.env.AUTH_SERVICE_URL         || 'http://localhost:4000',
  '/patients':     process.env.PATIENT_SERVICE_URL       || 'http://localhost:4001',
  '/files':        process.env.PATIENT_SERVICE_URL       || 'http://localhost:4001',
  '/doctors':      process.env.DOCTOR_SERVICE_URL        || 'http://localhost:4002',
  '/appointments': process.env.APPOINTMENT_SERVICE_URL   || 'http://localhost:4003',
  '/payments':     process.env.PAYMENT_SERVICE_URL       || 'http://localhost:4004',
  '/notifications':process.env.NOTIFICATION_SERVICE_URL  || 'http://localhost:4005',
  '/symptoms':     process.env.AI_SYMPTOM_SERVICE_URL    || 'http://localhost:4007',
  '/sessions':     process.env.TELEMEDICINE_SERVICE_URL  || 'http://localhost:4006',
  '/telemedicine': process.env.TELEMEDICINE_SERVICE_URL  || 'http://localhost:4006',
  '/ai':           process.env.AI_SYMPTOM_SERVICE_URL    || 'http://localhost:4007',
};

app.use('/api', (req, _res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.slice(7);

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload?.sub) {
      req.headers['x-user-id'] = String(payload.sub);
    }
    if (payload?.role) {
      req.headers['x-user-role'] = String(payload.role);
    }
  } catch (_err) {
    // Let downstream services handle invalid or expired tokens consistently.
  }

  return next();
});

app.use(
  '/api',
  createProxyMiddleware({
    target: 'http://localhost', // Fallback, router handles actual targets
    changeOrigin: true,
    pathRewrite: {
      '^/api': '', // Strip /api prefix so /api/auth/register becomes /auth/register
    },
    router: (req) => {
      // req.url is the path after /api, e.g., /auth/register or /doctors?page=1
      const path = req.url.split('?')[0].split('/')[1]; // gets 'auth' or 'doctors'
      return routes[`/${path}`];
    },
    on: {
      error: (err, req, res) => {
        console.error(`[Proxy] error:`, err.message);
        res.status(502).json({ error: 'Bad Gateway', originalUrl: req.originalUrl });
      },
    },
  })
);

app.listen(PORT, () => {
  console.log(`[api-gateway] Running on port ${PORT}`);
});

module.exports = app;
