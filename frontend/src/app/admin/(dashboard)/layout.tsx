import { ProtectedRoute } from '@/src/app/providers/ProtectedRoute';
import { AdminSidebar } from '@/src/widgets/admin-sidebar/ui/AdminSidebar';

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRole="admin">
      <div className="flex min-h-screen bg-gray-50">
        <AdminSidebar />
        <main className="flex-1 overflow-auto md:pl-0 pt-0">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}
