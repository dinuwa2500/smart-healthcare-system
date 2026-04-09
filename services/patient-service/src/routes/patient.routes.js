'use strict';

const { Router } = require('express');
const { body, param } = require('express-validator');
const ctrl = require('../controllers/patient.controller');
const upload = require('../middleware/upload');
const { extractUser, canAccessFile } = require('../middleware/verifyAccess');

const router = Router();

// All /patients/* routes require a gateway-forwarded user identity
router.use(extractUser);

// ── Profile ──────────────────────────────────────────────────
router.post(
  '/register',
  [
    body('firstName').notEmpty().trim().withMessage('First name is required'),
    body('lastName').notEmpty().trim().withMessage('Last name is required'),
    body('dob').optional().isISO8601().withMessage('dob must be a valid date'),
    body('gender').optional().isIn(['male', 'female', 'other']),
  ],
  ctrl.register
);

router.get('/me', ctrl.getMe);
router.put('/me', ctrl.updateMe);

router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid patient ID')],
  ctrl.getById
);

// ── Reports ──────────────────────────────────────────────────
router.post('/me/reports', upload.single('report'), ctrl.uploadReport);
router.get('/me/reports', ctrl.listReports);

// ── Cross-service data ───────────────────────────────────────
router.get('/me/history', ctrl.getHistory);
router.get('/me/prescriptions', ctrl.getPrescriptions);

module.exports = router;
