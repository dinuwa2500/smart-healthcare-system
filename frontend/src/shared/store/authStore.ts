import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'patient' | 'doctor' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  name?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  role: UserRole | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => void;
  setUser: (user: AuthUser) => void;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user:      null,
      token:     null,
      role:      null,
      isLoading: false,

      login: async (credentials) => {
        set({ isLoading: true });
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api'}/auth/login`,
            {
              method:  'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body:    JSON.stringify(credentials),
            }
          );
          const json = await res.json();
          if (!res.ok || !json.success) throw new Error(json.error ?? 'Login failed');

          const { accessToken, user } = json.data;
          set({ token: accessToken, user, role: user.role, isLoading: false });
        } catch (err) {
          set({ isLoading: false });
          throw err;
        }
      },

      logout: () => {
        set({ user: null, token: null, role: null });
      },

      setUser: (user) => {
        set({ user, role: user.role });
      },

      setToken: (token) => {
        set({ token });
      },
    }),
    {
      name:    'mediconnect-auth',
      partialize: (state) => ({ user: state.user, token: state.token, role: state.role }),
    }
  )
);
