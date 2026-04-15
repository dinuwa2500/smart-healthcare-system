'use strict';

const { Router } = require('express');
const { body, param } = require('express-validator');
const ctrl      = require('../controllers/auth.controller');
const adminOnly = require('../middleware/adminOnly.middleware');

const router = Router();

// POST /auth/register
router.post(
  '/register',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password min 6 chars'),
    body('role').isIn(['patient', 'doctor', 'admin']).withMessage('Invalid role'),
    body('firstName').notEmpty().trim().withMessage('First name required'),
    body('lastName').notEmpty().trim().withMessage('Last name required'),
    body('specialization').optional().notEmpty().trim().withMessage('Specialization must be a string'),
  ],
  ctrl.register
);

// POST /auth/login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  ctrl.login
);

// POST /auth/refresh
router.post('/refresh', ctrl.refresh);

// POST /auth/logout
router.post('/logout', ctrl.logout);

// PATCH /auth/users/:id/status  (admin only)
router.patch(
  '/users/:id/status',
  adminOnly,
  [
    param('id').isMongoId().withMessage('Invalid user id'),
    body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
    body('isVerified').optional().isBoolean().withMessage('isVerified must be boolean'),
  ],
  ctrl.updateStatus
);

// GET /auth/users/:id  (Internal/Admin lookup)
router.get(
  '/users/:id',
  [param('id').isMongoId().withMessage('Invalid user id')],
  ctrl.getById
);

// GET /auth/users (Admin only listing)
router.get(
  '/users',
  adminOnly,
  ctrl.getAll
);

module.exports = router;
