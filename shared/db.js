'use strict';

const mongoose = require('mongoose');
let _db = null;

async function connectDB() {
  if (_db) return _db;

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  await mongoose.connect(uri, {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
  });

  _db = mongoose.connection;

  _db.on('error', (err) => {
    console.error('[MongoDB] Connection error:', err.message);
  });

  _db.once('open', () => {
    console.log('[MongoDB] Connected to Atlas cluster');
  });

  _db.on('disconnected', () => {
    console.warn('[MongoDB] Disconnected from Atlas cluster');
  });

  return _db;
}
function getDb() {
  if (!_db) {
    throw new Error('Database not initialised. Call connectDB() first.');
  }
  return _db;
}

module.exports = { connectDB, getDb };
