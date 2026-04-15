'use strict';

const mongoose = require('mongoose');

const medicationSchema = new mongoose.Schema(
  {
    name:          { type: String, required: true, trim: true },
    dosage:        { type: String, required: true, trim: true },
    frequency:     { type: String, required: true, trim: true },
    durationDays:  { type: Number, required: true, min: 1 },
    instructions:  { type: String, trim: true },
  },
  { _id: false }
);

const doctorPrescriptionSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorProfile',
      required: [true, 'doctorId is required'],
    },
    patientId:     { type: String, required: [true, 'patientId is required'] },
    appointmentId: { type: String },
    medications:   { type: [medicationSchema], default: [] },
    notes:         { type: String, trim: true },
    issuedAt:      { type: Date, default: Date.now },
  },
  {
    collection: 'doctor_prescriptions',
  }
);

doctorPrescriptionSchema.index({ doctorId: 1 });
doctorPrescriptionSchema.index({ patientId: 1 });

module.exports = mongoose.model('DoctorPrescription', doctorPrescriptionSchema);
