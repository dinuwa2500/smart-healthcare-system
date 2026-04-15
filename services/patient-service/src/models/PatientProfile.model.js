'use strict';

const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
  {
    street:     { type: String, trim: true },
    city:       { type: String, trim: true },
    district:   { type: String, trim: true },
    postalCode: { type: String, trim: true },
  },
  { _id: false }
);

const emergencyContactSchema = new mongoose.Schema(
  {
    name:         { type: String, trim: true },
    phone:        { type: String, trim: true },
    relationship: { type: String, trim: true },
  },
  { _id: false }
);

const patientProfileSchema = new mongoose.Schema(
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
    dob:    { type: Date },
    gender: { type: String, enum: ['male', 'female', 'other'] },
    phone:  { type: String, trim: true },
    address:          { type: addressSchema, default: () => ({}) },
    bloodType:        { type: String, trim: true },
    allergies:        { type: [String], default: [] },
    emergencyContact: { type: emergencyContactSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    collection: 'patient_profiles',
  }
);

module.exports = mongoose.model('PatientProfile', patientProfileSchema);
