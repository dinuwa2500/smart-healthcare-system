'use strict';

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    appointmentId: { type: String, required: [true, 'appointmentId is required'] },
    patientId:     { type: String, required: [true, 'patientId is required'] },
    doctorId:      { type: String, required: [true, 'doctorId is required'] },
    amount:        { type: Number, required: [true, 'amount is required'], min: 0 },
    currency:      { type: String, default: 'lkr', lowercase: true },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
    },
    stripePaymentIntentId: { type: String, unique: true, sparse: true },
    stripeClientSecret:    { type: String },
    stripeChargeId:        { type: String },
    failureMessage:        { type: String },
    refundedAt:            { type: Date },
  },
  {
    timestamps: true,
    collection: 'payments',
  }
);

paymentSchema.index({ appointmentId: 1 });
paymentSchema.index({ patientId: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
