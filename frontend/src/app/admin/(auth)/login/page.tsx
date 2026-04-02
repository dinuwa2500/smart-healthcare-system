'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/src/shared/store/authStore';
import { Button } from '@/src/shared/ui/Button';
import { Input } from '@/src/shared/ui/Input';
import { getErrorMessage } from '@/src/shared/lib/getErrorMessage';

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, logout, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      const { role } = useAuthStore.getState();
       
      if (role !== 'admin') {
        logout();
        toast.error('Access denied. Admin only.');
        router.replace('/admin/login');
        return;
      }
       
      toast.success('Welcome, Admin!');
      router.replace('/admin/dashboard');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err));
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
          <h1 className="text-2xl font-bold text-white">Admin Portal</h1>
          <p className="text-sm text-gray-400">Sign in to access admin dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            id="email"
            label="Email"
            type="email"
            placeholder="admin@mediconnect.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            labelClassName="text-gray-200"
            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
          />
          <Input
            id="password"
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            labelClassName="text-gray-200"
            className="bg-gray-700 border-gray-600 text-white placeholder:text-gray-400"
          />
          <Button type="submit" isLoading={loading} className="w-full bg-teal-500 hover:bg-teal-600">
            Sign In as Admin
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-400">
          Need admin access?{' '}
          <a href="/admin/register" className="font-medium text-teal-400 hover:underline">
            Request Access
          </a>
        </p>
      </div>
    </div>
  );
}
