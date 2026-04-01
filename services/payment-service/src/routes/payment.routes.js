'use strict';

const { Router } = require('express');
const { body, param } = require('express-validator');
const ctrl      = require('../controllers/payment.controller');
const { extractUser, roleGuard } = require('../middleware/verifyAccess');

const router = Router();

// POST /payments/create-intent  (patient)
router.post(
  '/create-intent',
  extractUser,
  roleGuard('patient'),
  [
    body('appointmentId').notEmpty().withMessage('appointmentId required'),
    body('patientId').notEmpty().withMessage('patientId required'),
    body('doctorId').notEmpty().withMessage('doctorId required'),
    body('amountLKR').isFloat({ gt: 0 }).withMessage('amountLKR must be positive'),
  ],
  ctrl.createIntent
);

// POST /payments/webhook  (Stripe – NO auth, raw body already parsed in index.js)
router.post('/webhook', ctrl.webhook);

// POST /payments/:id/confirm (patient manually confirms success)
router.post(
  '/:id/confirm',
  extractUser,
  [param('id').isMongoId().withMessage('Invalid payment ID')],
  ctrl.confirmPayment
);

// GET /payments/admin/all  (admin)
router.get(
  '/admin/all',
  extractUser,
  roleGuard('admin'),
  ctrl.adminAll
);

// POST /payments/:id/refund  (admin)
router.post(
  '/:id/refund',
  extractUser,
  roleGuard('admin'),
  [param('id').isMongoId().withMessage('Invalid payment id')],
  ctrl.refund
);

// GET /payments/:appointmentId  (patient | doctor | admin)
router.get(
  '/:appointmentId',
  extractUser,
  [param('appointmentId').notEmpty()],
  ctrl.getByAppointment
);

module.exports = router;
