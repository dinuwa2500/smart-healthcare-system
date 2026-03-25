const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');

// Search doctors by specialty (proxied to Doctor Service)
router.get('/doctors/search', appointmentController.searchDoctors);

// Booking
router.post('/book', appointmentController.bookAppointment);

// Get my appointments (works for both patients and doctors based on role)
router.get('/my', appointmentController.getMyAppointments);

// Get single appointment
router.get('/:id', appointmentController.getAppointmentById);

// Modify / reschedule
router.put('/:id', appointmentController.modifyAppointment);

// Cancel
router.put('/:id/cancel', appointmentController.cancelAppointment);

// Update status (Doctor confirms / completes)
router.patch('/:id/status', appointmentController.updateStatus);

// Track status in real-time (polling)
router.get('/:id/track', appointmentController.trackStatus);

module.exports = router;
