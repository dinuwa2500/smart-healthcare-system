'use strict';

const mongoose = require('mongoose');

const qualificationSchema = new mongoose.Schema(
  {
    degree:      { type: String, trim: true },
    institution: { type: String, trim: true },
    year:        { type: Number },
  },
  { _id: false }
);

const ratingSchema = new mongoose.Schema(
  {
    average: { type: Number, default: 0, min: 0, max: 5 },
    count:   { type: Number, default: 0 },
  },
  { _id: false }
);

const SPECIALIZATIONS = [
  'Cardiology', 'Neurology', 'Dermatology', 'Pediatrics', 'Orthopedics',
  'Gynecology', 'Psychiatry', 'General Practice', 'ENT', 'Ophthalmology',
  'Oncology', 'Urology',
];

const doctorProfileSchema = new mongoose.Schema(
  {
    authUserId: {
      type: String,
      required: [true, 'authUserId is required'],
      unique: true,
    },
    firstName: {
      type: String,
      required: [true, 'First name is required'],
      trim: true,
    },
    lastName: {
      type: String,
      required: [true, 'Last name is required'],
      trim: true,
    },
    specialization:  { type: String, enum: SPECIALIZATIONS },
    qualifications:  { type: [qualificationSchema], default: [] },
    experienceYears: { type: Number, min: 0 },
    consultationFee: { type: Number, min: 0 },
    bio:             { type: String, trim: true },
    languages:       { type: [String], default: [] },
    profilePicture:  { type: String, trim: true }, // URL to profile image
    isVerified:      { type: Boolean, default: false },
    rating:          { type: ratingSchema, default: () => ({ average: 0, count: 0 }) },
  },
  {
    timestamps: true,
    collection: 'doctor_profiles',
  }
);

doctorProfileSchema.index({ specialization: 1 });
doctorProfileSchema.index({ firstName: 'text', lastName: 'text' });

module.exports = mongoose.model('DoctorProfile', doctorProfileSchema);
