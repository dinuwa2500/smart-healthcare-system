'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/src/shared/api';
import { useAuthStore } from '@/src/shared/store/authStore';
import { Button } from '@/src/shared/ui/Button';
import { Input } from '@/src/shared/ui/Input';
import { getErrorMessage } from '@/src/shared/lib/getErrorMessage';

export default function RegisterPage() {
  const router = useRouter();
  const { setToken, setUser } = useAuthStore();
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'patient' as 'patient' | 'doctor',
    firstName: '',
    lastName: '',
    specialization: 'General Practice',
  });
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
      
      toast.success('Registration successful. Please login.');
      router.replace('/login');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-lg">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-600">
            <Heart className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
          <p className="text-sm text-gray-500">Join MediConnect today</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input id="firstName" label="First Name" placeholder="John"
              value={form.firstName} onChange={set('firstName')} required />
            <Input id="lastName" label="Last Name" placeholder="Doe"
              value={form.lastName} onChange={set('lastName')} required />
          </div>

          <Input id="email" label="Email" type="email" placeholder="you@example.com"
            value={form.email} onChange={set('email')} required />
          <Input id="password" label="Password" type="password" placeholder="Min 6 characters"
            value={form.password} onChange={set('password')} required />
          
          <div className="flex flex-col gap-1">
            <label htmlFor="role" className="text-sm font-medium text-gray-700">I am a</label>
            <select id="role" value={form.role} onChange={set('role')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
              <option value="patient">Patient</option>
              <option value="doctor">Doctor</option>
            </select>
          </div>

          {form.role === 'doctor' && (
            <div className="flex flex-col gap-1 animate-in fade-in slide-in-from-top-2 duration-300">
              <label htmlFor="specialization" className="text-sm font-medium text-gray-700">Specialization</label>
              <select id="specialization" value={form.specialization} onChange={set('specialization')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                <option value="General Practice">General Practice</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Neurology">Neurology</option>
                <option value="Dermatology">Dermatology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Gynecology">Gynecology</option>
                <option value="Psychiatry">Psychiatry</option>
              </select>
            </div>
          )}

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
