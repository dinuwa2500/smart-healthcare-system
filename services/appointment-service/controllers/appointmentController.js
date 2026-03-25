const Appointment = require('../models/Appointment');
const axios = require('axios');

const DOCTOR_SERVICE_URL = process.env.DOCTOR_SERVICE_URL || 'http://localhost:3002';

// --- Search Doctors by Specialty ---
exports.searchDoctors = async (req, res) => {
  try {
    const { specialty, name } = req.query;
    const params = {};
    if (specialty) params.specialty = specialty;
    if (name) params.name = name;

    // Call Doctor Service directly (inter-service communication)
    const response = await axios.get(`${DOCTOR_SERVICE_URL}/all`, { params });
    res.json(response.data);
  } catch (err) {
    if (err.response) {
      return res.status(err.response.status).json(err.response.data);
    }
    res.status(500).json({ message: 'Error contacting Doctor Service', error: err.message });
  }
};

// --- Book Appointment ---
exports.bookAppointment = async (req, res) => {
  try {
    const patientId = req.headers['x-user-id'];
    const { doctorId, doctorName, patientName, specialty, date, timeSlot, reason } = req.body;

    if (!doctorId || !date || !timeSlot?.startTime || !timeSlot?.endTime) {
      return res.status(400).json({ message: 'doctorId, date, and timeSlot (startTime, endTime) are required' });
    }

    // Check for double-booking
    const existing = await Appointment.findOne({
      doctorId,
      date: new Date(date),
      'timeSlot.startTime': timeSlot.startTime,
      status: { $nin: ['Cancelled'] }
    });

    if (existing) {
      return res.status(409).json({ message: 'This time slot is already booked' });
    }

    const appointment = new Appointment({
      patientId,
      patientName: patientName || '',
      doctorId,
      doctorName: doctorName || '',
      specialty: specialty || '',
      date: new Date(date),
      timeSlot,
      reason: reason || '',
      statusHistory: [{ status: 'Pending', changedBy: patientId }]
    });

    await appointment.save();
    res.status(201).json({ message: 'Appointment booked successfully', appointment });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: 'This time slot is already booked' });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// --- Get Appointments for Current User ---
exports.getMyAppointments = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const role = req.headers['x-user-role'];
    const { status } = req.query;

    const filter = {};
    if (role === 'Doctor') {
      filter.doctorId = userId;
    } else {
      filter.patientId = userId;
    }
    if (status) filter.status = status;

    const appointments = await Appointment.find(filter).sort({ date: -1 });
    res.json(appointments);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// --- Get Single Appointment by ID ---
exports.getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// --- Modify / Reschedule Appointment ---
exports.modifyAppointment = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // Only the patient who booked or an admin can modify
    if (appointment.patientId.toString() !== userId && req.headers['x-user-role'] !== 'Admin') {
      return res.status(403).json({ message: 'Not authorized to modify this appointment' });
    }

    if (appointment.status === 'Cancelled' || appointment.status === 'Completed') {
      return res.status(400).json({ message: `Cannot modify a ${appointment.status.toLowerCase()} appointment` });
    }

    const { date, timeSlot, reason } = req.body;
    if (date) appointment.date = new Date(date);
    if (timeSlot) appointment.timeSlot = timeSlot;
    if (reason) appointment.reason = reason;

    appointment.statusHistory.push({ status: 'Modified', changedBy: userId });
    await appointment.save();

    res.json({ message: 'Appointment modified successfully', appointment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// --- Cancel Appointment ---
exports.cancelAppointment = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    if (appointment.status === 'Cancelled') {
      return res.status(400).json({ message: 'Appointment is already cancelled' });
    }
    if (appointment.status === 'Completed') {
      return res.status(400).json({ message: 'Cannot cancel a completed appointment' });
    }

    appointment.status = 'Cancelled';
    appointment.cancellationReason = req.body.reason || '';
    appointment.statusHistory.push({ status: 'Cancelled', changedBy: userId });
    await appointment.save();

    res.json({ message: 'Appointment cancelled successfully', appointment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// --- Update Appointment Status (Doctor confirms / completes) ---
exports.updateStatus = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const { status } = req.body;

    if (!['Pending', 'Confirmed', 'Completed', 'Cancelled'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be Pending, Confirmed, Completed, or Cancelled' });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    appointment.status = status;
    if (status === 'Cancelled' && req.body.reason) {
      appointment.cancellationReason = req.body.reason;
    }
    appointment.statusHistory.push({ status, changedBy: userId });
    await appointment.save();

    res.json({ message: `Appointment status updated to ${status}`, appointment });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// --- Track Appointment Status (real-time polling) ---
exports.trackStatus = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .select('status statusHistory date timeSlot doctorName');
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    res.json({
      currentStatus: appointment.status,
      date: appointment.date,
      timeSlot: appointment.timeSlot,
      doctorName: appointment.doctorName,
      history: appointment.statusHistory
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
