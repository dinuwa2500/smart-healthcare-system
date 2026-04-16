'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, Download, FileText, User } from 'lucide-react';
import toast from 'react-hot-toast';
import { doctorApi } from '@/src/entities/doctor/api';
import { appointmentApi } from '@/src/entities/appointment/api';
import { StatusBadge } from '@/src/entities/appointment/ui/StatusBadge';
import type { Appointment } from '@/src/entities/appointment/model';
import api from '@/src/shared/api';
import { Spinner } from '@/src/shared/ui/Spinner';
import { formatDate } from '@/src/shared/lib/formatDate';

interface PatientProfile {
  _id: string;
  authUserId: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  allergies?: string[];
  emergencyContact?: { name: string; phone: string; relationship: string };
}

interface Report {
  _id: string;
  description: string;
  originalName: string;
  storedName: string;
  createdAt: string;
}

function PatientPanel({ patient }: { patient: PatientProfile }) {
  const [reports,    setReports]    = useState<Report[]>([]);
  const [pastAppts,  setPastAppts]  = useState<Appointment[]>([]);
  const [loading,    setLoading]    = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<{ success: boolean; data: Report[] }>(`/patients/${patient._id}/reports`),
      appointmentApi.getDoctorHistory(),
    ])
      .then(([r, a]) => {
        setReports(r.data.data);
        // Filter history to only this patient
        setPastAppts(a.data.data.filter((x) => x.patientId === patient._id || x.patientId === patient.authUserId));
      })
      .catch(() => toast.error('Failed to load patient records'))
      .finally(() => setLoading(false));
  }, [patient._id, patient.authUserId]);

  const handleDownload = async (patientId: string, report: Report) => {
    try {
      const res = await api.get(`/files/${patientId}/${report.storedName}`, { responseType: 'blob' });
      const url = URL.createObjectURL(res.data as Blob);
      const a   = document.createElement('a');
      a.href = url; a.download = report.originalName; a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Download failed');
    }
  };

  if (loading) return <div className="flex justify-center py-10"><Spinner /></div>;

  return (
    <div className="space-y-6">
      {/* Demographics */}
      <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <User className="h-4 w-4 text-teal-600" /> Demographics
        </h3>
        <dl className="grid gap-x-6 gap-y-4 text-sm sm:grid-cols-2">
          {[
            ['Full Name', `${patient.firstName} ${patient.lastName}`],
            ['Date of Birth', patient.dateOfBirth ? formatDate(patient.dateOfBirth) : '—'],
            ['Gender', patient.gender ?? '—'],
            ['Blood Type', patient.bloodType ?? '—'],
            ['Allergies', patient.allergies?.join(', ') || 'None reported'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-slate-400">{label}</dt>
              <dd className="font-medium text-slate-800">{value}</dd>
            </div>
          ))}
        </dl>
        {patient.emergencyContact && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm">
            <p className="font-medium text-red-700">Emergency Contact</p>
            <p className="text-red-600">
              {patient.emergencyContact.name} ({patient.emergencyContact.relationship}) — {patient.emergencyContact.phone}
            </p>
          </div>
        )}
      </div>

      {/* Medical Reports */}
      <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-slate-900">
          <FileText className="h-4 w-4 text-teal-600" /> Medical Reports
        </h3>
        {reports.length === 0 ? (
          <p className="text-sm text-slate-400">No reports uploaded.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {reports.map((r) => (
              <div key={r._id} className="flex items-center justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{r.originalName}</p>
                  <p className="text-xs text-slate-400">{r.description} · {formatDate(r.createdAt)}</p>
                </div>
                <button
                  onClick={() => handleDownload(patient.authUserId, r)}
                  className="rounded-2xl p-2.5 transition-colors hover:bg-teal-50"
                >
                  <Download className="h-4 w-4 text-teal-600" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Appointments */}
      <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
        <h3 className="mb-4 text-lg font-semibold text-slate-900">Past Appointments</h3>
        {pastAppts.length === 0 ? (
          <p className="text-sm text-slate-400">No past appointments with this patient.</p>
        ) : (
          <div className="space-y-3">
            {pastAppts.map((a) => (
              <div key={a._id} className="flex items-center justify-between gap-4 rounded-2xl bg-slate-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-slate-800">{formatDate(a.slotDate)}</p>
                  <p className="text-xs text-slate-500">{a.reason}</p>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function PatientRecordsPage() {
  const [patients,  setPatients]  = useState<PatientProfile[]>([]);
  const [selected,  setSelected]  = useState<PatientProfile | null>(null);
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchPatients = useCallback(async (name: string) => {
    setLoading(true);
    try {
      const res = await doctorApi.getMyPatients(name || undefined);
      const nextPatients = res.data.data.patients as PatientProfile[];
      setPatients(nextPatients);
      setSelected((current) => {
        if (current) {
          return nextPatients.find((patient) => patient._id === current._id) ?? nextPatients[0] ?? null;
        }
        return nextPatients[0] ?? null;
      });
    } catch {
      toast.error('Failed to load patients');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPatients(''); }, [fetchPatients]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPatients(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, fetchPatients]);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div className="rounded-[32px] border border-white/70 bg-white/85 p-6 shadow-sm backdrop-blur">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <span className="inline-flex rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700">
              Patient records
            </span>
            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Review patient history, reports, and previous consultations from one workspace.</h1>
            <p className="mt-3 text-sm leading-6 text-slate-500 sm:text-base">Search quickly, select a patient, and keep demographic details, uploaded files, and appointment history side by side.</p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            {patients.length} patient{patients.length === 1 ? '' : 's'} in your care list
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Sidebar: patient list */}
        <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-[28px] border border-white/70 bg-white/90 p-4 shadow-sm backdrop-blur">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search patients…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-teal-300 focus:bg-white focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <div className="rounded-[24px] border border-slate-100 bg-slate-50/70 overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-8"><Spinner size="sm" /></div>
              ) : patients.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-slate-400">No patients found</p>
              ) : (
                <ul className="max-h-[600px] divide-y divide-slate-100 overflow-y-auto">
                  {patients.map((p) => (
                    <li key={p._id}>
                      <button
                        onClick={() => setSelected(p)}
                        className={`w-full px-4 py-3 text-left text-sm transition-colors
                        ${selected?._id === p._id ? 'bg-cyan-50 font-semibold text-cyan-700' : 'text-slate-700 hover:bg-white'}`}
                      >
                        <p>{p.firstName} {p.lastName}</p>
                        <p className="mt-1 text-xs text-slate-400">{p.bloodType ?? 'Profile available'}</p>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-cyan-100 bg-cyan-50/80 p-4 text-sm text-cyan-900 shadow-sm">
            Keep recent reports and prior consultation notes in view before beginning a video consultation.
          </div>
        </aside>

        {/* Main panel */}
        <div className="flex-1 min-w-0">
          {selected ? (
            <PatientPanel key={selected._id} patient={selected} />
          ) : (
            <div className="flex h-80 flex-col items-center justify-center rounded-[28px] border border-dashed border-slate-300 bg-white/70 text-slate-400">
              <User className="mb-2 h-10 w-10 opacity-30" />
              <p className="text-sm">Select a patient to view records</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
