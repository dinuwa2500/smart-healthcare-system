'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/src/shared/api';
import { useAuthStore } from '@/src/shared/store/authStore';
import { Button } from '@/src/shared/ui/Button';
import { Input } from '@/src/shared/ui/Input';

export default function RegisterPage() {
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();
  const [form, setForm] = useState({ email: '', password: '', role: 'patient' as 'patient' | 'doctor' });
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post<{ success: boolean; data: { userId?: string; id?: string; email: string; role: 'patient' | 'doctor' | 'admin' } }>(
        '/auth/register', form
      );
      
      const responseData = res.data.data;
      // We don't get an accessToken on register, so we redirect to login to sign in
      toast.success('Registration successful. Please login.');
      router.replace('/login');
    } catch (err: unknown) {
      const message = err instanceof Error 
        ? (err as { response?: { data?: { error?: string } } }).response?.data?.error || err.message 
        : 'Registration failed';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-sm text-gray-500">Join MediConnect today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input id="email" label="Email" type="email" placeholder="you@example.com"
            value={form.email} onChange={set('email')} required />
          <Input id="password" label="Password" type="password" placeholder="Min 8 characters"
            value={form.password} onChange={set('password')} required />
          <div className="flex flex-col gap-1">
            <label htmlFor="role" className="text-sm font-medium text-gray-700">I am a</label>
            <select id="role" value={form.role} onChange={set('role')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>
          <Button type="submit" isLoading={loading} className="w-full">Create Account</Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Already have an account?{' '}
          <a href="/login" className="font-medium text-teal-600 hover:underline">Sign in</a>
        </p>
      </div>
    </div>
  );
}
