'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Calendar, CalendarClock, Clock3, Video, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { appointmentApi } from '@/src/entities/appointment/api';
import { StatusBadge } from '@/src/entities/appointment/ui/StatusBadge';
import type { Appointment } from '@/src/entities/appointment/model';
import { Tabs } from '@/src/shared/ui/Tabs';
import { Button } from '@/src/shared/ui/Button';
import { Spinner } from '@/src/shared/ui/Spinner';
import { formatDate, formatTime } from '@/src/shared/lib/formatDate';
import { formatCurrency } from '@/src/shared/lib/formatCurrency';
import { PatientPageHeader } from '@/src/widgets/patient-shell/ui/PatientPageHeader';

const TABS = [
  { label: 'Today',     value: 'today'    },
  { label: 'Upcoming',  value: 'upcoming' },
  { label: 'Past',      value: 'past'     },
  { label: 'Cancelled', value: 'cancelled' },
];

function canJoin(appointment: Appointment): boolean {
  // if (appointment.status !== 'confirmed') return false;
  // const slotMs = new Date(`${appointment.slotDate}T${appointment.slotTime}`).getTime();
  // return Date.now() >= slotMs - 10 * 60 * 1000;
   return appointment.status === 'confirmed';
}

function canCancel(appointment: Appointment): boolean {
  if (appointment.status !== 'pending') return false;
  const slotMs = new Date(`${appointment.slotDate}T${appointment.slotTime}`).getTime();
  return Date.now() < slotMs - 2 * 60 * 60 * 1000;
}

function SkeletonRow() {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 animate-pulse shadow-sm backdrop-blur space-y-3">
      <div className="flex justify-between">
        <div className="h-5 w-48 bg-gray-200 rounded" />
        <div className="h-5 w-20 bg-gray-200 rounded-full" />
      </div>
      <div className="h-4 w-36 bg-gray-200 rounded" />
      <div className="h-4 w-24 bg-gray-200 rounded" />
    </div>
  );
}

function AppointmentCard({ appt, onCancel }: { appt: Appointment; onCancel: (id: string) => void }) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    if (!window.confirm('Cancel this appointment?')) return;
    setCancelling(true);
    try {
      await appointmentApi.cancel(appt._id);
      toast.success('Appointment cancelled');
      onCancel(appt._id);
    } catch {
      toast.error('Could not cancel appointment');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-lg font-semibold text-slate-900">Dr. {appt.doctorName}</p>
          <p className="text-sm font-medium text-teal-700">{appt.doctorSpecialty}</p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {formatDate(appt.slotDate)} at {formatTime(appt.slotTime)}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5">{formatCurrency(appt.consultationFee)}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1.5 capitalize">{appt.consultationType.replace('_', '-')}</span>
          </div>
        </div>
        <StatusBadge status={appt.status} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
        {canJoin(appt) && (
          <Button
            size="sm"
            onClick={() => router.push(`/patient/video-session?appointmentId=${appt._id}`)}
          >
            <Video className="h-4 w-4" />
            Join Video
          </Button>
        )}
        {canCancel(appt) && (
          <Button
            size="sm"
            variant="danger"
            isLoading={cancelling}
            onClick={handleCancel}
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        )}
      </div>
    </div>
  );
}

function AppointmentList({ appointments, onCancel }: {
  appointments: Appointment[];
  onCancel: (id: string) => void;
}) {
  if (appointments.length === 0) {
    return (
      <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/80 px-6 py-12 text-center shadow-sm">
        <CalendarClock className="mx-auto mb-3 h-12 w-12 text-slate-300" />
        <p className="text-lg font-semibold text-slate-900">No appointments found</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">When you book a consultation, your timeline and visit details will appear here.</p>
        <Link href="/patient/find-doctors" className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800">
          Find doctors
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      {appointments.map((a) => (
        <AppointmentCard key={a._id} appt={a} onCancel={onCancel} />
      ))}
    </div>
  );
}

export function MyAppointmentsPage() {
  const [upcoming,  setUpcoming]  = useState<Appointment[]>([]);
  const [history,   setHistory]   = useState<Appointment[]>([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([appointmentApi.getMyUpcoming(), appointmentApi.getMyHistory()])
      .then(([u, h]) => {
        setUpcoming(u.data.data);
        setHistory(h.data.data);
      })
      .catch(() => toast.error('Failed to load appointments'))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = (id: string) => {
    setUpcoming((prev) => prev.filter((a) => a._id !== id));
  };

  const isToday = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    return d.getFullYear() === now.getFullYear() &&
           d.getMonth() === now.getMonth() &&
           d.getDate() === now.getDate();
  };

  const todayAppointments = [...upcoming, ...history].filter(a => isToday(a.slotDate));
  const past              = history.filter((a) => a.status === 'completed' || a.status === 'no_show');
  const cancelled         = history.filter((a) => a.status.startsWith('cancelled'));

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6 py-2">
        <div className="flex h-64 items-center justify-center rounded-[28px] border border-white/70 bg-white/85 shadow-sm backdrop-blur">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-2">
      <PatientPageHeader
        eyebrow="Appointments"
        title="Stay on top of every visit"
        description="Review upcoming consultations, join video appointments on time, and keep a clear record of completed or cancelled visits."
        actions={
          <Link href="/patient/find-doctors" className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800">
            Book a new visit
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
            <Calendar className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm text-slate-500">Today</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{todayAppointments.length}</p>
        </div>
        <div className="rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <CalendarClock className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm text-slate-500">Upcoming</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{upcoming.length}</p>
        </div>
        <div className="rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
            <Clock3 className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm text-slate-500">Past visits</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{past.length}</p>
        </div>
        <div className="rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
            <X className="h-5 w-5" />
          </div>
          <p className="mt-4 text-sm text-slate-500">Cancelled</p>
          <p className="mt-1 text-3xl font-semibold text-slate-900">{cancelled.length}</p>
        </div>
      </div>

      <Tabs tabs={TABS}>
        {(tab) => (
          <>
            {tab === 'today'     && <AppointmentList appointments={todayAppointments} onCancel={handleCancel} />}
            {tab === 'upcoming'  && <AppointmentList appointments={upcoming}  onCancel={handleCancel} />}
            {tab === 'past'      && <AppointmentList appointments={past}      onCancel={() => {}} />}
            {tab === 'cancelled' && <AppointmentList appointments={cancelled} onCancel={() => {}} />}
          </>
        )}
      </Tabs>
    </div>
  );
}
