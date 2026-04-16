'use client';
import { useEffect, useState } from 'react';
import { ClipboardList, FileText, History, Info, Pill, Stethoscope, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { patientApi } from '@/src/entities/patient/api';
import type { Prescription, PrescriptionMedication } from '@/src/entities/patient/model';
import type { Appointment } from '@/src/entities/appointment/model';
import { StatusBadge } from '@/src/entities/appointment/ui/StatusBadge';
import { Tabs } from '@/src/shared/ui/Tabs';
import { Modal } from '@/src/shared/ui/Modal';
import { Button } from '@/src/shared/ui/Button';
import { Spinner } from '@/src/shared/ui/Spinner';
import { formatDate } from '@/src/shared/lib/formatDate';
import { cn } from '@/src/shared/lib/cn';
import { PatientPageHeader } from '@/src/widgets/patient-shell/ui/PatientPageHeader';

const TABS = [
  { label: 'Prescriptions', value: 'prescriptions' },
  { label: 'Consultation History', value: 'history' },
];

function PrescriptionDetailModal({
  isOpen,
  onClose,
  prescription,
}: {
  isOpen: boolean;
  onClose: () => void;
  prescription: Prescription | null;
}) {
  if (!prescription) return null;

  const docName = typeof prescription.doctorId === 'object'
    ? `Dr. ${prescription.doctorId.firstName} ${prescription.doctorId.lastName}`
    : 'Doctor';

  const specialty = typeof prescription.doctorId === 'object'
    ? prescription.doctorId.specialization
    : 'General Practitioner';

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <div className="-mx-6 -mt-4 mb-6 border-b border-slate-100 bg-teal-600 px-6 py-5 text-white rounded-t-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-md">
            <Pill className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Prescription Details</h2>
            <p className="text-xs font-medium text-teal-100/80">
              Issued on {formatDate(prescription.createdAt)} by {docName}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-400">Medications</h3>
          <div className="space-y-3">
            {prescription.medications.map((m, i) => (
              <div key={i} className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-slate-900">{m.name}</p>
                    <p className="text-sm text-slate-500">{m.dosage} — {m.frequency}</p>
                  </div>
                  <span className="rounded-lg bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-700">
                    {m.durationDays} days
                  </span>
                </div>
                {m.instructions && (
                  <p className="mt-2 text-xs text-slate-600 italic">
                    <span className="font-semibold non-italic">Note: </span>
                    {m.instructions}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {prescription.notes && (
          <div>
            <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Doctor's Notes</h3>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {prescription.notes}
            </div>
          </div>
        )}

        <div className="rounded-2xl border border-blue-50 bg-blue-50/50 p-4 flex items-start gap-3">
           <Info className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
           <p className="text-xs leading-5 text-blue-700">
             Show this digital prescription to your pharmacist. You can also download a PDF version from your consultation details if available.
           </p>
        </div>
      </div>

      <div className="mt-8 flex justify-end gap-3 border-t border-slate-100 pt-5">
        <Button variant="ghost" onClick={onClose} className="text-slate-500">Close</Button>
      </div>
    </Modal>
  );
}

function PrescriptionCard({ prescription, onView }: { prescription: Prescription; onView: (p: Prescription) => void }) {
  const docName = typeof prescription.doctorId === 'object'
    ? `${prescription.doctorId.firstName} ${prescription.doctorId.lastName}`
    : 'Unknown Doctor';

  return (
    <div className="flex items-center justify-between gap-4 rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur transition-all hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-50 text-teal-600">
          <Pill className="h-6 w-6" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-900">{prescription.medications.length} Medication{prescription.medications.length !== 1 && 's'}</p>
          <p className="text-xs text-slate-500">Prescribed by Dr. {docName} · {formatDate(prescription.createdAt)}</p>
        </div>
      </div>
      <Button size="sm" variant="ghost" className="text-teal-600 hover:bg-teal-50" onClick={() => onView(prescription)}>
        View details
      </Button>
    </div>
  );
}

function HistoryItem({ appt }: { appt: Appointment }) {
  return (
    <div className="rounded-[24px] border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div className="flex gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <Stethoscope className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold text-slate-900">Consultation with Dr. {appt.doctorName}</p>
              <StatusBadge status={appt.status} />
            </div>
            <p className="mt-1 text-xs text-slate-500">{appt.doctorSpecialty} · {formatDate(appt.slotDate)}</p>
            {appt.doctorNotes && (
              <div className="mt-3 rounded-xl bg-slate-50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Diagnosis/Notes</p>
                <p className="mt-1 text-xs text-slate-700 leading-relaxed line-clamp-2">{appt.doctorNotes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MedicalHistoryPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [history,       setHistory]       = useState<Appointment[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [selectedPres,  setSelectedPres]  = useState<Prescription | null>(null);

  useEffect(() => {
    Promise.all([patientApi.getPrescriptions(), patientApi.getHistory()])
      .then(([p, h]) => {
        setPrescriptions(p.data.data);
        setHistory(h.data.data.filter(a => a.status === 'completed' || a.status === 'no_show'));
      })
      .catch(() => toast.error('Failed to load medical records'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 py-2">
      <PatientPageHeader
        eyebrow="Medical History"
        title="Your clinical health journey"
        description="Access your digital prescriptions and consultation records in one secure place. Review doctor's notes and medication plans anytime."
        className="from-slate-900 to-slate-800 text-white"
        actions={
          <div className="rounded-2xl border border-slate-700 bg-slate-800/50 px-4 py-3 text-sm font-medium text-slate-300">
            {prescriptions.length} Prescription{prescriptions.length !== 1 && 's'} · {history.length} Visit{history.length !== 1 && 's'}
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="space-y-6">
          <Tabs tabs={TABS}>
            {(active) => (
              <div className="space-y-4">
                {active === 'prescriptions' && (
                  <>
                    {prescriptions.length === 0 ? (
                      <div className="py-12 text-center rounded-[28px] border-2 border-dashed border-slate-200 bg-white/50">
                        <Pill className="mx-auto h-12 w-12 text-slate-300" />
                        <p className="mt-4 text-sm font-medium text-slate-500">No prescriptions found</p>
                      </div>
                    ) : (
                      prescriptions.map((p) => (
                        <PrescriptionCard key={p._id} prescription={p} onView={setSelectedPres} />
                      ))
                    )}
                  </>
                )}

                {active === 'history' && (
                  <>
                    {history.length === 0 ? (
                      <div className="py-12 text-center rounded-[28px] border-2 border-dashed border-slate-200 bg-white/50">
                        <ClipboardList className="mx-auto h-12 w-12 text-slate-300" />
                        <p className="mt-4 text-sm font-medium text-slate-500">No past consultations recorded</p>
                      </div>
                    ) : (
                      history.map((a) => (
                        <HistoryItem key={a._id} appt={a} />
                      ))
                    )}
                  </>
                )}
              </div>
            )}
          </Tabs>
        </div>

        <aside className="space-y-6">
          <div className="rounded-[28px] bg-gradient-to-br from-teal-600 to-teal-800 p-6 text-white shadow-xl shadow-teal-900/10">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-teal-100">
               <History className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-lg font-semibold">Continuity of Care</h3>
            <p className="mt-2 text-sm leading-relaxed text-teal-50/80">
              Having your digital prescriptions and notes available helps future doctors provide better, more coordinated care.
            </p>
          </div>

          <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400">Health Tips</h3>
            <ul className="mt-4 space-y-4">
              <li className="flex gap-3 text-sm text-slate-600">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                Finish the full course of medicines as prescribed.
              </li>
              <li className="flex gap-3 text-sm text-slate-600">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-500" />
                Review your history before visiting a new specialist.
              </li>
            </ul>
          </div>
        </aside>
      </div>

      <PrescriptionDetailModal
        isOpen={!!selectedPres}
        onClose={() => setSelectedPres(null)}
        prescription={selectedPres}
      />
    </div>
  );
}
