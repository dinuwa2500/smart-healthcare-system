'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, UserRole } from '../../shared/store/authStore';
import { Spinner } from '../../shared/ui/Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole: UserRole;
}

export function ProtectedRoute({ children, allowedRole }: ProtectedRouteProps) {
  const { token, role, isLoading } = useAuthStore();
  const router = useRouter();
  const loginPath = allowedRole === 'admin' ? '/admin/login' : '/login';

  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      router.replace(loginPath);
      return;
    }
    if (role && role !== allowedRole) {
      router.replace(`/${role}/dashboard`);
    }
  }, [token, role, isLoading, allowedRole, loginPath, router]);

  if (isLoading || !token || role !== allowedRole) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}
