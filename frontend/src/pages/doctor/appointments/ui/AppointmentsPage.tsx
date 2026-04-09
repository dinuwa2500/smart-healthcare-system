'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, CheckCircle, Clock3, FileText, UserX, Video, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { appointmentApi } from '@/src/entities/appointment/api';
import { StatusBadge } from '@/src/entities/appointment/ui/StatusBadge';
import type { Appointment } from '@/src/entities/appointment/model';
import { IssuePrescriptionModal } from '@/src/features/issue-prescription/ui/IssuePrescriptionModal';
import { Tabs } from '@/src/shared/ui/Tabs';
import { Spinner } from '@/src/shared/ui/Spinner';
import { formatDate, formatTime } from '@/src/shared/lib/formatDate';
import { cn } from '@/src/shared/lib/cn';

interface ModalState { open: boolean; appt: Appointment | null }

function OverviewCard({ label, value, helper, icon }: { label: string; value: number; helper: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-[26px] border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
          <p className="mt-2 text-sm text-slate-500">{helper}</p>
        </div>
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">{icon}</div>
      </div>
    </div>
  );
}

function ActionBtn({ onClick, icon, label, variant = 'default' }: {
  onClick: () => void; icon: React.ReactNode; label: string;
  variant?: 'default' | 'success' | 'danger' | 'teal';
}) {
  const colors: Record<string, string> = {
    default: 'bg-gray-100 text-gray-700 hover:bg-gray-200',
    success: 'bg-green-100 text-green-700 hover:bg-green-200',
    danger:  'bg-red-100 text-red-600 hover:bg-red-200',
    teal:    'bg-teal-100 text-teal-700 hover:bg-teal-200',
  };
  return (
    <button
      onClick={onClick}
      className={cn('inline-flex items-center gap-1.5 rounded-2xl px-3.5 py-2 text-xs font-semibold transition-colors', colors[variant])}
    >
      {icon}
      {label}
    </button>
  );
}

function ApptCard({ appt, onUpdate, onPrescribe }: {
  appt: Appointment;
  onUpdate: (id: string, status: string) => void;
  onPrescribe: (appt: Appointment) => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const patch = async (status: string) => {
    setBusy(true);
    // Optimistic update
    onUpdate(appt._id, status);
    try {
      await appointmentApi.updateStatus(appt._id, status);
    } catch {
      // Revert
      onUpdate(appt._id, appt.status);
      toast.error('Action failed – reverted');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn('rounded-[28px] border border-white/70 bg-white/95 p-5 shadow-sm backdrop-blur transition-all', busy && 'opacity-60')}>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {appt.consultationType.replace('_', '-')}
            </span>
            <span className="inline-flex rounded-full bg-cyan-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-cyan-700">
              {appt.durationMinutes} min
            </span>
          </div>
          <p className="mt-3 text-lg font-semibold text-slate-900">{appt.patientName}</p>
          <p className="mt-1 text-sm text-slate-500">
            {formatDate(appt.slotDate)} at {formatTime(appt.slotTime)} · {appt.durationMinutes} min · {appt.consultationType.replace('_', '-')}
          </p>
          {appt.reason && (
            <p className="mt-3 line-clamp-2 max-w-2xl text-sm leading-6 text-slate-500">
              {appt.reason}
            </p>
          )}
        </div>
        <StatusBadge status={appt.status} />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {/* Pending actions */}
        {appt.status === 'pending' && (
          <>
            <ActionBtn
              variant="success"
              icon={<CheckCircle className="h-3.5 w-3.5" />}
              label="Accept"
              onClick={() => patch('confirmed')}
            />
            <ActionBtn
              variant="danger"
              icon={<XCircle className="h-3.5 w-3.5" />}
              label="Decline"
              onClick={() => patch('cancelled_doctor')}
            />
          </>
        )}

        {/* Confirmed actions */}
        {appt.status === 'confirmed' && (
          <>
            {appt.consultationType === 'video' && (
              <ActionBtn
                variant="teal"
                icon={<Video className="h-3.5 w-3.5" />}
                label="Start Consultation"
                onClick={() => router.push(`/doctor/video-session?appointmentId=${appt._id}`)}
              />
            )}
            <ActionBtn
              variant="success"
              icon={<FileText className="h-3.5 w-3.5" />}
              label="Complete + Prescribe"
              onClick={() => onPrescribe(appt)}
            />
            <ActionBtn
              variant="danger"
              icon={<UserX className="h-3.5 w-3.5" />}
              label="No Show"
              onClick={() => patch('no_show')}
            />
          </>
        )}
      </div>
    </div>
  );
}

export function AppointmentsPage() {
  const [pending,  setPending]  = useState<Appointment[]>([]);
  const [today,    setToday]    = useState<Appointment[]>([]);
  const [upcoming, setUpcoming] = useState<Appointment[]>([]);
  const [past,     setPast]     = useState<Appointment[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState<ModalState>({ open: false, appt: null });

  useEffect(() => {
    Promise.all([
      appointmentApi.getDoctorPending(),
      appointmentApi.getDoctorToday(),
      appointmentApi.getDoctorUpcoming(),
      appointmentApi.getDoctorHistory(),
    ])
      .then(([p, t, u, h]) => {
        setPending(p.data.data);
        setToday(t.data.data);
        setUpcoming(u.data.data);
        setPast(h.data.data.filter((a: Appointment) => 
          ['completed', 'cancelled_patient', 'cancelled_doctor', 'no_show'].includes(a.status)
        ));
      })
      .catch(() => toast.error('Failed to load appointments'))
      .finally(() => setLoading(false));
  }, []);

  const optimisticUpdate = (id: string, status: string) => {
    const update = (list: Appointment[]) =>
      list.map((a) => a._id === id ? { ...a, status: status as Appointment['status'] } : a);
    setPending(update);
    setToday(update);
    setUpcoming(update);
  };

  const handlePrescribeSuccess = () => {
    // Move appointment to past after completing
    if (modal.appt) {
      optimisticUpdate(modal.appt._id, 'completed');
    }
  };

  if (loading) return <div className="flex h-64 items-center justify-center"><Spinner /></div>;

  const tabs = [
    { label: `Pending (${pending.length})`, value: 'pending' },
    { label: `Today (${today.length})`, value: 'today' },
    { label: `Upcoming (${upcoming.length})`, value: 'upcoming' },
    { label: `Past (${past.length})`, value: 'past' },
  ];

  const renderList = (list: Appointment[]) =>
    list.length === 0 ? (
      <div className="rounded-[28px] border border-dashed border-slate-300 bg-white/70 py-12 text-center text-sm text-slate-400">
        No appointments in this category.
      </div>
    ) : (
      <div className="space-y-4">
        {list.map((a) => (
          <ApptCard
            key={a._id}
            appt={a}
            onUpdate={optimisticUpdate}
            onPrescribe={(appt) => setModal({ open: true, appt })}
          />
        ))}
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
              Appointment workspace
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Review requests, manage daily visits, and complete follow-ups faster.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">Keep the day moving by separating approvals, active consultations, and completed care into clear workflows.</p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {pending.length > 0 ? `${pending.length} request${pending.length === 1 ? '' : 's'} need attention today.` : 'All appointment requests are up to date.'}
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <OverviewCard label="Pending" value={pending.length} helper="Awaiting doctor review" icon={<Clock3 className="h-5 w-5" />} />
        <OverviewCard label="Today" value={today.length} helper="Scheduled for today" icon={<CalendarDays className="h-5 w-5" />} />
        <OverviewCard label="Upcoming" value={upcoming.length} helper="Confirmed future visits" icon={<Video className="h-5 w-5" />} />
        <OverviewCard label="Completed" value={past.filter((appt) => appt.status === 'completed').length} helper="Past appointments closed out" icon={<FileText className="h-5 w-5" />} />
      </div>

      <Tabs tabs={tabs}>
        {(tab) => (
          <>
            {tab === 'pending'  && renderList(pending)}
            {tab === 'today'    && renderList(today)}
            {tab === 'upcoming' && renderList(upcoming)}
            {tab === 'past'     && renderList(past)}
          </>
        )}
      </Tabs>

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
