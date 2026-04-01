'use strict';

const { validationResult } = require('express-validator');
const DoctorProfile      = require('../models/DoctorProfile.model');
const DoctorSlot         = require('../models/DoctorSlot.model');
const DoctorPrescription = require('../models/DoctorPrescription.model');
const { ok, fail }       = require('../utils/response');

// ── GET /doctors  (PUBLIC – search) ─────────────────────────
exports.search = async (req, res) => {
  try {
    const { specialty, name, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (specialty) filter.specialization = specialty;
    if (name) filter.$text = { $search: name };

    const skip = (Number(page) - 1) * Number(limit);

    const [doctors, total] = await Promise.all([
      DoctorProfile.find({})
        .select('-__v')
        .skip(skip)
        .limit(Number(limit)),
      DoctorProfile.countDocuments({}),
    ]);

    return ok(res, { doctors, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[doctor] search:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── GET /doctors/admin/all  (role:admin) ─────────────────────
exports.listAll = async (req, res) => {
  try {
    const { specialty, name, verified, page = 1, limit = 50 } = req.query;
    const filter = {};

    if (specialty) filter.specialization = specialty;
    if (name) filter.$text = { $search: name };
    if (verified === 'true') filter.isVerified = true;
    if (verified === 'false') filter.isVerified = false;

    const skip = (Number(page) - 1) * Number(limit);
    const [doctors, total] = await Promise.all([
      DoctorProfile.find(filter)
        .select('-__v')
        .skip(skip)
        .limit(Number(limit))
        .sort({ createdAt: -1 }),
      DoctorProfile.countDocuments(filter),
    ]);

    return ok(res, { doctors, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[doctor] listAll:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── GET /doctors/:id  (PUBLIC) ───────────────────────────────
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    let doctor = null;

    // 1. Try by profile _id
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      doctor = await DoctorProfile.findById(id).select('-__v');
    }

    // 2. Try by authUserId (fallback)
    if (!doctor) {
      doctor = await DoctorProfile.findOne({ authUserId: id }).select('-__v');
    }

    if (!doctor) return fail(res, 'Doctor not found', 404);
    return ok(res, doctor);
  } catch (err) {
    console.error('[doctor] getById:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── GET /doctors/:id/slots  (PUBLIC – ?date=YYYY-MM-DD) ─────
exports.getSlots = async (req, res) => {
  try {
    const { id } = req.params;
    let doctor = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      doctor = await DoctorProfile.findById(id);
    }

    if (!doctor) {
      doctor = await DoctorProfile.findOne({ authUserId: id });
    }

    if (!doctor) return fail(res, 'Doctor not found', 404);

    const filter = { doctorId: doctor._id, isActive: true };

    if (req.query.date) {
      const day = new Date(req.query.date).getDay();
      if (!isNaN(day)) filter.dayOfWeek = day;
    }

    const slots = await DoctorSlot.find(filter).select('-__v');
    return ok(res, slots);
  } catch (err) {
    console.error('[doctor] getSlots:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── POST /doctors/register  (role:doctor) ────────────────────
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, errors.array(), 422);

  try {
    const existing = await DoctorProfile.findOne({ authUserId: req.userId });
    if (existing) return fail(res, 'Profile already exists for this doctor', 409);

    const profile = await DoctorProfile.create({ ...req.body, authUserId: req.userId });
    return ok(res, profile, 201);
  } catch (err) {
    console.error('[doctor] register:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── GET /doctors/me  (role:doctor) ────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({ authUserId: req.userId }).select('-__v');
    if (!profile) return fail(res, 'Doctor profile not found', 404);
    return ok(res, profile);
  } catch (err) {
    console.error('[doctor] getMe:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── PUT /doctors/me  (role:doctor) ───────────────────────────
exports.updateMe = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOneAndUpdate(
      { authUserId: req.userId },
      req.body,
      { new: true, runValidators: true }
    ).select('-__v');

    if (!profile) return fail(res, 'Doctor profile not found', 404);
    return ok(res, profile);
  } catch (err) {
    console.error('[doctor] updateMe:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── POST /doctors/me/slots  (role:doctor) ────────────────────
exports.setSlots = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, errors.array(), 422);

  try {
    const profile = await DoctorProfile.findOne({ authUserId: req.userId });
    if (!profile) return fail(res, 'Doctor profile not found', 404);

    const slots = Array.isArray(req.body) ? req.body : [req.body];
    const created = await DoctorSlot.insertMany(
      slots.map((s) => ({ ...s, doctorId: profile._id }))
    );
    return ok(res, created, 201);
  } catch (err) {
    console.error('[doctor] setSlots:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── DELETE /doctors/me/slots/:id  (role:doctor) ──────────────
exports.deleteSlot = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({ authUserId: req.userId });
    if (!profile) return fail(res, 'Doctor profile not found', 404);

    const slot = await DoctorSlot.findOneAndDelete({
      _id: req.params.id,
      doctorId: profile._id,
    });
    if (!slot) return fail(res, 'Slot not found or not owned by this doctor', 404);
    return ok(res, { deleted: true, id: req.params.id });
  } catch (err) {
    console.error('[doctor] deleteSlot:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── POST /doctors/me/slots/generate  (role:doctor) ───────────
exports.generateDefaultSlots = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({ authUserId: req.userId });
    if (!profile) return fail(res, 'Doctor profile not found', 404);

    // Clear existing slots first
    await DoctorSlot.deleteMany({ doctorId: profile._id });

    const defaultSlots = [];
    const times = [
      '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', 
      '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
    ];
    
    for (let day = 0; day <= 6; day++) {
      times.forEach(time => {
        defaultSlots.push({
          doctorId: profile._id,
          dayOfWeek: day,
          startTime: time,
          duration: 30,
          isActive: true
        });
      });
    }

    const created = await DoctorSlot.insertMany(defaultSlots);
    return ok(res, { message: 'Default slots generated', count: created.length });
  } catch (err) {
    console.error('[doctor] generateDefaultSlots:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── POST /doctors/me/prescriptions  (role:doctor) ────────────
exports.issuePrescription = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, errors.array(), 422);

  try {
    const profile = await DoctorProfile.findOne({ authUserId: req.userId });
    if (!profile) return fail(res, 'Doctor profile not found', 404);

    const prescription = await DoctorPrescription.create({
      ...req.body,
      doctorId: profile._id,
    });
    return ok(res, prescription, 201);
  } catch (err) {
    console.error('[doctor] issuePrescription:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── GET /doctors/me/prescriptions  (role:doctor) ─────────────
exports.myPrescriptions = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({ authUserId: req.userId });
    if (!profile) return fail(res, 'Doctor profile not found', 404);

    const prescriptions = await DoctorPrescription.find({ doctorId: profile._id })
      .sort({ issuedAt: -1 });
    return ok(res, prescriptions);
  } catch (err) {
    console.error('[doctor] myPrescriptions:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── GET /doctors/me/patients  (role:doctor) ──────────────────
exports.myPatients = async (req, res) => {
  try {
    const profile = await DoctorProfile.findOne({ authUserId: req.userId });
    if (!profile) return fail(res, 'Doctor profile not found', 404);

    const rawPatients = await DoctorPrescription.distinct('patientId', {
      doctorId: profile._id,
    });
    return ok(res, { patients: rawPatients, total: rawPatients.length });
  } catch (err) {
    console.error('[doctor] myPatients:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── PATCH /doctors/:id/verify  (role:admin) ──────────────────
exports.verifyDoctor = async (req, res) => {
  try {
    const profile = await DoctorProfile.findByIdAndUpdate(
      req.params.id,
      { isVerified: true },
      { new: true }
    ).select('-__v');

    if (!profile) return fail(res, 'Doctor not found', 404);
    return ok(res, profile);
  } catch (err) {
    console.error('[doctor] verifyDoctor:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── GET /doctors/prescriptions?patientId=  (internal + role:doctor) ──
// Also used by patient-service proxy call: GET /doctors/prescriptions?patientId=...
exports.prescriptionsByPatient = async (req, res) => {
  try {
    const { patientId } = req.query;
    if (!patientId) return fail(res, 'patientId query param is required', 400);

    const prescriptions = await DoctorPrescription.find({ patientId })
      .populate('doctorId', 'firstName lastName specialization')
      .sort({ issuedAt: -1 });

    return ok(res, prescriptions);
  } catch (err) {
    console.error('[doctor] prescriptionsByPatient:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};
