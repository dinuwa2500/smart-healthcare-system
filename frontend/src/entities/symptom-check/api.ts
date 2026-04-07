import api from '../../shared/api';
import type { SymptomCheck, SymptomCheckResult, Severity } from './model';

export const symptomCheckApi = {
  check: (data: {
    symptoms: string;
    severity?: Severity;
    duration?: string;
    age?: number;
    gender?: string;
  }) =>
    api.post<{ success: boolean; data: SymptomCheckResult; fallback?: boolean }>(
      '/symptoms/check',
      data
    ),

  getHistory: (params?: { page?: number; limit?: number }) =>
    api.get<{ success: boolean; data: { checks: SymptomCheck[]; total: number; page: number } }>(
      '/symptoms/history',
      { params }
    ),
};
