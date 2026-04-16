'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight, CalendarClock, CalendarX2, CheckCircle2, Clock,
  CreditCard, FileText, MapPin, Stethoscope, UserRound, Video,
  XCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { appointmentApi } from '@/src/entities/appointment/api';
import type { Appointment } from '@/src/entities/appointment/model';
import { IssuePrescriptionModal } from '@/src/features/issue-prescription/ui/IssuePrescriptionModal';
import { Spinner } from '@/src/shared/ui/Spinner';
import { formatDate, formatTime } from '@/src/shared/lib/formatDate';
import { formatCurrency } from '@/src/shared/lib/formatCurrency';
import { cn } from '@/src/shared/lib/cn';

// ── Status config ─────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  pending:           { label: 'Awaiting Acceptance', color: 'text-amber-700',   bg: 'bg-amber-50',   dot: 'bg-amber-400' },
  confirmed:         { label: 'Confirmed',            color: 'text-emerald-700', bg: 'bg-emerald-50', dot: 'bg-emerald-500' },
  completed:         { label: 'Completed',            color: 'text-slate-600',   bg: 'bg-slate-100',  dot: 'bg-slate-400' },
  cancelled_patient: { label: 'Cancelled by Patient', color: 'text-rose-700',   bg: 'bg-rose-50',    dot: 'bg-rose-400' },
  cancelled_doctor:  { label: 'Cancelled',            color: 'text-rose-700',   bg: 'bg-rose-50',    dot: 'bg-rose-400' },
  no_show:           { label: 'No Show',              color: 'text-slate-500',   bg: 'bg-slate-100',  dot: 'bg-slate-300' },
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

// ── Status Pill ───────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { label: status, color: 'text-slate-600', bg: 'bg-slate-100', dot: 'bg-slate-400' };
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', cfg.bg, cfg.color)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', cfg.dot)} />
      {cfg.label}
    </span>
  );
}

// ── Empty state ───────────────────────────────────────────────
function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-[24px] border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
      <CalendarX2 className="mx-auto h-10 w-10 text-slate-300" />
      <p className="mt-3 text-sm text-slate-500">{message}</p>
    </div>
  );
}

// ── Appointment Card ──────────────────────────────────────────
interface ApptCardProps {
  appt: Appointment;
  onStatusChange: (id: string, status: string) => void;
  onPrescribe: (appt: Appointment) => void;
}

function ApptCard({ appt, onStatusChange, onPrescribe }: ApptCardProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const today = isToday(appt);
  const cfg = STATUS_CFG[appt.status] ?? STATUS_CFG.pending;

  const patch = async (status: string) => {
    setBusy(true);
    onStatusChange(appt._id, status); // optimistic
    try {
      await appointmentApi.updateStatus(appt._id, status);
      toast.success(status === 'confirmed' ? 'Appointment accepted' : 'Action applied');
    } catch {
      onStatusChange(appt._id, appt.status); // revert
      toast.error('Action failed – reverted');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn(
      'relative overflow-hidden rounded-[20px] border bg-white shadow-sm transition-all duration-200 hover:shadow-md',
      today && appt.status !== 'completed' ? 'border-emerald-100 ring-1 ring-emerald-100' : 'border-slate-100',
      busy && 'opacity-60 pointer-events-none',
    )}>
      {/* Left accent */}
      <div className={cn('absolute inset-y-0 left-0 w-1 rounded-l-[20px]', cfg.dot)} />

      <div className="pl-5 pr-4 py-4">
        {/* Row 1: date + status */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            {today && appt.status !== 'completed' && (
              <span className="inline-flex items-center rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                Today
              </span>
            )}
            <span className="text-xs font-semibold text-slate-500">
              {formatDate(appt.slotDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-xs font-bold text-slate-700">{formatTime(appt.slotTime)}</span>
            {appt.durationMinutes > 0 && (
              <span className="text-xs text-slate-400">{appt.durationMinutes} min</span>
            )}
          </div>
          <StatusPill status={appt.status} />
        </div>

        {/* Row 2: Patient info */}
        <div className="mt-3 flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
            <UserRound className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-slate-900">{appt.patientName}</p>
            {appt.reason && (
              <p className="mt-0.5 text-xs text-slate-500 line-clamp-1 italic">&ldquo;{appt.reason}&rdquo;</p>
            )}
          </div>
          {appt.consultationFee > 0 && (
            <div className="text-right shrink-0">
              <p className="text-sm font-bold text-slate-800">{formatCurrency(appt.consultationFee)}</p>
              <p className={cn(
                'mt-0.5 text-[10px] font-semibold uppercase tracking-wide',
                appt.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-orange-500'
              )}>
                {appt.paymentStatus === 'paid' ? '✓ Paid' : 'Unpaid'}
              </p>
            </div>
          )}
        </div>

        {/* Row 3: type chip */}
        <div className="mt-3 flex flex-wrap gap-2">
          <span className={cn(
            'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold',
            appt.consultationType === 'video' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
          )}>
            {appt.consultationType === 'video'
              ? <><Video className="h-3 w-3" /> Video</>
              : <><MapPin className="h-3 w-3" /> In-Person</>
            }
          </span>
        </div>

        {/* Doctor notes if any */}
        {appt.doctorNotes && (
          <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <span className="font-semibold">Note:</span> {appt.doctorNotes}
          </p>
        )}

        {/* ── Action buttons ─── */}
        <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
          {/* Pending: accept / decline */}
          {appt.status === 'pending' && (
            <>
              <button
                onClick={() => patch('confirmed')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Accept
              </button>
              <button
                onClick={() => patch('cancelled_doctor')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-rose-50 px-3.5 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" />
                Decline
              </button>
            </>
          )}

          {/* Confirmed: start video / prescribe / no-show */}
          {appt.status === 'confirmed' && (
            <>
              {appt.consultationType === 'video' && (
                <button
                  onClick={() => router.push(`/doctor/video-session?appointmentId=${appt._id}`)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 transition-colors"
                >
                  <Video className="h-3.5 w-3.5" />
                  Start Consultation
                </button>
              )}
              <button
                onClick={() => onPrescribe(appt)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-teal-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-700 transition-colors"
              >
                <FileText className="h-3.5 w-3.5" />
                Complete + Prescribe
              </button>
              <button
                onClick={() => patch('no_show')}
                className="inline-flex items-center gap-1.5 rounded-xl bg-slate-100 px-3.5 py-2 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <CalendarX2 className="h-3.5 w-3.5" />
                No Show
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Date section header ───────────────────────────────────────
function SectionHeader({ date, count }: { date: string; count: number }) {
  return (
    <div className="sticky top-0 z-10 flex items-center gap-3 bg-slate-50/90 py-2 backdrop-blur-sm">
      <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{date}</span>
      <div className="flex-1 border-t border-slate-200" />
      <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-500">{count}</span>
    </div>
  );
}

// ── Grouped list ──────────────────────────────────────────────
function GroupedList({ appointments, onStatusChange, onPrescribe }: {
  appointments: Appointment[];
  onStatusChange: (id: string, status: string) => void;
  onPrescribe: (appt: Appointment) => void;
}) {
  if (appointments.length === 0) return <EmptyState message="No appointments here" />;

  const groups: Record<string, Appointment[]> = {};
  for (const a of appointments) {
    const key = formatDate(a.slotDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    if (!groups[key]) groups[key] = [];
    groups[key].push(a);
  }

  return (
    <div className="space-y-6">
      {Object.entries(groups).map(([dateLabel, appts]) => (
        <div key={dateLabel}>
          <SectionHeader date={dateLabel} count={appts.length} />
          <div className="mt-2 space-y-3">
            {appts.map(a => (
              <ApptCard key={a._id} appt={a} onStatusChange={onStatusChange} onPrescribe={onPrescribe} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tab bar ───────────────────────────────────────────────────
const TABS = [
  { value: 'pending',   label: 'New Requests', icon: <Clock className="h-3.5 w-3.5" /> },
  { value: 'confirmed', label: 'Confirmed',    icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  { value: 'today',     label: 'Today',        icon: <CalendarClock className="h-3.5 w-3.5" /> },
  { value: 'history',   label: 'History',      icon: <Stethoscope className="h-3.5 w-3.5" /> },
];

function TabBar({
  active, onChange, counts,
}: {
  active: string;
  onChange: (v: string) => void;
  counts: Record<string, number>;
}) {
  return (
    <div className="flex gap-1.5 flex-wrap">
      {TABS.map(t => (
        <button
          key={t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition-all',
            active === t.value
              ? 'bg-slate-900 text-white shadow'
              : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700'
          )}
        >
          {t.icon}
          {t.label}
          {counts[t.value] > 0 && (
            <span className={cn(
              'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
              active === t.value ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
            )}>
              {counts[t.value]}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────
export function AppointmentsPage() {
  const [all, setAll]       = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('pending');
  const [modal, setModal]     = useState<{ open: boolean; appt: Appointment | null }>({ open: false, appt: null });

  useEffect(() => {
    appointmentApi.getDoctorAll()
      .then(r => {
        const sorted = [...r.data.data].sort((a, b) => getSlotMs(a) - getSlotMs(b));
        setAll(sorted);
      })
      .catch(() => toast.error('Failed to load appointments'))
      .finally(() => setLoading(false));
  }, []);

  // Optimistic update
  const handleStatusChange = (id: string, status: string) => {
    setAll(prev => prev.map(a => a._id === id ? { ...a, status: status as Appointment['status'] } : a));
  };

  const handlePrescribeSuccess = () => {
    if (modal.appt) handleStatusChange(modal.appt._id, 'completed');
    setModal({ open: false, appt: null });
  };

  // ── Derived lists ─────────────────────────────────────────
  const pending   = all.filter(a => a.status === 'pending');
  const confirmed = all.filter(a => a.status === 'confirmed');
  const todayAll  = all.filter(a => isToday(a) && a.status !== 'completed' && !a.status.startsWith('cancelled'));
  const history   = all
    .filter(a => ['completed', 'no_show', 'cancelled_patient', 'cancelled_doctor'].includes(a.status))
    .sort((a, b) => getSlotMs(b) - getSlotMs(a));

  const counts = {
    pending:   pending.length,
    confirmed: confirmed.length,
    today:     todayAll.length,
    history:   history.length,
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur">
        <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Appointment Management</p>
        <h1 className="mt-2 text-2xl font-bold text-slate-900">Your patient schedule</h1>
        <p className="mt-1 text-sm text-slate-500">
          Review pending requests, manage confirmed visits, and keep your daily schedule clear.
        </p>
      </div>

      {/* Overview stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'New Requests', value: pending.length,   color: 'text-amber-600',   bg: 'bg-amber-50',   icon: <Clock className="h-5 w-5" /> },
          { label: 'Confirmed',    value: confirmed.length, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: <CheckCircle2 className="h-5 w-5" /> },
          { label: 'Today',        value: todayAll.length,  color: 'text-blue-600',    bg: 'bg-blue-50',    icon: <CalendarClock className="h-5 w-5" /> },
          { label: 'Completed',    value: all.filter(a => a.status === 'completed').length, color: 'text-slate-600', bg: 'bg-slate-100', icon: <Stethoscope className="h-5 w-5" /> },
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

      {/* Urgent banner: new requests */}
      {pending.length > 0 && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3.5">
          <p className="text-sm font-semibold text-amber-800">
            <span className="mr-1.5 inline-flex h-2 w-2 animate-pulse rounded-full bg-amber-500" />
            {pending.length} patient request{pending.length > 1 ? 's are' : ' is'} waiting for your acceptance
          </p>
          <button
            onClick={() => setTab('pending')}
            className="text-xs font-bold text-amber-700 hover:underline"
          >
            Review →
          </button>
        </div>
      )}

      {/* Main content */}
      <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur space-y-5">
        <TabBar active={tab} onChange={setTab} counts={counts} />

        <div>
          {tab === 'pending'   && <GroupedList appointments={pending}   onStatusChange={handleStatusChange} onPrescribe={a => setModal({ open: true, appt: a })} />}
          {tab === 'confirmed' && <GroupedList appointments={confirmed} onStatusChange={handleStatusChange} onPrescribe={a => setModal({ open: true, appt: a })} />}
          {tab === 'today'     && <GroupedList appointments={todayAll}  onStatusChange={handleStatusChange} onPrescribe={a => setModal({ open: true, appt: a })} />}
          {tab === 'history'   && <GroupedList appointments={history}   onStatusChange={handleStatusChange} onPrescribe={() => {}} />}
        </div>
      </div>

      {/* Prescription modal */}
      {modal.appt && (
        <IssuePrescriptionModal
          isOpen={modal.open}
          onClose={() => setModal({ open: false, appt: null })}
          appointmentId={modal.appt._id}
          patientId={modal.appt.patientId}
          patientName={modal.appt.patientName}
          onCompleted={handlePrescribeSuccess}
        />
      )}
    </div>
  );
}
