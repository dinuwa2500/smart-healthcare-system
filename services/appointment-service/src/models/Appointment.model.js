'use strict';

const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema(
  {
    patientId:       { type: String, required: [true, 'patientId is required'] },
    doctorId:        { type: String, required: [true, 'doctorId is required'] },
    patientName:     { type: String, trim: true },
    doctorName:      { type: String, trim: true },
    doctorSpecialty: { type: String, trim: true },
    consultationFee: { type: Number, min: 0 },
    slotDate:        { type: Date,   required: [true, 'slotDate is required'] },
    slotTime:        { type: String, required: [true, 'slotTime is required'],
                       match: [/^\d{2}:\d{2}$/, 'slotTime must be HH:MM'] },
    durationMinutes: { type: Number, default: 30 },
    consultationType:{ type: String,
                       enum: ['video', 'in_person'],
                       default: 'video' },
    reason:          { type: String, trim: true },
    doctorNotes:     { type: String, trim: true },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled_patient', 'cancelled_doctor', 'no_show'],
      default: 'pending',
    },
    paymentId:       { type: String },
    paymentStatus:   { type: String,
                       enum: ['pending', 'paid', 'refunded'],
                       default: 'pending' },
    agoraChannelName:{ type: String },
  },
  {
    timestamps: true,
    collection: 'appointments',
  }
);

appointmentSchema.index({ patientId: 1, status: 1 });
appointmentSchema.index({ doctorId: 1, slotDate: 1 });

module.exports = mongoose.model('Appointment', appointmentSchema);
