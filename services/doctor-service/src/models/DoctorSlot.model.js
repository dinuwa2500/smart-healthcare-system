'use strict';

const mongoose = require('mongoose');

const doctorSlotSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DoctorProfile',
      required: [true, 'doctorId is required'],
    },
    dayOfWeek: {
      type: Number,
      required: true,
      min: 0,
      max: 6,
    },
    startTime: {
      type: String,
      required: true,
      match: [/^\d{2}:\d{2}$/, 'startTime must be HH:MM format'],
    },
    duration: {
      type: Number,
      default: 30,
      min: 10,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    collection: 'doctor_slots',
  }
);

doctorSlotSchema.index({ doctorId: 1, dayOfWeek: 1 });

module.exports = mongoose.model('DoctorSlot', doctorSlotSchema);
