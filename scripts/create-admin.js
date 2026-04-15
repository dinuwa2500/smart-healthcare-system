const bcrypt = require('bcryptjs');
const { MongoClient } = require('mongodb');

async function createAdmin() {
  const hash = bcrypt.hashSync('admin123', 12);
  console.log('Generated hash:', hash);
  
  const client = new MongoClient('mongodb://mongodb:27017');
  try {
    await client.connect();
    const db = client.db('smarthealthcare');
    const result = await db.collection('users').insertOne({
      email: 'admin@mediconnect.com',
      passwordHash: hash,
      role: 'admin',
      isActive: true,
      isVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('Admin created:', result.insertedId);
  } finally {
    await client.close();
  }
}

createAdmin();
