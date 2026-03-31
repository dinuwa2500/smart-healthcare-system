'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, Users, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { appointmentApi } from '@/src/entities/appointment/api';
import { StatusBadge } from '@/src/entities/appointment/ui/StatusBadge';
import type { Appointment } from '@/src/entities/appointment/model';
import { Spinner } from '@/src/shared/ui/Spinner';
import { formatTime } from '@/src/shared/lib/formatDate';

interface StatCardProps { label: string; value: number | string; icon: React.ReactNode; color: string; }

function StatCard({ label, value, icon, color }: StatCardProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <div className={`rounded-full p-2 ${color}`}>{icon}</div>
      </div>
      <p className="mt-3 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}

export function DoctorDashboardPage() {
  const router = useRouter();
  const [today,   setToday]   = useState<Appointment[]>([]);
  const [pending, setPending] = useState<Appointment[]>([]);
  const [week,    setWeek]    = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      appointmentApi.getDoctorToday(),
      appointmentApi.getDoctorPending(),
      appointmentApi.getDoctorWeek(),
    ])
      .then(([t, p, w]) => {
        setToday(t.data.data);
        setPending(p.data.data);
        setWeek(w.data.data);
      })
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  // Unique patients seen this week
  const totalPatients = new Set(week.map((a) => a.patientId)).size;

  const sortedToday = [...today].sort((a, b) => a.slotTime.localeCompare(b.slotTime));

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* Pending alert banner */}
      {pending.length > 0 && (
        <div
          onClick={() => router.push('/doctor/appointments')}
          className="mb-6 flex cursor-pointer items-center gap-3 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-4 hover:bg-yellow-100 transition-colors"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-yellow-600" />
          <p className="text-sm font-medium text-yellow-800">
            You have <span className="font-bold">{pending.length}</span> pending appointment request{pending.length > 1 ? 's' : ''} waiting for review.
          </p>
          <span className="ml-auto text-xs text-yellow-600 underline">Review →</span>
        </div>
      )}

      {/* Stats */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today's Appointments"
          value={today.length}
          icon={<Calendar className="h-5 w-5 text-teal-600" />}
          color="bg-teal-50"
        />
        <StatCard
          label="Pending Requests"
          value={pending.length}
          icon={<AlertCircle className="h-5 w-5 text-yellow-600" />}
          color="bg-yellow-50"
        />
        <StatCard
          label="This Week"
          value={week.length}
          icon={<Clock className="h-5 w-5 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Total Patients (week)"
          value={totalPatients}
          icon={<Users className="h-5 w-5 text-purple-600" />}
          color="bg-purple-50"
        />
      </div>

      {/* Today's timeline */}
      <h2 className="mb-4 text-lg font-semibold text-gray-800">Today's Timeline</h2>
      {sortedToday.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 py-12 text-center text-gray-400">
          <Calendar className="mx-auto h-8 w-8 mb-2 opacity-40" />
          <p className="text-sm">No appointments scheduled for today.</p>
        </div>
      ) : (
        <div className="relative space-y-0">
          {/* Vertical line */}
          <div className="absolute left-[72px] top-0 bottom-0 w-px bg-gray-200" />
          {sortedToday.map((appt) => (
            <div
              key={appt._id}
              className="relative flex items-start gap-4 pb-6 cursor-pointer group"
              onClick={() => router.push('/doctor/appointments')}
            >
              {/* Time */}
              <div className="w-[68px] shrink-0 pt-1 text-right text-xs font-medium text-gray-400">
                {formatTime(appt.slotTime)}
              </div>
              {/* Dot */}
              <div className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-teal-500 bg-white mt-0.5" />
              {/* Card */}
              <div className="flex-1 rounded-xl border border-gray-200 bg-white p-4 shadow-sm group-hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{appt.patientName}</p>
                    <p className="text-xs text-gray-500 capitalize">{appt.consultationType.replace('_', '-')} · {appt.durationMinutes} min</p>
                  </div>
                  <StatusBadge status={appt.status} />
                </div>
                {appt.reason && (
                  <p className="mt-2 text-xs text-gray-500 line-clamp-2">{appt.reason}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
