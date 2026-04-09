'use strict';

const mongoose = require('mongoose');

const videoSessionSchema = new mongoose.Schema(
  {
    appointmentId:   { type: String, required: [true, 'appointmentId is required'], unique: true },
    patientId:       { type: String, required: [true, 'patientId is required'] },
    doctorId:        { type: String, required: [true, 'doctorId is required'] },
    channelName:     { type: String, unique: true, sparse: true },
    patientUid:      { type: Number },
    doctorUid:       { type: Number },
    patientRtcToken: { type: String },
    doctorRtcToken:  { type: String },
    scheduledAt:     { type: Date },
    startedAt:       { type: Date },
    endedAt:         { type: Date },
    durationSeconds: { type: Number },
    status: {
      type: String,
      enum: ['scheduled', 'active', 'ended', 'cancelled'],
      default: 'scheduled',
    },
  },
  {
    timestamps: true,
    collection: 'video_sessions',
  }
);

videoSessionSchema.index({ patientId: 1 });
videoSessionSchema.index({ doctorId: 1 });

module.exports = mongoose.model('VideoSession', videoSessionSchema);
