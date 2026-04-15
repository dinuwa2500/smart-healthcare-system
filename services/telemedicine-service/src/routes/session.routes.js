'use strict';

const { Router } = require('express');
const { body, param } = require('express-validator');
const ctrl = require('../controllers/session.controller');
const { extractUser, roleGuard } = require('../middleware/verifyAccess');

const router = Router();

// All session routes require identity
router.use(extractUser);

// POST /sessions/create
router.post(
  '/create',
  [
    body('appointmentId').notEmpty().withMessage('appointmentId required'),
    body('patientId').notEmpty().withMessage('patientId required'),
    body('doctorId').notEmpty().withMessage('doctorId required'),
    body('scheduledAt').optional().isISO8601().withMessage('scheduledAt must be a valid date'),
  ],
  ctrl.create
);

// GET /sessions/:appointmentId
router.get(
  '/:appointmentId',
  [param('appointmentId').notEmpty()],
  ctrl.getSession
);

// POST /sessions/:appointmentId/start  (role:doctor)
router.post(
  '/:appointmentId/start',
  roleGuard('doctor'),
  [param('appointmentId').notEmpty()],
  ctrl.startSession
);

// POST /sessions/:appointmentId/end  (role:doctor)
router.post(
  '/:appointmentId/end',
  roleGuard('doctor'),
  [param('appointmentId').notEmpty()],
  ctrl.endSession
);

module.exports = router;
