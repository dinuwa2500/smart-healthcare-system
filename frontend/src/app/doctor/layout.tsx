import { ProtectedRoute } from '@/src/app/providers/ProtectedRoute';
import { DoctorShell } from '@/src/widgets/doctor-shell/ui/DoctorShell';

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRole="doctor">
      <DoctorShell>{children}</DoctorShell>
    </ProtectedRoute>
  );
}
