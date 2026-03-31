'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Video, CheckCircle, XCircle, UserX, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { appointmentApi } from '@/src/entities/appointment/api';
import { StatusBadge } from '@/src/entities/appointment/ui/StatusBadge';
import type { Appointment } from '@/src/entities/appointment/model';
import { IssuePrescriptionModal } from '@/src/features/issue-prescription/ui/IssuePrescriptionModal';
import { Tabs } from '@/src/shared/ui/Tabs';
import { Spinner } from '@/src/shared/ui/Spinner';
import { formatDate, formatTime } from '@/src/shared/lib/formatDate';
import { cn } from '@/src/shared/lib/cn';

const TABS = [
  { label: 'Pending',   value: 'pending'   },
  { label: 'Today',     value: 'today'     },
  { label: 'Upcoming',  value: 'upcoming'  },
  { label: 'Past',      value: 'past'      },
];

interface ModalState { open: boolean; appt: Appointment | null }

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
      className={cn('flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors', colors[variant])}
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
    <div className={cn('rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-opacity', busy && 'opacity-60')}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="font-semibold text-gray-900">{appt.patientName}</p>
          <p className="text-xs text-gray-500 mt-0.5">
            {formatDate(appt.slotDate)} at {formatTime(appt.slotTime)} · {appt.durationMinutes} min · {appt.consultationType.replace('_', '-')}
          </p>
          {appt.reason && (
            <p className="mt-1.5 text-xs text-gray-600 line-clamp-2 max-w-sm">
              {appt.reason}
            </p>
          )}
        </div>
        <StatusBadge status={appt.status} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
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
        setPast(h.data.data);
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

  const renderList = (list: Appointment[]) =>
    list.length === 0 ? (
      <p className="py-10 text-center text-sm text-gray-400">No appointments in this category.</p>
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Appointments</h1>
      <Tabs tabs={TABS}>
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
