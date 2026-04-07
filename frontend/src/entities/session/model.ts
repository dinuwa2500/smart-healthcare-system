export interface VideoSession {
  sessionId: string;
  appointmentId: string;
  channelName: string;
  patientUid: number;
  patientRtcToken: string;
  doctorUid: number;
  doctorRtcToken: string;
  agoraAppId: string;
  scheduledAt: string;
  status: 'scheduled' | 'active' | 'ended' | 'cancelled';
}
