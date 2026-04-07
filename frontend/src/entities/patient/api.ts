import api from '../../shared/api';
import { PatientProfile, UpdatePatientProfileDto } from './model';

export const patientApi = {
  getMe: async () => {
    return api.get<{ success: boolean; data: PatientProfile }>('/patients/me');
  },

  updateMe: async (dto: UpdatePatientProfileDto) => {
    return api.put<{ success: boolean; data: PatientProfile }>('/patients/me', dto);
  },
};
