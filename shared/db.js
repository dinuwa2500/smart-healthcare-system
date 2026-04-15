'use strict';

const mongoose = require('mongoose');

let _db = null;

const DEFAULT_DB_NAMES = {
  auth: 'mediconnect_auth',
  patient: 'mediconnect_patient',
  doctor: 'mediconnect_doctor',
  appointment: 'mediconnect_appointment',
  payment: 'mediconnect_payment',
  telemedicine: 'mediconnect_telemedicine',
  ai_symptom: 'mediconnect_ai_symptom',
};

function toEnvPrefix(serviceKey) {
  return String(serviceKey || 'app')
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase();
}

function extractDbNameFromUri(uri) {
  if (!uri) return '';

  try {
    const parsed = new URL(uri);
    const pathname = parsed.pathname.replace(/^\/+/, '');
    return pathname || '';
  } catch (_err) {
    return '';
  }
}

function resolveConnectionConfig(options = {}) {
  const serviceKey = options.serviceKey || 'app';
  const envPrefix = toEnvPrefix(serviceKey);

  const uri =
    process.env[`${envPrefix}_MONGODB_URI`] ||
    process.env.MONGODB_URI;

  const dbName =
    options.dbName ||
    process.env[`${envPrefix}_DB_NAME`] ||
    process.env.MONGODB_DB_NAME ||
    DEFAULT_DB_NAMES[serviceKey] ||
    extractDbNameFromUri(uri);

  return {
    serviceKey,
    serviceLabel: options.serviceLabel || serviceKey,
    uri,
    dbName,
  };
}

async function connectDB(options = {}) {
  if (_db) return _db;

  const { uri, dbName, serviceLabel } = resolveConnectionConfig(options);
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  const conn = mongoose.connection;

  conn.on('error', (err) => {
    console.error(`[MongoDB:${serviceLabel}] Connection error:`, err.message);
  });

  conn.once('open', () => {
    const { host, port, name } = conn;
    console.log(`[MongoDB:${serviceLabel}] Successfully connected!`);
    console.log(`[MongoDB] Host: ${host}${port ? `:${port}` : ''}`);
    console.log(`[MongoDB] Database: ${name}`);
  });

  conn.on('disconnected', () => {
    console.warn(`[MongoDB:${serviceLabel}] Disconnected from database '${conn.name}'`);
  });

  await mongoose.connect(uri, {
    dbName,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  _db = conn;
  return _db;

  return _db;
}

function getDb() {
  if (!_db) {
    throw new Error('Database not initialised. Call connectDB() first.');
  }
  return _db;
}

module.exports = { connectDB, getDb };
