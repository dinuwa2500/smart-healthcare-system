'use strict';

const appt    = require('./appointment.handler');
const payment = require('./payment.handler');

/**
 * Dispatch a parsed event payload to the correct handler.
 * Throws if routing key is unknown (message will be nacked).
 */
exports.dispatch = async function dispatch(routingKey, payload) {
  switch (routingKey) {
    case 'appointment.booked':     return appt.booked(payload);
    case 'appointment.confirmed':  return appt.confirmed(payload);
    case 'appointment.cancelled':  return appt.cancelled(payload);
    case 'appointment.completed':  return appt.completed(payload);
    case 'payment.succeeded':      return payment.succeeded(payload);
    case 'payment.failed':         return payment.failed(payload);
    default:
      console.warn(`[dispatcher] Unknown routing key: ${routingKey} – skipping`);
  }
};
