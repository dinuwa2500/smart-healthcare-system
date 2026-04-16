import api from '../../shared/api';
import { Appointment } from '../appointment/model';
import { PatientProfile, Prescription, UpdatePatientProfileDto } from './model';

export const patientApi = {
  getMe: async () => {
    return api.get<{ success: boolean; data: PatientProfile }>('/patients/me');
  },

  updateMe: async (dto: UpdatePatientProfileDto) => {
    return api.put<{ success: boolean; data: PatientProfile }>('/patients/me', dto);
  },

  getHistory: async () => {
    return api.get<{ success: boolean; data: Appointment[] }>('/patients/me/history');
  },

  getPrescriptions: async () => {
    return api.get<{ success: boolean; data: Prescription[] }>('/patients/me/prescriptions');
  },
};
