'use strict';

const { Router } = require('express');
const { param }  = require('express-validator');
const DoctorPrescription = require('../models/DoctorPrescription.model');
const { extractUser, roleGuard } = require('../middleware/verifyAccess');
const { ok, fail } = require('../utils/response');

const router = Router();

// GET /patients/:id/prescriptions  (role: doctor | admin)
router.get(
  '/:id/prescriptions',
  extractUser,
  roleGuard(['doctor', 'admin']),
  [param('id').notEmpty().withMessage('patientId is required')],
  async (req, res) => {
    try {
      const prescriptions = await DoctorPrescription.find({ patientId: req.params.id })
        .populate('doctorId', 'firstName lastName specialization')
        .sort({ issuedAt: -1 });

      return ok(res, prescriptions);
    } catch (err) {
      console.error('[doctor] patient prescriptions:', err.message);
      return fail(res, 'Internal server error', 500);
    }
  }
);

module.exports = router;
