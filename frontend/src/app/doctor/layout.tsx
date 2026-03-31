import { ProtectedRoute } from '@/src/app/providers/ProtectedRoute';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedRoute allowedRole="doctor">{children}</ProtectedRoute>;
}
