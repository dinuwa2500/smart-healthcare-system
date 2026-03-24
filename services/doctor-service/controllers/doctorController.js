const Doctor = require('../models/Doctor');

// Create or update doctor profile
exports.upsertProfile = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const profileData = { ...req.body, userId };

    let doctor = await Doctor.findOne({ userId });
    if (doctor) {
      Object.assign(doctor, profileData);
      await doctor.save();
      return res.json({ message: 'Profile updated successfully', doctor });
    }

    doctor = new Doctor(profileData);
    await doctor.save();
    res.status(201).json({ message: 'Profile created successfully', doctor });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get doctor profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get doctor by ID (public – used by patients to browse)
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('-prescriptionsIssued');
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all doctors (public – browse/search)
exports.getAllDoctors = async (req, res) => {
  try {
    const { specialty, name } = req.query;
    const filter = { isVerified: true };
    if (specialty) filter.specialty = new RegExp(specialty, 'i');
    if (name) filter.name = new RegExp(name, 'i');

    const doctors = await Doctor.find(filter).select('-prescriptionsIssued');
    res.json(doctors);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// --- Availability Management ---

// Set / replace entire availability schedule
exports.setAvailability = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    doctor.availability = req.body.availability; // expects array of time slots
    await doctor.save();
    res.json({ message: 'Availability updated', availability: doctor.availability });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get availability for a doctor
exports.getAvailability = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) return res.status(404).json({ message: 'Doctor not found' });
    res.json(doctor.availability);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// --- Appointment Accept / Reject ---
// NOTE: This updates appointment status via the Appointment Service in a real setup.
// For now, this is a stub that can be called by the API Gateway.

exports.respondToAppointment = async (req, res) => {
  try {
    const { appointmentId, action } = req.body; // action: 'accept' | 'reject'
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ message: 'Action must be "accept" or "reject"' });
    }

    // In production, this would call the Appointment Service via HTTP or message queue
    // For now, return a success response
    res.json({
      message: `Appointment ${appointmentId} has been ${action}ed`,
      appointmentId,
      action
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// --- Digital Prescriptions ---

// Issue a prescription for a patient
exports.issuePrescription = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });

    const { patientId, patientName, diagnosis, medication, dosage, instructions } = req.body;
    if (!patientId || !diagnosis || !medication || !dosage) {
      return res.status(400).json({ message: 'patientId, diagnosis, medication, and dosage are required' });
    }

    const prescription = {
      patientId,
      patientName: patientName || '',
      diagnosis,
      medication,
      dosage,
      instructions: instructions || ''
    };

    doctor.prescriptionsIssued.push(prescription);
    await doctor.save();

    const issued = doctor.prescriptionsIssued[doctor.prescriptionsIssued.length - 1];
    res.status(201).json({ message: 'Prescription issued successfully', prescription: issued });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// Get all prescriptions issued by this doctor
exports.getIssuedPrescriptions = async (req, res) => {
  try {
    const userId = req.headers['x-user-id'];
    const doctor = await Doctor.findOne({ userId });
    if (!doctor) return res.status(404).json({ message: 'Doctor profile not found' });
    res.json(doctor.prescriptionsIssued);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};
