'use strict';

const path = require('path');
const { validationResult } = require('express-validator');
const PatientProfile = require('../models/PatientProfile.model');
const PatientReport  = require('../models/PatientReport.model');
const { ok, fail }   = require('../utils/response');
const svc            = require('../utils/serviceClient');

const serializeReport = (report) => ({
  _id: report._id,
  description: report.description || '',
  originalName: report.fileName,
  storedName: report.storedName,
  mimeType: report.mimeType,
  size: report.sizeBytes,
  createdAt: report.uploadedAt,
});

const ensurePatientProfile = async (userId) => {
  const existing = await PatientProfile.findOne({ authUserId: userId });
  if (existing) return existing;

  return PatientProfile.create({
    authUserId: userId,
    firstName: 'Patient',
    lastName: 'Profile',
  });
};

// ── POST /patients/register ──────────────────────────────────
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return fail(res, errors.array(), 422);

  try {
    const existing = await PatientProfile.findOne({ authUserId: req.userId });
    if (existing) return fail(res, 'Profile already exists for this user', 409);

    const profile = await PatientProfile.create({ ...req.body, authUserId: req.userId });
    return ok(res, profile, 201);
  } catch (err) {
    console.error('[patient] register:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── GET /patients/me ─────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const profile = await PatientProfile.findOne({ authUserId: req.userId });
    if (!profile) return fail(res, 'Profile not found', 404);
    return ok(res, profile);
  } catch (err) {
    console.error('[patient] getMe:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── PUT /patients/me ─────────────────────────────────────────
exports.updateMe = async (req, res) => {
  try {
    const profile = await PatientProfile.findOneAndUpdate(
      { authUserId: req.userId },
      req.body,
      { new: true, runValidators: true }
    );
    if (!profile) return fail(res, 'Profile not found', 404);
    return ok(res, profile);
  } catch (err) {
    console.error('[patient] updateMe:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── GET /patients/:id  (doctor | admin) ──────────────────────
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    let profile = null;

    // 1. Try by profile _id (must be a valid 24-char hex string)
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      profile = await PatientProfile.findById(id);
    }

    // 2. Try by authUserId (fallback for cross-service calls using Auth ID)
    if (!profile) {
      profile = await PatientProfile.findOne({ authUserId: id });
    }

    if (!profile) return fail(res, 'Patient not found', 404);
    return ok(res, profile);
  } catch (err) {
    console.error('[patient] getById:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── POST /patients/me/reports ────────────────────────────────
exports.uploadReport = async (req, res) => {
  try {
    if (!req.file) return fail(res, 'No file uploaded or unsupported file type', 400);

    const profile = await ensurePatientProfile(req.userId);

    const report = await PatientReport.create({
      patientId:   profile._id,
      fileName:    req.file.originalname,
      storedName:  req.file.filename,
      mimeType:    req.file.mimetype,
      sizeBytes:   req.file.size,
      description: req.body.description || '',
    });

    const fileUrl = `/files/${req.userId}/${req.file.filename}`;
    return ok(res, { report: serializeReport(report), fileUrl }, 201);
  } catch (err) {
    console.error('[patient] uploadReport:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── GET /patients/me/reports ─────────────────────────────────
exports.listReports = async (req, res) => {
  try {
    const profile = await PatientProfile.findOne({ authUserId: req.userId });
    if (!profile) return ok(res, []);

    const reports = await PatientReport.find({ patientId: profile._id })
      .sort({ uploadedAt: -1 });

    return ok(res, reports.map(serializeReport));
  } catch (err) {
    console.error('[patient] listReports:', err.message);
    return fail(res, 'Internal server error', 500);
  }
};

// ── GET /files/:patientId/:filename  (protected sendFile) ────
exports.serveFile = (req, res) => {
  const { patientId, filename } = req.params;
  const filePath = path.join('/app/uploads', patientId, filename);
  res.sendFile(filePath, (err) => {
    if (err) {
      console.error('[patient] serveFile:', err.message);
      return res.status(404).json({ success: false, error: 'File not found' });
    }
  });
};

// ── GET /patients/me/history ─────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const profile = await PatientProfile.findOne({ authUserId: req.userId });
    if (!profile) return fail(res, 'Patient profile not found', 404);

    const data = await svc.getPatientHistory(profile._id.toString(), req.headers);
    return ok(res, data);
  } catch (err) {
    console.error('[patient] getHistory:', err.message);
    const status = err.response?.status || 502;
    return fail(res, err.response?.data?.error || 'Failed to fetch appointment history', status);
  }
};

// ── GET /patients/me/prescriptions ───────────────────────────
exports.getPrescriptions = async (req, res) => {
  try {
    const profile = await PatientProfile.findOne({ authUserId: req.userId });
    if (!profile) return fail(res, 'Patient profile not found', 404);

    const data = await svc.getPatientPrescriptions(profile._id.toString(), req.headers);
    return ok(res, data);
  } catch (err) {
    console.error('[patient] getPrescriptions:', err.message);
    const status = err.response?.status || 502;
    return fail(res, err.response?.data?.error || 'Failed to fetch prescriptions', status);
  }
};
