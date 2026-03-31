export type AppointmentStatus =
  | 'pending' | 'confirmed' | 'completed'
  | 'cancelled_patient' | 'cancelled_doctor' | 'no_show';

export type ConsultationType = 'video' | 'in_person';

export interface Appointment {
  _id: string;
  patientId: string;
  doctorId: string;
  patientName: string;
  doctorName: string;
  doctorSpecialty: string;
  consultationFee: number;
  slotDate: string;
  slotTime: string;
  durationMinutes: number;
  consultationType: ConsultationType;
  reason: string;
  doctorNotes: string;
  status: AppointmentStatus;
  paymentId: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  agoraChannelName: string;
  createdAt: string;
  updatedAt: string;
}
