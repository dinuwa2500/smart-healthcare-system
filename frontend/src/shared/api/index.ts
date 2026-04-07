import axios from 'axios';
import { useAuthStore } from '../store/authStore';

type RetryableRequestConfig = {
  _retry?: boolean;
  headers?: Record<string, string>;
  url?: string;
};

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
  withCredentials: true,
});

let refreshPromise: Promise<string | null> | null = null;

const getLoginPath = () =>
  typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login';

const refreshAccessToken = async () => {
  if (!refreshPromise) {
    refreshPromise = fetch(`${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000/api'}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok || !json.success || !json.data?.accessToken) {
          throw new Error(json.error ?? 'Refresh failed');
        }

        const nextToken = json.data.accessToken as string;
        useAuthStore.getState().setToken(nextToken);
        return nextToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
};

// ── Request interceptor: attach Bearer token ─────────────────
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 ────────────────────────
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = (error.config ?? {}) as RetryableRequestConfig;

    if (error.response?.status === 401) {
      const isRefreshRequest = originalRequest.url?.includes('/auth/refresh');

      if (!originalRequest._retry && !isRefreshRequest) {
        originalRequest._retry = true;

        try {
          const nextToken = await refreshAccessToken();
          if (nextToken) {
            originalRequest.headers = {
              ...(originalRequest.headers ?? {}),
              Authorization: `Bearer ${nextToken}`,
            };
            return api(originalRequest);
          }
        } catch {
        }
      }

      if (typeof window !== 'undefined') {
        useAuthStore.getState().logout();
        window.location.href = getLoginPath();
      } else {
        useAuthStore.getState().logout();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
