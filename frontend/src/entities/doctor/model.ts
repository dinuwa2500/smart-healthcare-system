export interface DoctorProfile {
  _id: string;
  authUserId: string;
  firstName: string;
  lastName: string;
  specialization: string;
  qualifications: { degree: string; institution: string; year: number }[];
  experienceYears: number;
  consultationFee: number;
  bio: string;
  languages: string[];
  isVerified: boolean;
  rating: { average: number; count: number };
  createdAt: string;
  updatedAt: string;
}

export interface DoctorSlot {
  _id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  duration: number;
  isActive: boolean;
}
