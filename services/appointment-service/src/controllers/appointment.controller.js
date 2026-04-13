'use strict';

const { validationResult } = require('express-validator');
const Appointment          = require('../models/Appointment.model');
const { ok, fail }         = require('../utils/response');
const { validateTransition }= require('../utils/transitions');
const mq                   = require('../publishers/rabbitmq');

// ── POST /appointments  (role:patient) ───────────────────────
exports.book = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, errors.array(), 422);

  try {
    const appt = await Appointment.create({ ...req.body, patientId: req.userId });

    mq.publish('appointment.booked', {
      appointmentId: appt._id,
      patientId:     appt.patientId,
      patientName:   appt.patientName,
      doctorId:      appt.doctorId,
      doctorName:    appt.doctorName,
      slotDate:      appt.slotDate,
      slotTime:      appt.slotTime,
      consultationType: appt.consultationType,
    });

    return ok(res, appt, 201);
  } catch (err) {
    console.error('[appointment] book:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── GET /appointments/:id ─────────────────────────────────────
exports.getById = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return fail(res, 'Appointment not found', 404);

    // Only involved parties or admin may view
    if (
      req.userRole !== 'admin' &&
      String(req.userId) !== String(appt.patientId) &&
      String(req.userId) !== String(appt.doctorId)
    ) {
      return fail(res, 'Forbidden', 403);
    }

    return ok(res, appt);
  } catch (err) {
    console.error('[appointment] getById:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── PATCH /appointments/:id/status ───────────────────────────
exports.updateStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, errors.array(), 422);

  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return fail(res, 'Appointment not found', 404);

    // Guard: Only the assigned doctor or an admin can update status
    if (req.userRole !== 'admin' && String(req.userId) !== String(appt.doctorId)) {
      console.warn(`[appointment] 403 Reject: User ${req.userId} vs Assigned Doctor ${appt.doctorId}`);
      return fail(res, 'Forbidden: You are not assigned to this appointment', 403);
    }

    const { status: nextStatus, reason, doctorNotes, prescriptionId } = req.body;
    const finalReason = reason || doctorNotes;

    const check = validateTransition(appt, nextStatus, req.userRole);
    if (!check.ok) return fail(res, check.reason, check.code);

    appt.status = nextStatus;
    if (finalReason) appt.doctorNotes = finalReason;
    await appt.save();

    // Publish event
    if (nextStatus === 'confirmed') {
      mq.publish('appointment.confirmed', {
        appointmentId:    appt._id,
        agoraChannelName: appt.agoraChannelName || null,
        patientId:        appt.patientId,
        doctorId:         appt.doctorId,
      });
    } else if (nextStatus === 'cancelled_patient' || nextStatus === 'cancelled_doctor') {
      mq.publish('appointment.cancelled', {
        appointmentId: appt._id,
        cancelledBy:   req.userRole,
        reason:        reason || '',
        patientId:     appt.patientId,
        doctorId:      appt.doctorId,
      });
    } else if (nextStatus === 'completed') {
      mq.publish('appointment.completed', {
        appointmentId:  appt._id,
        prescriptionId: prescriptionId || null,
        patientId:      appt.patientId,
        doctorId:       appt.doctorId,
      });
    }

    return ok(res, appt);
  } catch (err) {
    console.error('[appointment] updateStatus:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── DELETE /appointments/:id  (role:patient, >2h rule) ───────
exports.cancel = async (req, res) => {
  try {
    const appt = await Appointment.findById(req.params.id);
    if (!appt) return fail(res, 'Appointment not found', 404);

    if (appt.patientId !== req.userId) return fail(res, 'Forbidden', 403);

    const check = validateTransition(appt, 'cancelled_patient', 'patient');
    if (!check.ok) return fail(res, check.reason, check.code);

    appt.status = 'cancelled_patient';
    await appt.save();

    mq.publish('appointment.cancelled', {
      appointmentId: appt._id,
      cancelledBy:   'patient',
      reason:        req.body?.reason || '',
      patientId:     appt.patientId,
      doctorId:      appt.doctorId,
    });

    return ok(res, { cancelled: true, id: appt._id });
  } catch (err) {
    console.error('[appointment] cancel:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── GET /appointments/my/upcoming  (role:patient) ────────────
exports.myUpcoming = async (req, res) => {
  try {
    const appts = await Appointment.find({
      patientId: req.userId,
      status: { $in: ['pending', 'confirmed'] },
      slotDate: { $gte: new Date() },
    }).sort({ slotDate: 1 });
    return ok(res, appts);
  } catch (err) {
    console.error('[appointment] myUpcoming:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── GET /appointments/my/history  (role:patient) ─────────────
exports.myHistory = async (req, res) => {
  try {
    const appts = await Appointment.find({
      patientId: req.userId,
      status: { $in: ['completed', 'cancelled_patient', 'cancelled_doctor', 'no_show'] },
    }).sort({ slotDate: -1 });
    return ok(res, appts);
  } catch (err) {
    console.error('[appointment] myHistory:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── GET /appointments/doctor/today  (role:doctor) ────────────
exports.doctorToday = async (req, res) => {
  try {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const appts = await Appointment.find({
      doctorId: req.userId,
      slotDate: { $gte: start, $lte: end },
    }).sort({ slotTime: 1 });
    return ok(res, appts);
  } catch (err) {
    console.error('[appointment] doctorToday:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── GET /appointments/doctor/all  (role:doctor, ?status) ─────
exports.doctorAll = async (req, res) => {
  try {
    const filter = { doctorId: req.userId };
    if (req.query.status) filter.status = req.query.status;

    const appts = await Appointment.find(filter).sort({ slotDate: -1 });
    return ok(res, appts);
  } catch (err) {
    console.error('[appointment] doctorAll:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── GET /appointments/admin/all  (role:admin, paginated) ─────
exports.adminAll = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, patientId, doctorId } = req.query;
    const filter = {};
    if (status)    filter.status    = status;
    if (patientId) filter.patientId = patientId;
    if (doctorId)  filter.doctorId  = doctorId;

    const skip = (Number(page) - 1) * Number(limit);
    const [appts, total] = await Promise.all([
      Appointment.find(filter).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      Appointment.countDocuments(filter),
    ]);
    return ok(res, { appointments: appts, total, page: Number(page), limit: Number(limit) });
  } catch (err) {
    console.error('[appointment] adminAll:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── PATCH /appointments/:id/agora  (internal) ────────────────
exports.setAgora = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, errors.array(), 422);

  try {
    const appt = await Appointment.findByIdAndUpdate(
      req.params.id,
      { agoraChannelName: req.body.agoraChannelName },
      { new: true }
    );
    if (!appt) return fail(res, 'Appointment not found', 404);
    return ok(res, { id: appt._id, agoraChannelName: appt.agoraChannelName });
  } catch (err) {
    console.error('[appointment] setAgora:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};
