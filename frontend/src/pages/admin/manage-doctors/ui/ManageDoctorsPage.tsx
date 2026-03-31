'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, ChevronRight, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { doctorApi } from '@/src/entities/doctor/api';
import { userApi } from '@/src/entities/user/api';
import type { DoctorProfile } from '@/src/entities/doctor/model';
import { Badge } from '@/src/shared/ui/Badge';
import { Button } from '@/src/shared/ui/Button';
import { Spinner } from '@/src/shared/ui/Spinner';
import { formatDate } from '@/src/shared/lib/formatDate';
import { formatCurrency } from '@/src/shared/lib/formatCurrency';
import { cn } from '@/src/shared/lib/cn';

type FilterTab = 'all' | 'pending' | 'verified' | 'deactivated';
const TABS: { label: string; value: FilterTab }[] = [
  { label: 'All',          value: 'all'         },
  { label: 'Pending',      value: 'pending'     },
  { label: 'Verified',     value: 'verified'    },
  { label: 'Deactivated',  value: 'deactivated' },
];

function StatusBadge({ doctor }: { doctor: DoctorProfile & { isActive?: boolean } }) {
  if (!doctor.isVerified && doctor.isActive !== false) return <Badge variant="warning">Pending</Badge>;
  if (doctor.isVerified && doctor.isActive !== false)  return <Badge variant="success">Verified</Badge>;
  return <Badge variant="danger">Deactivated</Badge>;
}

function SlideOver({ doctor, onClose, onVerify, onDeactivate }: {
  doctor: DoctorProfile & { isActive?: boolean; email?: string };
  onClose: () => void;
  onVerify: (id: string) => void;
  onDeactivate: (id: string) => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <aside className="relative z-10 h-full w-full max-w-md bg-white shadow-2xl overflow-y-auto">
        <div className="sticky top-0 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Doctor Profile</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Avatar + name */}
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-600 text-xl font-bold text-white">
              {doctor.firstName[0]}{doctor.lastName[0]}
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">Dr. {doctor.firstName} {doctor.lastName}</p>
              <p className="text-sm text-teal-600">{doctor.specialization}</p>
              {doctor.email && <p className="text-xs text-gray-400">{doctor.email}</p>}
            </div>
          </div>

          {/* Details */}
          <dl className="grid grid-cols-2 gap-4 text-sm">
            {[
              ['Experience',   `${doctor.experienceYears} years`],
              ['Fee',          formatCurrency(doctor.consultationFee)],
              ['Rating',       `${doctor.rating.average.toFixed(1)} (${doctor.rating.count} reviews)`],
              ['Languages',    doctor.languages.join(', ') || '—'],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-gray-50 p-3">
                <dt className="text-xs text-gray-400">{label}</dt>
                <dd className="mt-0.5 font-medium text-gray-800">{value}</dd>
              </div>
            ))}
          </dl>

          {/* Qualifications */}
          {doctor.qualifications?.length > 0 && (
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">Qualifications</p>
              <ul className="space-y-1">
                {doctor.qualifications.map((q, i) => (
                  <li key={i} className="text-sm text-gray-600">
                    {q.degree} – {q.institution} ({q.year})
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Bio */}
          {doctor.bio && (
            <div>
              <p className="mb-1 text-sm font-semibold text-gray-700">Bio</p>
              <p className="text-sm text-gray-600 leading-relaxed">{doctor.bio}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            {!doctor.isVerified && (
              <Button onClick={() => { onVerify(doctor._id); onClose(); }} size="sm">
                Verify Doctor
              </Button>
            )}
            {doctor.isActive !== false && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => { onDeactivate(doctor._id); onClose(); }}
              >
                Deactivate
              </Button>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

export function ManageDoctorsPage() {
  const [doctors,   setDoctors]   = useState<(DoctorProfile & { isActive?: boolean; email?: string })[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<FilterTab>('all');
  const [search,    setSearch]    = useState('');
  const [selected,  setSelected]  = useState<(DoctorProfile & { isActive?: boolean; email?: string }) | null>(null);
  const [busyId,    setBusyId]    = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await doctorApi.search({ limit: 200 });
      setDoctors(res.data.data.doctors as (DoctorProfile & { isActive?: boolean; email?: string })[]);
    } catch {
      toast.error('Failed to load doctors');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const filtered = doctors.filter((d) => {
    const matchesTab =
      tab === 'all'         ? true :
      tab === 'pending'     ? (!d.isVerified && d.isActive !== false) :
      tab === 'verified'    ? (d.isVerified && d.isActive !== false)  :
      /* deactivated */       d.isActive === false;

    const q = debouncedSearch.toLowerCase();
    const matchesSearch = !q ||
      `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
      d.specialization.toLowerCase().includes(q);

    return matchesTab && matchesSearch;
  });

  const handleVerify = async (id: string) => {
    setBusyId(id);
    // Optimistic
    setDoctors((prev) => prev.map((d) => d._id === id ? { ...d, isVerified: true } : d));
    try {
      await doctorApi.verify(id);
      toast.success('Doctor verified');
    } catch {
      setDoctors((prev) => prev.map((d) => d._id === id ? { ...d, isVerified: false } : d));
      toast.error('Verification failed');
    } finally {
      setBusyId('');
    }
  };

  const handleDeactivate = async (id: string) => {
    setBusyId(id);
    setDoctors((prev) => prev.map((d) => d._id === id ? { ...d, isActive: false } : d));
    try {
      await userApi.updateStatus(id, false);
      toast.success('Doctor deactivated');
    } catch {
      setDoctors((prev) => prev.map((d) => d._id === id ? { ...d, isActive: true } : d));
      toast.error('Deactivation failed');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Manage Doctors</h1>

      {/* Filter tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => setTab(t.value)}
            className={cn(
              'rounded-md px-4 py-1.5 text-sm font-medium transition-all',
              tab === t.value ? 'bg-white text-teal-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4 w-full max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <input
          placeholder="Search name or specialty…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-gray-300 py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Name', 'Specialty', 'Experience', 'Fee', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">No doctors found.</td></tr>
              ) : filtered.map((d) => (
                <tr
                  key={d._id}
                  className="hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => setSelected(d)}
                >
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <div className="flex items-center gap-2">
                      Dr. {d.firstName} {d.lastName}
                      <ChevronRight className="h-3.5 w-3.5 text-gray-400" />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.specialization}</td>
                  <td className="px-4 py-3 text-gray-600">{d.experienceYears} yrs</td>
                  <td className="px-4 py-3 text-gray-600">{formatCurrency(d.consultationFee)}</td>
                  <td className="px-4 py-3"><StatusBadge doctor={d} /></td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      {!d.isVerified && d.isActive !== false && (
                        <Button
                          size="sm"
                          isLoading={busyId === d._id}
                          onClick={() => handleVerify(d._id)}
                        >
                          Verify
                        </Button>
                      )}
                      {d.isActive !== false && (
                        <Button
                          size="sm"
                          variant="danger"
                          isLoading={busyId === d._id}
                          onClick={() => handleDeactivate(d._id)}
                        >
                          Deactivate
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-over */}
      {selected && (
        <SlideOver
          doctor={selected}
          onClose={() => setSelected(null)}
          onVerify={handleVerify}
          onDeactivate={handleDeactivate}
        />
      )}
    </div>
  );
}
