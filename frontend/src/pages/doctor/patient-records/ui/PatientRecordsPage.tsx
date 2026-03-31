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
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 font-semibold text-gray-800 flex items-center gap-2">
          <User className="h-4 w-4 text-teal-600" /> Demographics
        </h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
          {[
            ['Full Name', `${patient.firstName} ${patient.lastName}`],
            ['Date of Birth', patient.dateOfBirth ? formatDate(patient.dateOfBirth) : '—'],
            ['Gender', patient.gender ?? '—'],
            ['Blood Type', patient.bloodType ?? '—'],
            ['Allergies', patient.allergies?.join(', ') || 'None reported'],
          ].map(([label, value]) => (
            <div key={label}>
              <dt className="text-gray-400">{label}</dt>
              <dd className="font-medium text-gray-800">{value}</dd>
            </div>
          ))}
        </dl>
        {patient.emergencyContact && (
          <div className="mt-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm">
            <p className="font-medium text-red-700">Emergency Contact</p>
            <p className="text-red-600">
              {patient.emergencyContact.name} ({patient.emergencyContact.relationship}) — {patient.emergencyContact.phone}
            </p>
          </div>
        )}
      </div>

      {/* Medical Reports */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="h-4 w-4 text-teal-600" /> Medical Reports
        </h3>
        {reports.length === 0 ? (
          <p className="text-sm text-gray-400">No reports uploaded.</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {reports.map((r) => (
              <div key={r._id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{r.originalName}</p>
                  <p className="text-xs text-gray-400">{r.description} · {formatDate(r.createdAt)}</p>
                </div>
                <button
                  onClick={() => handleDownload(patient._id, r)}
                  className="rounded-lg p-2 hover:bg-teal-50 transition-colors"
                >
                  <Download className="h-4 w-4 text-teal-600" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past Appointments */}
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <h3 className="mb-4 font-semibold text-gray-800">Past Appointments</h3>
        {pastAppts.length === 0 ? (
          <p className="text-sm text-gray-400">No past appointments with this patient.</p>
        ) : (
          <div className="space-y-3">
            {pastAppts.map((a) => (
              <div key={a._id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">{formatDate(a.slotDate)}</p>
                  <p className="text-xs text-gray-500">{a.reason}</p>
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
      setPatients(res.data.data.patients as PatientProfile[]);
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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Patient Records</h1>

      <div className="flex gap-6">
        {/* Sidebar: patient list */}
        <aside className="w-64 shrink-0">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Search patients…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            {loading ? (
              <div className="flex justify-center py-8"><Spinner size="sm" /></div>
            ) : patients.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-gray-400">No patients found</p>
            ) : (
              <ul className="divide-y divide-gray-100 max-h-[600px] overflow-y-auto">
                {patients.map((p) => (
                  <li key={p._id}>
                    <button
                      onClick={() => setSelected(p)}
                      className={`w-full px-4 py-3 text-left text-sm hover:bg-teal-50 transition-colors
                        ${selected?._id === p._id ? 'bg-teal-50 font-semibold text-teal-700' : 'text-gray-700'}`}
                    >
                      {p.firstName} {p.lastName}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Main panel */}
        <div className="flex-1 min-w-0">
          {selected ? (
            <PatientPanel key={selected._id} patient={selected} />
          ) : (
            <div className="flex h-80 flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 text-gray-400">
              <User className="h-10 w-10 mb-2 opacity-30" />
              <p className="text-sm">Select a patient to view records</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
