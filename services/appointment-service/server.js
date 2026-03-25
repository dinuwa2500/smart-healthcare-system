const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const appointmentRoutes = require('./routes/appointmentRoutes');

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3003;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/healthcare_appointments';

// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => console.log('Appointment Service: Connected to MongoDB'))
  .catch(err => console.error('Could not connect to MongoDB', err));

// Routes
app.use('/', appointmentRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'appointment-service' });
});

app.listen(PORT, () => console.log(`Appointment Service running on port ${PORT}`));
