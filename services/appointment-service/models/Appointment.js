const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patientId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    index: true 
  },
  patientName: { type: String },
  doctorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true, 
    index: true 
  },
  doctorName: { type: String },
  specialty: { type: String },
  date: { type: Date, required: true },
  timeSlot: {
    startTime: { type: String, required: true },  // e.g. "09:00"
    endTime: { type: String, required: true }      // e.g. "09:30"
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    default: 'Pending'
  },
  reason: { type: String },          // Reason for visit
  notes: { type: String },           // Doctor/patient notes
  cancellationReason: { type: String },
  statusHistory: [{
    status: { type: String },
    changedAt: { type: Date, default: Date.now },
    changedBy: { type: String }       // userId or role
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Auto-update updatedAt
appointmentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Compound index for preventing double-booking
appointmentSchema.index({ doctorId: 1, date: 1, 'timeSlot.startTime': 1 }, { unique: true });

module.exports = mongoose.model('Appointment', appointmentSchema);
