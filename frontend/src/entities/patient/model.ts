export interface PrescriptionMedication {
  name: string;
  dosage: string;
  frequency: string;
  durationDays: number;
  instructions?: string;
}

export interface Prescription {
  _id: string;
  appointmentId: string;
  patientId: string;
  doctorId: {
    _id: string;
    firstName: string;
    lastName: string;
    specialization: string;
  } | string;
  medications: PrescriptionMedication[];
  notes: string;
  createdAt: string;
}

export interface PatientProfile {
  _id: string;
  authUserId: string;
  firstName: string;
  lastName: string;
  dob?: string;
  gender?: 'male' | 'female' | 'other';
  phone?: string;
  address: {
    street?: string;
    city?: string;
    district?: string;
    postalCode?: string;
  };
  bloodType?: string;
  allergies: string[];
  emergencyContact: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  profilePicture?: string;
  createdAt: string;
  updatedAt: string;
}

export type UpdatePatientProfileDto = Partial<Omit<PatientProfile, '_id' | 'authUserId' | 'createdAt' | 'updatedAt'>>;
