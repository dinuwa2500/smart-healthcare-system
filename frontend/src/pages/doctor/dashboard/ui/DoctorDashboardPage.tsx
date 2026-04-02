'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowRight, Calendar, Clock, FileText, Settings, Users, Video } from 'lucide-react';
import toast from 'react-hot-toast';
import { appointmentApi } from '@/src/entities/appointment/api';
import { StatusBadge } from '@/src/entities/appointment/ui/StatusBadge';
import type { Appointment } from '@/src/entities/appointment/model';
import { Spinner } from '@/src/shared/ui/Spinner';
import { formatTime } from '@/src/shared/lib/formatDate';
import { Button } from '@/src/shared/ui/Button';
import { doctorApi } from '@/src/entities/doctor/api';
import { Sparkles } from 'lucide-react';

interface StatCardProps { label: string; value: number | string; helper: string; icon: React.ReactNode; color: string; }

function StatCard({ label, value, helper, icon, color }: StatCardProps) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur transition-transform hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{helper}</p>
        </div>
        <div className={`rounded-2xl p-3 ${color}`}>{icon}</div>
      </div>
    </div>
  );
}

export function DoctorDashboardPage() {
  const router = useRouter();
  const [today,   setToday]   = useState<Appointment[]>([]);
  const [pending, setPending] = useState<Appointment[]>([]);
  const [week,    setWeek]    = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    Promise.all([
      appointmentApi.getDoctorToday(),
      appointmentApi.getDoctorPending(),
      appointmentApi.getDoctorWeek(),
    ])
      .then(([t, p, w]) => {
        setToday(t.data.data);
        setPending(p.data.data);
        
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);
        
        const thisWeekAppointments = w.data.data.filter((a: Appointment) => {
          const apptDate = new Date(a.slotDate);
          return apptDate >= now && apptDate <= nextWeek;
        });
        
        setWeek(thisWeekAppointments);
      })
      .catch(() => toast.error('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  const handleGenerateSlots = async () => {
    setGenerating(true);
    try {
      await doctorApi.generateSlots();
      toast.success('Successfully generated weekly slots!');
    } catch {
      toast.error('Failed to generate slots. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  // Unique patients seen this week
  const totalPatients = new Set(week.map((a) => a.patientId)).size;

  const sortedToday = [...today].sort((a, b) => a.slotTime.localeCompare(b.slotTime));
  const nextAppointment = sortedToday[0] ?? null;
  const videoVisitsToday = today.filter((appt) => appt.consultationType === 'video').length;

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="flex flex-col gap-4 rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
            Doctor dashboard
          </span>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Stay on top of appointments, reviews, and patient follow-ups.</h1>
          <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">Use today’s overview to review pending requests quickly, jump into consultations, and keep the rest of your week organized.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 lg:w-full max-w-[540px]">
          <button
            onClick={() => router.push('/doctor/appointments')}
            className="rounded-3xl border border-slate-200 bg-slate-950 px-5 py-4 text-left text-white transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Review appointments</span>
              <ArrowRight className="h-4 w-4" />
            </div>
            <p className="mt-2 text-xs text-slate-300">Manage pending, upcoming, and completed visits.</p>
          </button>
          <button
            onClick={() => router.push('/doctor/schedule')}
            className="rounded-3xl border border-cyan-200 bg-cyan-50 px-5 py-4 text-left text-cyan-900 transition-transform hover:-translate-y-0.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Adjust schedule</span>
              <Calendar className="h-4 w-4" />
            </div>
            <p className="mt-2 text-xs text-cyan-700">Keep your availability accurate for new bookings.</p>
          </button>
          <button
            onClick={() => router.push('/doctor/settings')}
            className="rounded-3xl border border-indigo-200 bg-indigo-50 px-5 py-4 text-left text-indigo-900 transition-transform hover:-translate-y-0.5 sm:col-span-2 xl:col-span-1"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold">Profile Settings</span>
              <Settings className="h-4 w-4" />
            </div>
            <p className="mt-2 text-xs text-indigo-700">Update your bio, specialized fields, and consultation fees.</p>
          </button>
        </div>
      </div>

      {/* Pending alert banner */}
      {pending.length > 0 && (
        <div
          onClick={() => router.push('/doctor/appointments')}
          className="flex cursor-pointer items-center gap-3 rounded-[28px] border border-amber-200 bg-amber-50 px-5 py-4 transition-colors hover:bg-amber-100"
        >
          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm font-medium text-amber-900">
            You have <span className="font-bold">{pending.length}</span> pending appointment request{pending.length > 1 ? 's' : ''} waiting for review.
          </p>
          <span className="ml-auto hidden text-xs font-semibold text-amber-700 sm:inline">Review now</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Today's Appointments"
          value={today.length}
          helper={nextAppointment ? `Next visit at ${formatTime(nextAppointment.slotTime)}` : 'No appointments booked today'}
          icon={<Calendar className="h-5 w-5 text-teal-600" />}
          color="bg-teal-50"
        />
        <StatCard
          label="Pending Requests"
          value={pending.length}
          helper={pending.length > 0 ? 'Review approvals before your next consultation' : 'All requests have been reviewed'}
          icon={<AlertCircle className="h-5 w-5 text-yellow-600" />}
          color="bg-yellow-50"
        />
        <StatCard
          label="This Week"
          value={week.length}
          helper={`${videoVisitsToday} video consultation${videoVisitsToday === 1 ? '' : 's'} scheduled today`}
          icon={<Clock className="h-5 w-5 text-blue-600" />}
          color="bg-blue-50"
        />
        <StatCard
          label="Total Patients (week)"
          value={totalPatients}
          helper="Unique patients seen or booked this week"
          icon={<Users className="h-5 w-5 text-purple-600" />}
          color="bg-purple-50"
        />
      </div>

      {/* Availability Quick Management */}
      <div className="rounded-[32px] border border-white/70 bg-gradient-to-br from-teal-600/90 to-teal-800/90 p-8 text-white shadow-xl shadow-teal-950/10 relative overflow-hidden backdrop-blur-md">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Calendar className="h-32 w-32" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="max-w-xl text-center md:text-left">
            <h3 className="text-2xl font-bold flex items-center justify-center md:justify-start gap-2">
              <Sparkles className="h-6 w-6 text-teal-300" />
              Availability Management
            </h3>
            <p className="mt-2 text-teal-100/80">Need to open slots for the week? Use our smart generator to quickly set up a standard 9-5 schedule for all 7 days.</p>
          </div>
          <Button 
            isLoading={generating}
            onClick={handleGenerateSlots}
            className="rounded-2xl bg-white px-8 py-4 text-teal-900 shadow-xl hover:bg-teal-50 transition-all font-bold h-14"
          >
            Generate Weekly Slots
          </Button>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,1fr)]">
        <section className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
          <div className="mb-6 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Today’s timeline</h2>
              <p className="mt-1 text-sm text-slate-500">See today’s consultations in chronological order and jump into the appointment workspace.</p>
            </div>
            <Button variant="ghost" onClick={() => router.push('/doctor/appointments')} className="rounded-2xl px-4 py-2 text-sm">
              View all
            </Button>
          </div>
          {sortedToday.length === 0 ? (
            <div className="rounded-[28px] border border-dashed border-slate-300 py-14 text-center text-slate-400">
              <Calendar className="mx-auto mb-3 h-10 w-10 opacity-40" />
              <p className="text-sm font-medium">No appointments scheduled for today.</p>
              <p className="mt-1 text-xs">Use your schedule page to open more availability if needed.</p>
            </div>
          ) : (
            <div className="relative space-y-0">
              {/* Vertical line */}
              <div className="absolute left-[72px] top-0 bottom-0 w-px bg-slate-200" />
              {sortedToday.map((appt) => (
                <div
                  key={appt._id}
                  className="group relative flex cursor-pointer items-start gap-4 pb-6"
                  onClick={() => router.push('/doctor/appointments')}
                >
                  {/* Time */}
                  <div className="w-[68px] shrink-0 pt-1 text-right text-xs font-semibold text-slate-400">
                    {formatTime(appt.slotTime)}
                  </div>
                  {/* Dot */}
                  <div className="relative z-10 mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-cyan-500 bg-white" />
                  {/* Card */}
                  <div className="flex-1 rounded-[24px] border border-slate-200 bg-slate-50/70 p-4 transition-all group-hover:border-cyan-200 group-hover:bg-white group-hover:shadow-md">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{appt.patientName}</p>
                        <p className="mt-1 text-xs text-slate-500 capitalize">{appt.consultationType.replace('_', '-')} · {appt.durationMinutes} min</p>
                      </div>
                      <StatusBadge status={appt.status} />
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1">
                        {appt.consultationType === 'video' ? <Video className="h-3.5 w-3.5" /> : <FileText className="h-3.5 w-3.5" />}
                        {appt.consultationType === 'video' ? 'Video visit' : 'In-person visit'}
                      </span>
                      {appt.reason && <span className="line-clamp-1">{appt.reason}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-6">
          <div className="rounded-[32px] border border-white/70 bg-slate-950 p-6 text-white shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">Next up</p>
            {nextAppointment ? (
              <>
                <h3 className="mt-3 text-2xl font-semibold">{nextAppointment.patientName}</h3>
                <p className="mt-2 text-sm text-slate-300">{formatTime(nextAppointment.slotTime)} · {nextAppointment.durationMinutes} min · {nextAppointment.consultationType === 'video' ? 'Video consultation' : 'In-person consultation'}</p>
                <div className="mt-5 flex flex-wrap gap-3">
                  <Button onClick={() => router.push('/doctor/appointments')} className="rounded-2xl bg-cyan-500 text-slate-950 hover:bg-cyan-400">
                    Open appointments
                  </Button>
                  <Button variant="secondary" onClick={() => router.push('/doctor/patient-records')} className="rounded-2xl border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white">
                    Patient records
                  </Button>
                </div>
              </>
            ) : (
              <>
                <h3 className="mt-3 text-2xl font-semibold">No upcoming visit today</h3>
                <p className="mt-2 text-sm text-slate-300">Use the extra time to review records, confirm requests, or update availability.</p>
              </>
            )}
          </div>

          <div className="rounded-[32px] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Pending requests</h3>
                <p className="mt-1 text-sm text-slate-500">Respond quickly to keep patients informed.</p>
              </div>
              <Button variant="ghost" onClick={() => router.push('/doctor/appointments')} className="rounded-2xl px-4 py-2 text-sm">
                Review
              </Button>
            </div>
            <div className="mt-5 space-y-3">
              {pending.length === 0 ? (
                <div className="rounded-[24px] border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-400">
                  No pending requests right now.
                </div>
              ) : (
                pending.slice(0, 3).map((appt) => (
                  <button
                    key={appt._id}
                    onClick={() => router.push('/doctor/appointments')}
                    className="flex w-full items-start justify-between rounded-[24px] border border-slate-200 bg-slate-50/80 px-4 py-4 text-left transition-colors hover:border-cyan-200 hover:bg-cyan-50/60"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{appt.patientName}</p>
                      <p className="mt-1 text-xs text-slate-500">{formatTime(appt.slotTime)} · {appt.durationMinutes} min</p>
                    </div>
                    <StatusBadge status={appt.status} />
                  </button>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
