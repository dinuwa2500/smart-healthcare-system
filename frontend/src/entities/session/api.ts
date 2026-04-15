import api from '../../shared/api';
import type { VideoSession } from './model';

export const sessionApi = {
  getByAppointment: (appointmentId: string) =>
    api.get<{ success: boolean; data: VideoSession }>(`/sessions/${appointmentId}`),

  create: (data: { appointmentId: string; patientId: string; doctorId: string; scheduledAt?: string }) =>
    api.post<{ success: boolean; data: VideoSession }>('/sessions/create', data),

  start: (appointmentId: string) =>
    api.post(`/sessions/${appointmentId}/start`),

  end: (appointmentId: string) =>
    api.post(`/sessions/${appointmentId}/end`),
};
