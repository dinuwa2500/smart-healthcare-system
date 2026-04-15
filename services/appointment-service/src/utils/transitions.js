'use strict';

/**
 * Valid status transitions.
 * Key   = current status
 * Value = map of { nextStatus: allowedRole }
 */
const TRANSITIONS = {
  pending: {
    confirmed:        'doctor',
    cancelled_patient:'patient',
    cancelled_doctor: 'doctor',
  },
  confirmed: {
    completed:        'doctor',
    cancelled_doctor: 'doctor',
    no_show:          'doctor',
  },
};

const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

/**
 * Validate a requested status transition.
 * Returns { ok: true } or { ok: false, reason: string, code: number }
 */
exports.validateTransition = function validateTransition(appointment, nextStatus, role) {
  if (role === 'internal' || role === 'admin') return { ok: true };

  const allowed = TRANSITIONS[appointment.status];

  if (!allowed || !allowed[nextStatus]) {
    return {
      ok: false,
      reason: `Transition from '${appointment.status}' to '${nextStatus}' is not allowed`,
      code: 422,
    };
  }

  if (allowed[nextStatus] !== role) {
    return {
      ok: false,
      reason: `Only a ${allowed[nextStatus]} can transition to '${nextStatus}'`,
      code: 403,
    };
  }

  // patient-cancellation must be >2 h before slot
  if (nextStatus === 'cancelled_patient') {
    const slotMs = new Date(appointment.slotDate).getTime();
    const nowMs  = Date.now();
    if (slotMs - nowMs < TWO_HOURS_MS) {
      return {
        ok: false,
        reason: 'Cancellation must be made at least 2 hours before the appointment',
        code: 422,
      };
    }
  }

  return { ok: true };
};
