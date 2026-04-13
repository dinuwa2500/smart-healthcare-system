'use strict';

const { Router } = require('express');
const { body, param, query } = require('express-validator');
const ctrl = require('../controllers/appointment.controller');
const { extractUser, roleGuard } = require('../middleware/verifyAccess');

const router = Router();

// All appointment routes require identity
router.use(extractUser);



// Patient routes
router.get('/my/upcoming', roleGuard('patient'), ctrl.myUpcoming);
router.get('/my/history',  roleGuard('patient'), ctrl.myHistory);

// Doctor routes
router.get('/doctor/today', roleGuard('doctor'), ctrl.doctorToday);
router.get(
  '/doctor/all',
  roleGuard('doctor'),
  [query('status').optional().isIn(['pending','confirmed','completed','cancelled_patient','cancelled_doctor','no_show'])],
  ctrl.doctorAll
);

// Admin route
router.get(
  '/admin/all',
  roleGuard('admin'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  ctrl.adminAll
);

// ── Parameterised routes ──────────────────────────────────────

router.get('/:id', [param('id').isMongoId()], ctrl.getById);

router.post(
  '/',
  roleGuard('patient'),
  [
    body('doctorId').notEmpty().withMessage('doctorId required'),
    body('slotDate').isISO8601().withMessage('slotDate must be a valid date'),
    body('slotTime').matches(/^\d{2}:\d{2}$/).withMessage('slotTime must be HH:MM'),
    body('consultationType').optional().isIn(['video', 'in_person']),
  ],
  ctrl.book
);

router.patch(
  '/:id/status',
  [
    param('id').isMongoId(),
    body('status').isIn(['confirmed','completed','cancelled_patient','cancelled_doctor','no_show'])
      .withMessage('Invalid target status'),
  ],
  ctrl.updateStatus
);

router.patch(
  '/:id/agora',
  [
    param('id').isMongoId(),
    body('agoraChannelName').notEmpty().withMessage('agoraChannelName required'),
  ],
  ctrl.setAgora
);

router.delete('/:id', [param('id').isMongoId()], ctrl.cancel);

module.exports = router;
