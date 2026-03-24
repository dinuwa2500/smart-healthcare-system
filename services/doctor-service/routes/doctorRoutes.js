const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');

// Profile management
router.get('/profile', doctorController.getProfile);
router.put('/profile', doctorController.upsertProfile);

// Public routes (browsing doctors)
router.get('/all', doctorController.getAllDoctors);
router.get('/:id', doctorController.getDoctorById);

// Availability
router.put('/availability', doctorController.setAvailability);
router.get('/:id/availability', doctorController.getAvailability);

// Appointment response
router.post('/appointments/respond', doctorController.respondToAppointment);

// Prescriptions
router.post('/prescriptions', doctorController.issuePrescription);
router.get('/prescriptions', doctorController.getIssuedPrescriptions);

module.exports = router;
