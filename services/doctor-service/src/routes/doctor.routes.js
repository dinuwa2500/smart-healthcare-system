'use strict';

const { Router } = require('express');
const { body, param, query } = require('express-validator');
const ctrl = require('../controllers/doctor.controller');
const { extractUser, roleGuard } = require('../middleware/verifyAccess');

const router = Router();

// ── 1. PUBLIC Literal Routes (No Auth) ─────────────────────────
router.get(
  '/',
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  ctrl.search
);

// ── 2. PROTECTED Literal Routes (Authenticated) ───────────────
// These MUST be defined BEFORE parameterized routes (/:id) to avoid matching 'me' as an id.
router.get('/me',              extractUser, roleGuard('doctor'), ctrl.getMe);
router.post('/me/slots/generate', extractUser, roleGuard('doctor'), ctrl.generateDefaultSlots);
router.get('/me/prescriptions', extractUser, roleGuard('doctor'), ctrl.myPrescriptions);
router.get('/me/patients',      extractUser, roleGuard('doctor'), ctrl.myPatients);

// Query: prescriptions for a patient (doctor or admin)
router.get(
  '/prescriptions',
  extractUser,
  roleGuard(['doctor', 'admin']),
  ctrl.prescriptionsByPatient
);

// ── 3. PUBLIC Parameterized Routes ─────────────────────────────
// These catch any path that wasn't matched by specific literal routes above.
router.get('/:id', [param('id').isMongoId()], ctrl.getById);
router.get('/:id/slots', [param('id').isMongoId()], ctrl.getSlots);

// ── 4. DOCTOR-ONLY Managed Routes ──────────────────────────────
// Apply extractUser to all routes below.
router.use(extractUser);

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

// ── 5. ADMIN-ONLY Routes ───────────────────────────────────────
router.patch(
  '/:id/verify',
  roleGuard('admin'),
  [param('id').isMongoId()],
  ctrl.verifyDoctor
);


module.exports = router;