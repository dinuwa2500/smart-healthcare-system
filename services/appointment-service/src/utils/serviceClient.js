'use strict';

const AUTH_URL    = process.env.AUTH_SERVICE_URL    || 'http://auth-service:4000';
const PATIENT_URL = process.env.PATIENT_SERVICE_URL || 'http://patient-service:4001';
const DOCTOR_URL  = process.env.DOCTOR_SERVICE_URL  || 'http://doctor-service:4002';

const INTERNAL_SECRET = process.env.INTERNAL_SERVICE_SECRET || 'mediconnect_secret_2024';

const HEADERS = {
  'Content-Type':    'application/json',
  'X-Internal-Secret': INTERNAL_SECRET,
};

/** Fetch auth user by ID (for email) */
async function getAuthUser(userId) {
  if (!userId) return null;
  try {
    const res = await fetch(`${AUTH_URL}/auth/users/${userId}`, { headers: HEADERS });
    const json = await res.json();
    return json?.data || null;
  } catch (err) {
    console.error(`[appt-serviceClient] getAuthUser(${userId}) failed:`, err.message);
    return null;
  }
}

/** Fetch patient profile by authUserId */
async function getPatient(authUserId) {
  if (!authUserId) return null;
  try {
    const res = await fetch(`${PATIENT_URL}/patients/profile/${authUserId}`, { headers: HEADERS });
    const json = await res.json();
    return json?.data || null;
  } catch (err) {
    console.warn(`[appt-serviceClient] getPatient(${authUserId}) failed:`, err.message);
    return null;
  }
}

/** Fetch doctor profile by authUserId */
async function getDoctor(authUserId) {
  if (!authUserId) return null;
  try {
    const res = await fetch(`${DOCTOR_URL}/doctors/${authUserId}`, { headers: HEADERS });
    const json = await res.json();
    return json?.data || null;
  } catch (err) {
    console.warn(`[appt-serviceClient] getDoctor(${authUserId}) failed:`, err.message);
    return null;
  }
}

/**
 * Enrich an appointment event with patient + doctor contact details.
 * Returns an enriched payload ready to publish.
 */
exports.enrichAppointmentPayload = async function enrichAppointmentPayload(appt) {
  const [patientAuth, doctorAuth] = await Promise.all([
    getAuthUser(appt.patientId),
    getAuthUser(appt.doctorId),
  ]);

  return {
    appointmentId:    appt._id,
    patientId:        appt.patientId,
    doctorId:         appt.doctorId,
    patientName:      appt.patientName  || 'Patient',
    doctorName:       appt.doctorName   || 'Doctor',
    doctorSpecialty:  appt.doctorSpecialty || '',
    slotDate:         appt.slotDate,
    slotTime:         appt.slotTime,
    consultationType: appt.consultationType,
    reason:           appt.reason || '',
    patientEmail:     patientAuth?.email || '',
    doctorEmail:      doctorAuth?.email  || '',
  };
};
