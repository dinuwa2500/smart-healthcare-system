import api from '../../shared/api';
import type { Payment } from './model';

export const paymentApi = {
  createIntent: (data: { appointmentId: string; amount: number; patientId: string; doctorId: string; currency?: string }) =>
    api.post<{ success: boolean; data: { clientSecret: string; paymentId: string } }>(
      '/payments/create-intent',
      { ...data, amountLKR: data.amount }
    ),

  getByAppointment: (appointmentId: string) =>
    api.get<{ success: boolean; data: Payment }>(`/payments/appointment/${appointmentId}`),

  refund: (id: string) =>
    api.post<{ success: boolean; data: Payment }>(`/payments/${id}/refund`),

  confirm: (id: string, appointmentId?: string) =>
    api.post<{ success: boolean; data: { status: string; message: string } }>(`/payments/${id}/confirm`, { appointmentId }),

  // ── Admin ────────────────────────────────────────────────
  getAll: (params?: { status?: string; from?: string; to?: string; page?: number; limit?: number }) =>
    api.get<{ success: boolean; data: { payments: Payment[]; total: number } }>('/payments', { params }),

  getMonthRevenue: () =>
    api.get<{ success: boolean; data: { total: number } }>('/payments/stats/month'),
};
