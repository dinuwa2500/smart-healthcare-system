'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, UserCheck, Calendar, DollarSign, AlertCircle, ArrowUpRight, TrendingUp, Settings, ShieldCheck, Mail, Clock } from 'lucide-react';
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

function StatCard({ label, value, icon, color, trend, link }: {
  label: string; value: string | number; icon: React.ReactNode; color: string; trend?: string; link?: string;
}) {
  const router = useRouter();
  return (
    <div 
      onClick={() => link && router.push(link)}
      className={`group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-md ${link ? 'cursor-pointer hover:border-blue-100' : ''}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center gap-1 text-xs font-medium text-emerald-600">
              <TrendingUp className="h-3 w-3" />
              <span>{trend} increase</span>
            </div>
          )}
        </div>
        <div className={`rounded-xl p-3 transition-transform group-hover:scale-110 ${color}`}>{icon}</div>
      </div>
      {link && (
        <div className="mt-4 flex items-center text-xs font-medium text-blue-600 opacity-0 transition-opacity group-hover:opacity-100">
          View details <ArrowUpRight className="ml-1 h-3 w-3" />
        </div>
      )}
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gray-50 opacity-10 transition-transform group-hover:scale-150"></div>
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
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Welcome Hero Area */}
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Dashboard</h1>
          <p className="mt-1 text-gray-500">Welcome back, Administrator. Here's a summary of the system today.</p>
        </div>
        <div className="flex items-center gap-2 text-sm font-medium text-gray-500 bg-white px-4 py-2 rounded-lg border border-gray-100 shadow-sm">
          <Clock className="h-4 w-4 text-blue-500" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* Pending verifications banner */}
      {stats && stats.pendingVerifications > 0 && (
        <div
          onClick={() => router.push('/admin/manage-doctors')}
          className="group mb-8 flex cursor-pointer items-center gap-4 rounded-2xl border border-amber-100 bg-amber-50/50 px-6 py-4 backdrop-blur-sm transition-all hover:bg-amber-50"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
            <AlertCircle className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-amber-900">Verification Requests</p>
            <p className="text-sm text-amber-700">
              <span className="font-bold">{stats.pendingVerifications}</span> doctor{stats.pendingVerifications > 1 ? 's' : ''} awaiting approval to join the platform.
            </p>
          </div>
          <button className="ml-auto flex items-center gap-1 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-amber-700">
            Review Now
          </button>
        </div>
      )}

      {/* Stat cards grid */}
      <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Patients"
          value={stats?.totalPatients ?? 0}
          icon={<Users className="h-6 w-6 text-blue-600" />}
          color="bg-blue-50 text-blue-600"
          trend="12%"
          link="/admin/manage-users"
        />
        <StatCard
          label="Verified Doctors"
          value={stats?.verifiedDoctors ?? 0}
          icon={<UserCheck className="h-6 w-6 text-emerald-600" />}
          color="bg-emerald-50 text-emerald-600"
          trend="5%"
          link="/admin/manage-doctors"
        />
        <StatCard
          label="Today's Appointments"
          value={stats?.todayAppointments ?? 0}
          icon={<Calendar className="h-6 w-6 text-indigo-600" />}
          color="bg-indigo-50 text-indigo-600"
          trend="8%"
        />
        <StatCard
          label="Monthly Revenue"
          value={formatCurrency(stats?.monthRevenue ?? 0)}
          icon={<DollarSign className="h-6 w-6 text-amber-600" />}
          color="bg-amber-50 text-amber-600"
          trend="15%"
          link="/admin/transactions"
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent activity table */}
        <div className="lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Recent Appointments</h2>
            <button className="text-sm font-semibold text-blue-600 hover:text-blue-700">View all</button>
          </div>
          
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            {recent.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 rounded-full bg-gray-50 p-4">
                  <Calendar className="h-8 w-8 text-gray-300" />
                </div>
                <p className="text-gray-400 font-medium">No recent appointments found</p>
                <p className="text-xs text-gray-300">New activity will appear here as it occurs</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50/50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <tr>
                      <th className="px-6 py-4 text-left">Patient</th>
                      <th className="px-6 py-4 text-left">Doctor</th>
                      <th className="px-6 py-4 text-left">Schedule</th>
                      <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {recent.map((a) => (
                      <tr key={a._id} className="group hover:bg-gray-50/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
                              {a.patientName.charAt(0)}
                            </div>
                            <span className="font-semibold text-gray-900">{a.patientName}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-600">Dr. {a.doctorName}</span>
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-500">
                              {a.consultationType.replace('_', '-')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900">{formatDate(a.slotDate)}</span>
                            <span className="text-xs text-gray-500">{formatTime(a.slotTime)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <StatusBadge status={a.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions & Maintenance */}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-bold text-gray-900">Quick Actions</h3>
            <div className="grid grid-cols-1 gap-3">
              {[
                { label: 'Manage Doctors', icon: <UserCheck className="h-4 w-4" />, link: '/admin/manage-doctors', color: 'text-emerald-600 bg-emerald-50' },
                { label: 'Review Users', icon: <Users className="h-4 w-4" />, link: '/admin/manage-users', color: 'text-blue-600 bg-blue-50' },
                { label: 'Platform Settings', icon: <Settings className="h-4 w-4" />, link: '/admin/settings', color: 'text-gray-600 bg-gray-50' },
                { label: 'Security Logs', icon: <ShieldCheck className="h-4 w-4" />, link: '/admin/security', color: 'text-rose-600 bg-rose-50' },
              ].map((action) => (
                <button
                  key={action.label}
                  onClick={() => router.push(action.link)}
                  className="flex items-center gap-3 rounded-xl p-3 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${action.color}`}>
                    {action.icon}
                  </div>
                  {action.label}
                  <ArrowUpRight className="ml-auto h-4 w-4 text-gray-300" />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-6 text-white shadow-lg shadow-blue-200">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
              <Mail className="h-6 w-6" />
            </div>
            <h3 className="mb-2 text-xl font-bold">Need Help?</h3>
            <p className="mb-6 text-sm text-blue-100 opacity-90">Having trouble with the platform? Our technical team is always here for support.</p>
            <button className="w-full rounded-xl bg-white py-3 text-sm font-bold text-blue-600 transition-transform active:scale-95">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
