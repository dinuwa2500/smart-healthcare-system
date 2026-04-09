'use strict';

const mongoose = require('mongoose');

const symptomCheckSchema = new mongoose.Schema(
  {
    patientId:          { type: String, required: [true, 'patientId is required'] },
    symptoms:           { type: String, required: [true, 'symptoms is required'] },
    severity:           { type: String, enum: ['mild', 'moderate', 'severe'] },
    duration:           { type: String },
    age:                { type: Number },
    gender:             { type: String },
    suggestedSpecialty: { type: String },
    urgencyLevel:       { type: String, enum: ['routine', 'soon', 'urgent', 'emergency'] },
    generalAdvice:      { type: String },
    redFlags:           { type: [String], default: [] },
    disclaimer:         { type: String },
    rawModelOutput:     { type: String },
    createdAt:          { type: Date, default: Date.now },
  },
  {
    collection: 'symptom_checks',
  }
);

symptomCheckSchema.index({ patientId: 1, createdAt: -1 });

module.exports = mongoose.model('SymptomCheck', symptomCheckSchema);
