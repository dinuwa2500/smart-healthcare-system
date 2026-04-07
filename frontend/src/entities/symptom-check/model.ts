export type UrgencyLevel = 'routine' | 'soon' | 'urgent' | 'emergency';
export type Severity     = 'mild' | 'moderate' | 'severe';

export interface SymptomCheck {
  _id: string;
  patientId: string;
  symptoms: string;
  severity?: Severity;
  duration?: string;
  age?: number;
  gender?: string;
  suggestedSpecialty: string;
  urgencyLevel: UrgencyLevel;
  generalAdvice: string;
  redFlags: string[];
  disclaimer: string;
  createdAt: string;
}

export interface SymptomCheckResult {
  suggestedSpecialty: string;
  urgencyLevel: UrgencyLevel;
  generalAdvice: string;
  redFlags: string[];
  disclaimer: string;
  fallback?: boolean;
}
