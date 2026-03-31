export interface Payment {
  _id: string;
  appointmentId: string;
  patientId: string;
  doctorId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  stripePaymentIntentId: string;
  stripeClientSecret: string;
  stripeChargeId: string;
  createdAt: string;
  updatedAt: string;
}
