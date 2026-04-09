'use strict';

const mongoose = require('mongoose');

const patientReportSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PatientProfile',
      required: [true, 'patientId is required'],
    },
    fileName:    { type: String, required: true },
    storedName:  { type: String, required: true },
    mimeType:    { type: String, required: true },
    sizeBytes:   { type: Number, required: true },
    description: { type: String, trim: true },
    uploadedAt:  { type: Date, default: Date.now },
  },
  {
    collection: 'patient_reports',
  }
);

module.exports = mongoose.model('PatientReport', patientReportSchema);
