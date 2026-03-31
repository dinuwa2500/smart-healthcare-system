'use strict';

const { Router } = require('express');
const { body, param, query } = require('express-validator');
const ctrl = require('../controllers/doctor.controller');
const { extractUser, roleGuard } = require('../middleware/verifyAccess');

const router = Router();

// ── PUBLIC routes (no auth required) ────────────────────────
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  ctrl.search
);

// (Moved dynamic routes to bottom to avoid collisions)

// ── All routes below require authenticated user ───────────────
router.use(extractUser);

// ── Doctor management (MUST be before /:id routes) ────────────
router.get('/me', roleGuard('doctor'), ctrl.getMe);
router.post('/me/slots/generate', roleGuard('doctor'), ctrl.generateDefaultSlots);

// ── Query: prescriptions for a patient (doctor or admin) ─────
// Must be before /:id routes to avoid matching 'prescriptions' as an id
router.get(
  '/prescriptions',
  roleGuard(['doctor', 'admin']),
  ctrl.prescriptionsByPatient
);

// ── Doctor-only routes ────────────────────────────────────────
router.post(
  '/register',
  roleGuard('doctor'),
  [
    body('firstName').notEmpty().trim().withMessage('First name required'),
    body('lastName').notEmpty().trim().withMessage('Last name required'),
    body('specialization').optional().isIn([
      'Cardiology', 'Neurology', 'Dermatology', 'Pediatrics', 'Orthopedics',
      'Gynecology', 'Psychiatry', 'General Practice', 'ENT', 'Ophthalmology',
      'Oncology', 'Urology',
    ]),
    body('consultationFee').optional().isFloat({ min: 0 }),
    body('experienceYears').optional().isInt({ min: 0 }),
  ],
  ctrl.register
);

router.put('/me', roleGuard('doctor'), ctrl.updateMe);

router.post(
  '/me/slots',
  roleGuard('doctor'),
  [
    body('*.dayOfWeek').isInt({ min: 0, max: 6 }).withMessage('dayOfWeek 0-6 required'),
    body('*.startTime').matches(/^\d{2}:\d{2}$/).withMessage('startTime must be HH:MM'),
    body('*.duration').optional().isInt({ min: 10 }),
  ],
  ctrl.setSlots
);

router.delete(
  '/me/slots/:id',
  roleGuard('doctor'),
  [param('id').isMongoId()],
  ctrl.deleteSlot
);

router.post(
  '/me/prescriptions',
  roleGuard('doctor'),
  [
    body('patientId').notEmpty().withMessage('patientId required'),
    body('medications').isArray({ min: 1 }).withMessage('At least one medication required'),
    body('medications.*.name').notEmpty(),
    body('medications.*.dosage').notEmpty(),
    body('medications.*.frequency').notEmpty(),
    body('medications.*.durationDays').isInt({ min: 1 }),
  ],
  ctrl.issuePrescription
);

router.get('/me/prescriptions', roleGuard('doctor'), ctrl.myPrescriptions);
router.get('/me/patients',      roleGuard('doctor'), ctrl.myPatients);

// ── Admin-only routes ─────────────────────────────────────────
router.patch(
  '/:id/verify',
  roleGuard('admin'),
  [param('id').isMongoId()],
  ctrl.verifyDoctor
);

// ── Search & Public Detail (At bottom to avoid keyword collision) ──
router.get('/:id', [param('id').isMongoId()], ctrl.getById);
router.get('/:id/slots', [param('id').isMongoId()], ctrl.getSlots);

module.exports = router;
