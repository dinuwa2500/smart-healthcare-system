export interface User {
  id: string;
  email: string;
  role: 'patient' | 'doctor' | 'admin';
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}
