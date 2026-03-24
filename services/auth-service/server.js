const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const { createProxyMiddleware } = require('http-proxy-middleware');
const User = require('./models/User');
const authMiddleware = require('./middleware/authMiddleware');

const authRoutes = require('./routes/authRoutes');

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/healthcare_system';

// Service URLs (use env vars for Docker, fallback to localhost for local dev)
const PATIENT_SERVICE_URL = process.env.PATIENT_SERVICE_URL || 'http://localhost:3001';
const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:3002';
const APPOINTMENT_SERVICE_URL = process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3003';
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3004';
const TELEMEDICINE_SERVICE_URL = process.env.TELEMEDICINE_SERVICE_URL || 'http://localhost:3005';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006';
const SYMPTOM_SERVICE_URL = process.env.SYMPTOM_SERVICE_URL || 'http://localhost:3007';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// --- Auth Routes ---
app.use('/api/auth', authRoutes);

// --- API Gateway Proxying ---

// Proxy Patient Service (port 3001)
app.use('/api/patients', authMiddleware(['Patient', 'Admin']), createProxyMiddleware({
  target: PATIENT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/patients': '' },
  on: {
    proxyReq: (proxyReq, req) => {
      // Forward user info from JWT to downstream service
      if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.id);
        proxyReq.setHeader('x-user-role', req.user.role);
      }
    }
  }
}));

// Proxy Doctor Service (port 3002)
app.use('/api/doctors', authMiddleware(['Doctor', 'Patient', 'Admin']), createProxyMiddleware({
  target: DOCTOR_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/doctors': '' },
  on: {
    proxyReq: (proxyReq, req) => {
      if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.id);
        proxyReq.setHeader('x-user-role', req.user.role);
      }
    }
  }
}));

// Proxy Appointment Service (port 3003)
app.use('/api/appointments', authMiddleware(['Patient', 'Doctor', 'Admin']), createProxyMiddleware({
  target: APPOINTMENT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/appointments': '' },
  on: {
    proxyReq: (proxyReq, req) => {
      if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.id);
        proxyReq.setHeader('x-user-role', req.user.role);
      }
    }
  }
}));

// Proxy Payment Service (port 3004)
app.use('/api/payments', authMiddleware(['Patient', 'Admin']), createProxyMiddleware({
  target: PAYMENT_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/payments': '' },
  on: {
    proxyReq: (proxyReq, req) => {
      if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.id);
        proxyReq.setHeader('x-user-role', req.user.role);
      }
    }
  }
}));

// Proxy Telemedicine Service (port 3005)
app.use('/api/telemedicine', authMiddleware(['Patient', 'Doctor', 'Admin']), createProxyMiddleware({
  target: TELEMEDICINE_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api': '' },
  on: {
    proxyReq: (proxyReq, req) => {
      if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.id);
        proxyReq.setHeader('x-user-role', req.user.role);
      }
    }
  }
}));

// Proxy Notification Service (port 3006)
app.use('/api/notifications', authMiddleware(['Patient', 'Doctor', 'Admin']), createProxyMiddleware({
  target: NOTIFICATION_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/notifications': '' },
  on: {
    proxyReq: (proxyReq, req) => {
      if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.id);
        proxyReq.setHeader('x-user-role', req.user.role);
      }
    }
  }
}));

// Proxy AI Symptom Checker Service (port 3007)
app.use('/api/symptoms', authMiddleware(['Patient', 'Doctor', 'Admin']), createProxyMiddleware({
  target: SYMPTOM_SERVICE_URL,
  changeOrigin: true,
  pathRewrite: { '^/api/symptoms': '' },
  on: {
    proxyReq: (proxyReq, req) => {
      if (req.user) {
        proxyReq.setHeader('x-user-id', req.user.id);
        proxyReq.setHeader('x-user-role', req.user.role);
      }
    }
  }
}));

app.listen(PORT, () => console.log('Auth Service & Gateway running on port ' + PORT));
