const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const doctorRoutes = require('./routes/doctorRoutes');

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3002;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/healthcare_doctors';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Doctor Service: Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Routes
app.use('/', doctorRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'doctor-service' });
});

app.listen(PORT, () => console.log(`Doctor Service running on port ${PORT}`));
