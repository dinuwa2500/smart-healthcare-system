'use strict';

const { Router } = require('express');
const { body, query } = require('express-validator');
const ctrl = require('../controllers/symptom.controller');
const { extractUser, roleGuard } = require('../middleware/verifyAccess');

const router = Router();

router.use(extractUser);

// POST /symptoms/check  (role:patient)
router.post(
  '/check',
  roleGuard('patient'),
  [
    body('symptoms')
      .trim()
      .isLength({ min: 10 })
      .withMessage('symptoms must be at least 10 characters'),
    body('severity')
      .optional()
      .isIn(['mild', 'moderate', 'severe'])
      .withMessage('severity must be mild, moderate, or severe'),
    body('duration').optional().trim(),
    body('age').optional().isInt({ min: 0, max: 120 }).withMessage('age must be 0-120'),
    body('gender').optional().trim(),
  ],
  ctrl.check
);

// GET /symptoms/history  (role:patient, paginated)
router.get(
  '/history',
  roleGuard('patient'),
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 50 }),
  ],
  ctrl.history
);

module.exports = router;
