import api from '../../shared/api';
import type { Appointment } from './model';

export const appointmentApi = {
  book: (data: {
    doctorId: string;
    doctorName?: string;
    doctorSpecialty?: string;
    consultationFee?: number;
    patientName?: string;
    slotDate: string;
    slotTime: string;
    consultationType: 'video' | 'in_person';
    reason: string;
  }) => api.post<{ success: boolean; data: Appointment }>('/appointments', data),

  getMyUpcoming: () =>
    api.get<{ success: boolean; data: Appointment[] }>('/appointments/my/upcoming'),

  getMyHistory: () =>
    api.get<{ success: boolean; data: Appointment[] }>('/appointments/my/history'),

  cancel: (id: string) =>
    api.delete<{ success: boolean }>(`/appointments/${id}`),

  getById: (id: string) =>
    api.get<{ success: boolean; data: Appointment }>(`/appointments/${id}`),

  updateStatus: (id: string, status: string, notes?: string) =>
    api.patch<{ success: boolean; data: Appointment }>(`/appointments/${id}/status`, { status, doctorNotes: notes }),

  // ── Doctor-specific ─────────────────────────────────────
  getDoctorToday: () =>
    api.get<{ success: boolean; data: Appointment[] }>('/appointments/doctor/today'),

  getDoctorPending: () =>
    api.get<{ success: boolean; data: Appointment[] }>('/appointments/doctor/all?status=pending'),

  getDoctorUpcoming: () =>
    api.get<{ success: boolean; data: Appointment[] }>('/appointments/doctor/all?status=confirmed'),

  getDoctorHistory: () =>
    // We fetch all other statuses and filter on the frontend if needed, or omit status
    api.get<{ success: boolean; data: Appointment[] }>('/appointments/doctor/all'),

  getDoctorWeek: () =>
    api.get<{ success: boolean; data: Appointment[] }>('/appointments/doctor/all'),

  getDoctorAll: () =>
    api.get<{ success: boolean; data: Appointment[] }>('/appointments/doctor/all'),
};
