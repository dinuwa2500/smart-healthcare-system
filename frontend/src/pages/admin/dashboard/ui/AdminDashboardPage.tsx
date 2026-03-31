'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserCheck, Calendar, DollarSign, AlertCircle } from 'lucide-react';
import { doctorApi } from '@/src/entities/doctor/api';
import { paymentApi } from '@/src/entities/payment/api';
import { userApi } from '@/src/entities/user/api';
import { StatusBadge } from '@/src/entities/appointment/ui/StatusBadge';
import type { Appointment } from '@/src/entities/appointment/model';
import { Spinner } from '@/src/shared/ui/Spinner';
import { formatDate, formatTime } from '@/src/shared/lib/formatDate';
import { formatCurrency } from '@/src/shared/lib/formatCurrency';

interface Stats {
  totalPatients: number;
  verifiedDoctors: number;
  todayAppointments: number;
  monthRevenue: number;
  pendingVerifications: number;
}

function StatCard({ label, value, icon, color }: {
  label: string; value: string | number; icon: React.ReactNode; color: string;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`rounded-full p-2.5 ${color}`}>{icon}</div>
      </div>
      <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export function AdminDashboardPage() {
  const router = useRouter();
  const [stats,   setStats]   = useState<Stats | null>(null);
  const [recent,  setRecent]  = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const emptyAppointments = () => Promise.resolve({ data: { data: [] as Appointment[] } });

    Promise.allSettled([
      userApi.getAll({ limit: 1000 }),
      doctorApi.search({ limit: 1000 }),
      emptyAppointments(),
      paymentApi.getMonthRevenue(),
      emptyAppointments(),
      emptyAppointments(),
    ]).then(([usersRes, doctorsRes, todayRes, revenueRes, pendingRes, historyRes]) => {
      const users    = usersRes.status   === 'fulfilled' ? usersRes.value.data.data   : null;
      const doctors  = doctorsRes.status === 'fulfilled' ? doctorsRes.value.data.data : null;
      const today    = todayRes.status   === 'fulfilled' ? todayRes.value.data.data   : [];
      const revenue  = revenueRes.status === 'fulfilled' ? revenueRes.value.data.data : null;
      const pending  = pendingRes.status === 'fulfilled' ? pendingRes.value.data.data : [];
      const history  = historyRes.status === 'fulfilled' ? historyRes.value.data.data : [];

      setStats({
        totalPatients:        users ? (users as { users: { role: string }[] }).users.filter((u) => u.role === 'patient').length : 0,
        verifiedDoctors:      doctors ? doctors.doctors.filter((d) => d.isVerified).length : 0,
        todayAppointments:    today.length,
        monthRevenue:         revenue?.total ?? 0,
        pendingVerifications: doctors ? doctors.doctors.filter((d) => !d.isVerified).length : 0,
      });

      // Last 10 combined (today + recent history)
      const combined = [...today, ...pending, ...history];
      const unique   = combined.filter((a, i, arr) => arr.findIndex((x) => x._id === a._id) === i);
      setRecent(unique.slice(0, 10));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      {/* Pending verifications banner */}
      {stats && stats.pendingVerifications > 0 && (
        <div
          onClick={() => router.push('/admin/manage-doctors')}
          className="mb-6 flex cursor-pointer items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4 hover:bg-yellow-100 transition-colors"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-yellow-600" />
          <p className="text-sm font-medium text-yellow-800">
            <span className="font-bold">{stats.pendingVerifications}</span> doctor{stats.pendingVerifications > 1 ? 's' : ''} pending verification.
          </p>
          <span className="ml-auto text-xs text-yellow-600 underline">Review →</span>
        </div>
      )}

      {/* Stat cards */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Patients"
          value={stats?.totalPatients ?? 0}
          icon={<Users className="h-5 w-5 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Verified Doctors"
          value={stats?.verifiedDoctors ?? 0}
          icon={<UserCheck className="h-5 w-5 text-teal-600" />}
          color="bg-teal-50"
        />
        <StatCard
          label="Today's Appointments"
          value={stats?.todayAppointments ?? 0}
          icon={<Calendar className="h-5 w-5 text-purple-600" />}
          color="bg-purple-50"
        />
        <StatCard
          label="Revenue This Month"
          value={formatCurrency(stats?.monthRevenue ?? 0)}
          icon={<DollarSign className="h-5 w-5 text-green-600" />}
          color="bg-green-50"
        />
      </div>

      {/* Recent activity */}
      <h2 className="mb-4 text-lg font-semibold text-gray-800">Recent Activity</h2>
      {recent.length === 0 ? (
        <p className="rounded-xl border border-dashed border-gray-300 py-10 text-center text-sm text-gray-400">
          No recent activity.
        </p>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Patient', 'Doctor', 'Date & Time', 'Type', 'Status'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recent.map((a) => (
                <tr key={a._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{a.patientName}</td>
                  <td className="px-4 py-3 text-gray-600">Dr. {a.doctorName}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(a.slotDate)} {formatTime(a.slotTime)}</td>
                  <td className="px-4 py-3 text-gray-600 capitalize">{a.consultationType.replace('_', '-')}</td>
                  <td className="px-4 py-3"><StatusBadge status={a.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
