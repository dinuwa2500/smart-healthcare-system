import api from '../../shared/api';
import type { DoctorProfile, DoctorSlot } from './model';

export interface Prescription {
  _id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  medications: {
    name: string;
    dosage: string;
    frequency: string;
    durationDays: number;
    instructions?: string;
  }[];
  notes: string;
  createdAt: string;
}

export const doctorApi = {
  search: (params?: { specialty?: string; name?: string; page?: number; limit?: number }) =>
    api.get<{ success: boolean; data: { doctors: DoctorProfile[]; total: number } }>('/doctors', { params }),

  getById: (id: string) =>
    api.get<{ success: boolean; data: DoctorProfile }>(`/doctors/${id}`),

  getSlots: (id: string, date?: string) =>
    api.get<{ success: boolean; data: DoctorSlot[] }>(`/doctors/${id}/slots`, { params: { date } }),

  register: (data: Partial<DoctorProfile>) =>
    api.post<{ success: boolean; data: DoctorProfile }>('/doctors/register', data),

  updateMe: (data: Partial<DoctorProfile>) =>
    api.put<{ success: boolean; data: DoctorProfile }>('/doctors/me', data),

  setSlots: (slots: Omit<DoctorSlot, '_id' | 'doctorId'>[]) =>
    api.post<{ success: boolean; data: DoctorSlot[] }>('/doctors/me/slots', slots),

  deleteSlot: (id: string) =>
    api.delete(`/doctors/me/slots/${id}`),

  verify: (id: string) =>
    api.patch(`/doctors/${id}/verify`),

  getMyPatients: (name?: string) =>
    api.get<{ success: boolean; data: { patients: unknown[]; total: number } }>('/doctors/me/patients', { params: { name } }),

  issuePrescription: (data: Omit<Prescription, '_id' | 'doctorId' | 'createdAt'>) =>
    api.post<{ success: boolean; data: Prescription }>('/doctors/me/prescriptions', data),

  getPrescriptionsByPatient: (patientId: string) =>
    api.get<{ success: boolean; data: Prescription[] }>(`/doctors/me/prescriptions?patientId=${patientId}`),

  getMe: () =>
    api.get<{ success: boolean; data: DoctorProfile }>('/doctors/me'),

  generateSlots: () =>
    api.post<{ success: boolean; data: { message: string; count: number } }>('/doctors/me/slots/generate'),
};
