import { ProtectedRoute } from '@/src/app/providers/ProtectedRoute';
import { PatientShell } from '@/src/widgets/patient-shell/ui/PatientShell';

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRole="patient">
      <PatientShell>{children}</PatientShell>
    </ProtectedRoute>
  );
}
