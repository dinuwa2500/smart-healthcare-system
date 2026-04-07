'use client';
import { useEffect } from 'react';
import { useAuthStore } from '../../shared/store/authStore';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { token, logout } = useAuthStore();

  useEffect(() => {
    if (!token) return;
    // Optionally validate token on mount here
  }, [token, logout]);

  return <>{children}</>;
}
