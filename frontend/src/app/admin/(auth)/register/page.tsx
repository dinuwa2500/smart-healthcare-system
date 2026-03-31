'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '@/src/shared/api';
import { Button } from '@/src/shared/ui/Button';
import { Input } from '@/src/shared/ui/Input';

export default function AdminRegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '', adminCode: '' });
  const [loading, setLoading] = useState(false);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (form.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post<{ success: boolean; data: { userId: string; email: string; role: string } }>(
        '/auth/register', 
        { email: form.email, password: form.password, role: 'admin', adminCode: form.adminCode }
      );
      
      toast.success('Admin account created successfully. Please login.');
      router.replace('/admin/login');
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
    <div className="flex min-h-screen items-center justify-center bg-gray-900 px-4">
      <div className="w-full max-w-md rounded-2xl bg-gray-800 p-8 shadow-xl">
        <div className="mb-8 flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-500">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Admin Registration</h1>
          <p className="text-sm text-gray-400">Create an administrator account</p>
        </div>

        <div className="mb-6 rounded-lg bg-yellow-900/30 border border-yellow-700 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div className="text-sm text-yellow-200">
              <p className="font-medium">Admin Access Required</p>
              <p className="mt-1 text-yellow-300/80">You need an admin invitation code to register. Contact the system administrator.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="admin@mediconnect.com"
            value={form.email}
            onChange={set('email')}
            required
            labelClassName="text-gray-200"
            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
          />
          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="Min 6 characters"
            value={form.password}
            onChange={set('password')}
            required
            labelClassName="text-gray-200"
            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
          />
          <Input
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            placeholder="Confirm your password"
            value={form.confirmPassword}
            onChange={set('confirmPassword')}
            required
            labelClassName="text-gray-200"
            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
          />
          <Input
            id="adminCode"
            label="Admin Invitation Code"
            type="password"
            placeholder="Enter admin code"
            value={form.adminCode}
            onChange={set('adminCode')}
            required
            labelClassName="text-gray-200"
            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
          />
          <Button type="submit" isLoading={loading} className="w-full bg-teal-500 hover:bg-teal-600">
            Create Admin Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Already have an account?{' '}
          <a href="/admin/login" className="font-medium text-teal-400 hover:underline">
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
