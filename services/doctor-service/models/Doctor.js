const mongoose = require('mongoose');

const timeSlotSchema = new mongoose.Schema({
  day: { 
    type: String, 
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true 
  },
  startTime: { type: String, required: true },  // e.g. "09:00"
  endTime: { type: String, required: true },    // e.g. "17:00"
  isAvailable: { type: Boolean, default: true }
});

const prescriptionSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, required: true },
  patientName: { type: String },
  diagnosis: { type: String, required: true },
  medication: { type: String, required: true },
  dosage: { type: String, required: true },
  instructions: { type: String },
  issuedAt: { type: Date, default: Date.now }
});

const doctorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  specialty: { type: String, required: true },
  qualifications: [{ type: String }],
  experience: { type: Number }, // years
  hospitalAffiliation: { type: String },
  consultationFee: { type: Number },
  bio: { type: String },
  availability: [timeSlotSchema],
  prescriptionsIssued: [prescriptionSchema],
  isVerified: { type: Boolean, default: false }, // Admin verifies doctor
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

doctorSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Doctor', doctorSchema);
