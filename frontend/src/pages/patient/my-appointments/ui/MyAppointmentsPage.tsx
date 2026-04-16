'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, Calendar, CalendarClock, CalendarX2, CheckCircle2,
  Clock, CreditCard, MapPin, Stethoscope, Video, X, XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { appointmentApi } from '@/src/entities/appointment/api';
import type { Appointment } from '@/src/entities/appointment/model';
import { Button } from '@/src/shared/ui/Button';
import { Spinner } from '@/src/shared/ui/Spinner';
import { formatDate, formatTime } from '@/src/shared/lib/formatDate';
import { formatCurrency } from '@/src/shared/lib/formatCurrency';
import { PatientPageHeader } from '@/src/widgets/patient-shell/ui/PatientPageHeader';
import { cn } from '@/src/shared/lib/cn';

// ── Status config ─────────────────────────────────────────────
type StatusConfig = {
  label: string;
  color: string;
  bg: string;
  border: string;
  dot: string;
  icon: React.ReactNode;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  confirmed: {
    label: 'Confirmed',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    dot: 'bg-emerald-500',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  pending: {
    label: 'Awaiting Doctor',
    color: 'text-amber-700',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    dot: 'bg-amber-400',
    icon: <Clock className="h-3.5 w-3.5" />,
  },
  completed: {
    label: 'Completed',
    color: 'text-slate-600',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
  },
  cancelled_patient: {
    label: 'Cancelled by you',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  cancelled_doctor: {
    label: 'Cancelled by doctor',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    dot: 'bg-rose-500',
    icon: <XCircle className="h-3.5 w-3.5" />,
  },
  no_show: {
    label: 'No Show',
    color: 'text-slate-500',
    bg: 'bg-slate-50',
    border: 'border-slate-200',
    dot: 'bg-slate-400',
    icon: <CalendarX2 className="h-3.5 w-3.5" />,
  },
};

// ── Helpers ───────────────────────────────────────────────────
function getSlotMs(appt: Appointment) {
  return new Date(`${appt.slotDate.slice(0, 10)}T${appt.slotTime}`).getTime();
}

function isToday(appt: Appointment) {
  const d = new Date(appt.slotDate);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

function canJoin(appt: Appointment) {
  return appt.status === 'confirmed' && appt.consultationType === 'video';
}

function canCancel(appt: Appointment) {
  return appt.status === 'pending' && Date.now() < getSlotMs(appt) - 2 * 60 * 60 * 1000;
}

function getRelativeDay(appt: Appointment): string {
  const ms = getSlotMs(appt);
  const diff = Math.round((ms - Date.now()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Tomorrow';
  if (diff > 1 && diff <= 6) return `In ${diff} days`;
  return formatDate(appt.slotDate, { weekday: 'short', day: 'numeric', month: 'short' });
}

// ── Status Pill ───────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? {
    label: status, color: 'text-slate-600', bg: 'bg-slate-100',
    border: 'border-slate-200', dot: 'bg-slate-400', icon: null,
  };
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
      cfg.bg, cfg.border, cfg.color
    )}>
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ── Empty State ───────────────────────────────────────────────
function EmptyState({ message, cta }: { message: string; cta?: boolean }) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-200 bg-white/70 py-14 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
        <CalendarClock className="h-7 w-7" />
      </div>
      <p className="mt-4 text-sm font-semibold text-slate-700">{message}</p>
      {cta && (
        <Link
          href="/patient/find-doctors"
          className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
        >
          Find a doctor <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

// ── Appointment Card ──────────────────────────────────────────
function ApptCard({ appt, onCancel }: { appt: Appointment; onCancel: (id: string) => void }) {
  const router = useRouter();
  const [cancelling, setCancelling] = useState(false);
  const todayFlag = isToday(appt);
  const cfg = STATUS_CONFIG[appt.status];
  const isActive = appt.status === 'confirmed' || appt.status === 'pending';

  const handleCancel = async () => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setCancelling(true);
    try {
      await appointmentApi.cancel(appt._id);
      toast.success('Appointment cancelled');
      onCancel(appt._id);
    } catch {
      toast.error('Could not cancel – try again');
    } finally {
      setCancelling(false);
    }
  };

  return (
    <div className={cn(
      'group relative overflow-hidden rounded-[24px] border bg-white shadow-sm transition-all duration-200 hover:shadow-md',
      todayFlag && isActive ? 'border-emerald-200 ring-1 ring-emerald-200' : 'border-slate-100',
    )}>
      {/* Left accent stripe */}
      <div className={cn('absolute inset-y-0 left-0 w-1 rounded-l-[24px]', cfg?.dot ?? 'bg-slate-300')} />

      <div className="pl-5 pr-5 pt-4 pb-4">
        {/* Row 1: date chip + status */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {todayFlag && isActive && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Today
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <Calendar className="h-3 w-3" />
              {formatDate(appt.slotDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
              <Clock className="h-3 w-3" />
              {formatTime(appt.slotTime)}
            </span>
          </div>
          <StatusPill status={appt.status} />
        </div>

        {/* Row 2: Doctor info */}
        <div className="mt-3 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-slate-900 leading-tight">Dr. {appt.doctorName}</p>
            {appt.doctorSpecialty && (
              <p className="text-sm text-teal-700 font-medium mt-0.5">{appt.doctorSpecialty}</p>
            )}
          </div>
          {appt.consultationFee > 0 && (
            <div className="flex-shrink-0 text-right">
              <p className="text-sm font-bold text-slate-800">{formatCurrency(appt.consultationFee)}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wide mt-0.5">Fee</p>
            </div>
          )}
        </div>

        {/* Row 3: meta chips */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium',
            appt.consultationType === 'video' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
          )}>
            {appt.consultationType === 'video'
              ? <><Video className="h-3 w-3" /> Video Consultation</>
              : <><MapPin className="h-3 w-3" /> In-Person Visit</>
            }
          </span>
          <span className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium',
            appt.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-orange-50 text-orange-700'
          )}>
            <CreditCard className="h-3 w-3" />
            {appt.paymentStatus === 'paid' ? 'Paid' : 'Payment Pending'}
          </span>
          {appt.durationMinutes > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-500">
              <Clock className="h-3 w-3" />
              {appt.durationMinutes} min
            </span>
          )}
        </div>

        {/* Row 4: reason if any */}
        {appt.reason && (
          <p className="mt-3 line-clamp-2 rounded-xl bg-slate-50 px-3 py-2 text-xs leading-5 text-slate-500 italic">
            &ldquo;{appt.reason}&rdquo;
          </p>
        )}

        {/* Row 5: doctor notes for past */}
        {appt.doctorNotes && (
          <p className="mt-2 line-clamp-2 rounded-xl bg-blue-50 px-3 py-2 text-xs leading-5 text-blue-700">
            <span className="font-semibold">Doctor&rsquo;s note:</span> {appt.doctorNotes}
          </p>
        )}

        {/* Row 6: Actions */}
        {(canJoin(appt) || canCancel(appt)) && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
            {canJoin(appt) && (
              <button
                onClick={() => router.push(`/patient/video-session?appointmentId=${appt._id}`)}
                className="inline-flex items-center gap-2 rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
              >
                <Video className="h-4 w-4" />
                Join Video Call
              </button>
            )}
            {canCancel(appt) && (
              <Button
                size="sm"
                variant="danger"
                isLoading={cancelling}
                onClick={handleCancel}
              >
                <X className="h-3.5 w-3.5" />
                Cancel Appointment
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Date group header ─────────────────────────────────────────
function DateGroupHeader({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</span>
      <div className="flex-1 border-t border-slate-100" />
    </div>
  );
}

// ── Grouped list rendering ────────────────────────────────────
function GroupedList({ appointments, onCancel }: { appointments: Appointment[]; onCancel: (id: string) => void }) {
  if (appointments.length === 0) {
    return <EmptyState message="No appointments in this category" cta />;
  }

  // Group by date label
  const groups: Record<string, Appointment[]> = {};
  for (const a of appointments) {
    const key = formatDate(a.slotDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  }

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([dateLabel, appts]) => (
        <div key={dateLabel} className="space-y-3">
          <DateGroupHeader label={dateLabel} />
          {appts.map(a => <ApptCard key={a._id} appt={a} onCancel={onCancel} />)}
        </div>
      ))}
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────
const TABS = [
  { label: 'Active',    value: 'active'    },
  { label: 'Today',     value: 'today'     },
  { label: 'History',   value: 'history'   },
  { label: 'Cancelled', value: 'cancelled' },
];

function TabBar({ active, onChange }: { active: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
      {TABS.map(t => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            'flex-1 rounded-xl px-3 py-2 text-sm font-semibold transition-all',
            active === t.value
              ? 'bg-white text-slate-900 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export function MyAppointmentsPage() {
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [history, setHistory]   = useState<Appointment[]>([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('active');

  useEffect(() => {
    Promise.all([appointmentApi.getMyUpcoming(), appointmentApi.getMyHistory()])
      .then(([u, h]) => {
        // Sort upcoming: soonest first
        const u_sorted = [...u.data.data].sort((a, b) => getSlotMs(a) - getSlotMs(b));
        // Sort history: most recent first
        const h_sorted = [...h.data.data].sort((a, b) => getSlotMs(b) - getSlotMs(a));
        setUpcoming(u_sorted);
        setHistory(h_sorted);
      })
      .catch(() => toast.error('Failed to load appointments'))
      .finally(() => setLoading(false));
  }, []);

  const handleCancel = (id: string) => {
    setUpcoming(prev => prev.filter(a => a._id !== id));
  };

  // ── Derived lists ─────────────────────────────────────────
  const todayList  = upcoming.filter(isToday);
  // Active = confirmed + pending, sorted soonest first (already ordered)
  const activeList = upcoming; // includes both statuses
  const pastList   = history.filter(a => a.status === 'completed' || a.status === 'no_show');
  const cancelledList = history.filter(a => a.status.startsWith('cancelled'));

  // ── Stats ──────────────────────────────────────────────────
  const confirmedCount = upcoming.filter(a => a.status === 'confirmed').length;
  const pendingCount   = upcoming.filter(a => a.status === 'pending').length;

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl space-y-6 py-2">
        <div className="flex h-64 items-center justify-center rounded-[28px] border border-white/70 bg-white/85 shadow-sm backdrop-blur">
          <Spinner />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 py-2">
      <PatientPageHeader
        eyebrow="My Appointments"
        title="Your health timeline"
        description="All your upcoming visits and consultation history, neatly organised by date."
        actions={
          <Link
            href="/patient/find-doctors"
            className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
          >
            Book new visit
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Confirmed', value: confirmedCount, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle2 className="h-5 w-5" /> },
          { label: 'Pending',   value: pendingCount,   color: 'text-amber-600',   bg: 'bg-amber-50',   icon: <Clock className="h-5 w-5" /> },
          { label: 'Completed', value: pastList.length,    color: 'text-slate-600', bg: 'bg-slate-100', icon: <CalendarClock className="h-5 w-5" /> },
          { label: 'Cancelled', value: cancelledList.length, color: 'text-rose-600', bg: 'bg-rose-50', icon: <XCircle className="h-5 w-5" /> },
        ].map(s => (
          <div key={s.label} className="flex items-center gap-3 rounded-2xl border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur">
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-xl', s.bg, s.color)}>
              {s.icon}
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{s.value}</p>
              <p className="text-xs text-slate-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Today banner – show only when there are appointments today */}
      {todayList.length > 0 && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            You have <span className="font-bold">{todayList.length}</span> appointment{todayList.length > 1 ? 's' : ''} today
          </div>
          <button
            onClick={() => setTab('today')}
            className="text-xs font-semibold text-emerald-700 hover:underline"
          >
            View →
          </button>
        </div>
      )}

      {/* Tabs + content */}
      <div className="rounded-[32px] border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur space-y-5">
        <TabBar active={tab} onChange={setTab} />

        <div>
          {tab === 'active'    && <GroupedList appointments={activeList}    onCancel={handleCancel} />}
          {tab === 'today'     && <GroupedList appointments={todayList}     onCancel={handleCancel} />}
          {tab === 'history'   && <GroupedList appointments={pastList}      onCancel={() => {}} />}
          {tab === 'cancelled' && <GroupedList appointments={cancelledList}  onCancel={() => {}} />}
        </div>
      </div>
    </div>
  );
}
