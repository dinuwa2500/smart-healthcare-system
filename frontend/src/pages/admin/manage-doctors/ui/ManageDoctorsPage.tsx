'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Search, ChevronRight, X, Filter, MoreHorizontal, CheckCircle, AlertTriangle, UserPlus, GraduationCap, Briefcase, Globe, Star, Mail, Phone, Calendar, BadgeCheck, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { doctorApi } from '@/src/entities/doctor/api';
import { userApi } from '@/src/entities/user/api';
import type { DoctorProfile } from '@/src/entities/doctor/model';
import { Badge } from '@/src/shared/ui/Badge';
import { Button } from '@/src/shared/ui/Button';
import { Spinner } from '@/src/shared/ui/Spinner';
import { formatDate } from '@/src/shared/lib/formatDate';
import { formatTime } from '@/src/shared/lib/formatDate';
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
  if (!doctor.isVerified && doctor.isActive !== false) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 ring-1 ring-inset ring-amber-600/20">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
        Pending
      </div>
    );
  }
  if (doctor.isVerified && doctor.isActive !== false) {
    return (
      <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        Verified
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-2.5 py-0.5 text-xs font-semibold text-rose-700 ring-1 ring-inset ring-rose-600/20">
      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
      Deactivated
    </div>
  );
}

function SlideOver({ doctor, onClose, onVerify, onDeactivate, isBusy }: {
  doctor: DoctorProfile & { isActive?: boolean; email?: string; phone?: string };
  onClose: () => void;
  onVerify: (id: string) => void;
  onDeactivate: (id: string) => void;
  isBusy: boolean;
}) {
  const initials = `${doctor.firstName?.[0] || ''}${doctor.lastName?.[0] || ''}`;

  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <aside className="relative z-10 flex h-full w-full max-w-lg translate-x-0 flex-col bg-white shadow-2xl transition-transform duration-300 ease-in-out sm:max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 bg-white p-6">
          <h2 className="text-xl font-bold tracking-tight text-gray-900">Doctor Details</h2>
          <button onClick={onClose} className="rounded-xl p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-all">
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar">
          <div className="flex flex-col items-center text-center">
            <div className="relative group">
              <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-600 text-3xl font-black text-white shadow-lg shadow-teal-100">
                {initials}
              </div>
              <div className="absolute -bottom-1 -right-1 h-8 w-8 rounded-2xl border-4 border-white bg-white p-1">
                {doctor.isVerified ? <CheckCircle className="h-full w-full text-emerald-500" /> : <AlertTriangle className="h-full w-full text-amber-500" />}
              </div>
            </div>
            <h3 className="mt-4 text-2xl font-extrabold text-gray-900">Dr. {doctor.firstName} {doctor.lastName}</h3>
            <p className="font-semibold text-teal-600">{doctor.specialization}</p>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3">
            {[
              { label: 'Experience', value: `${doctor.experienceYears} Years`, icon: <Briefcase className="h-4 w-4" /> },
              { label: 'Rating', value: `${doctor.rating.average.toFixed(1)} / 5.0`, icon: <Star className="h-4 w-4" /> },
              { label: 'Consult Fee', value: formatCurrency(doctor.consultationFee), icon: <BadgeCheck className="h-4 w-4" /> },
              { label: 'Languages', value: doctor.languages[0] || 'English', icon: <Globe className="h-4 w-4" /> },
            ].map((item) => (
              <div key={item.label} className="rounded-2xl border border-gray-50 bg-gray-50/50 p-4 transition-colors hover:bg-gray-50">
                <div className="mb-2 flex items-center justify-center gap-2 text-gray-400">
                  {item.icon}
                  <span className="text-[10px] font-bold uppercase tracking-widest">{item.label}</span>
                </div>
                <p className="text-center text-sm font-bold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Contact Details */}
          <div className="mt-8">
            <h4 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
              <Mail className="h-3 w-3" /> Contact Information
            </h4>
            <div className="space-y-4 rounded-2xl border border-gray-100 p-5">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-400">Email Address</p>
                  <p className="text-sm font-semibold text-gray-900">{doctor.email || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Qualifications */}
          {doctor.qualifications?.length > 0 && (
            <div className="mt-8">
              <h4 className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400">
                <GraduationCap className="h-4 w-4" /> Academic Background
              </h4>
              <div className="space-y-3">
                {doctor.qualifications.map((q, i) => (
                  <div key={i} className="relative pl-6 before:absolute before:left-2 before:top-2 before:h-full before:w-[2px] before:bg-gray-100 last:before:hidden">
                    <div className="absolute left-0 top-1 h-4 w-4 rounded-full border-4 border-white bg-teal-500 shadow-sm" />
                    <p className="text-sm font-bold text-gray-900">{q.degree}</p>
                    <p className="text-xs font-medium text-gray-500">{q.institution} ({q.year})</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bio section */}
          {doctor.bio && (
            <div className="mt-8">
              <h4 className="mb-3 text-xs font-black uppercase tracking-widest text-gray-400">About Doctor</h4>
              <div className="rounded-2xl border border-gray-100 bg-teal-50/20 p-5">
                <p className="text-sm leading-relaxed text-gray-700 italic">\"{doctor.bio}\"</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 bg-gray-50/50 p-6">
          <div className="flex gap-3">
            {!doctor.isVerified && doctor.isActive !== false && (
              <button 
                onClick={() => onVerify(doctor._id)}
                disabled={isBusy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-lg shadow-emerald-200 transition-all active:scale-95 disabled:opacity-50"
              >
                {isBusy ? <Spinner className="h-4 w-4 text-white" /> : <CheckCircle className="h-4 w-4" />}
                Verify Doctor
              </button>
            )}
            {doctor.isActive !== false && (
              <button 
                onClick={() => onDeactivate(doctor._id)}
                disabled={isBusy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-white border border-rose-100 py-3 text-sm font-bold text-rose-600 shadow-sm transition-all hover:bg-rose-50 active:scale-95 disabled:opacity-50"
              >
                <AlertTriangle className="h-4 w-4" />
                Deactivate
              </button>
            )}
          </div>
          <p className="mt-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">Added on {formatDate(new Date().toISOString())}</p>
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
      {/* Page Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Doctor Management</h1>
          <p className="mt-1 text-gray-500">Review, verify, and manage healthcare providers on your platform.</p>
        </div>
        <div className="flex h-12 items-center gap-3 rounded-2xl bg-teal-50 px-5 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-teal-600 text-white shadow-sm shadow-teal-100">
            <UserPlus className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-teal-600/60">Registered Providers</p>
            <p className="text-sm font-black text-teal-900">{doctors.length} Doctors</p>
          </div>
        </div>
      </div>

      {/* Control Bar (Search & Filter) */}
      <div className="mb-6 flex flex-col gap-4 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm xl:flex-row xl:items-center">
        {/* Tabs */}
        <div className="flex flex-1 gap-1 overflow-x-auto rounded-2xl bg-gray-50/80 p-1.5 custom-scrollbar">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={cn(
                'whitespace-nowrap rounded-xl px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200',
                tab === t.value 
                  ? 'bg-white text-teal-700 shadow-md ring-1 ring-black/[0.05]' 
                  : 'text-gray-400 hover:bg-white/50 hover:text-gray-600'
              )}
            >
              {t.label}
              <span className={cn(
                'ml-2 rounded-lg px-2 py-0.5 text-[10px]',
                tab === t.value ? 'bg-teal-50 text-teal-600' : 'bg-gray-100 text-gray-400'
              )}>
                {t.value === 'all' ? doctors.length : doctors.filter(d => {
                  if (t.value === 'pending') return !d.isVerified && d.isActive !== false;
                  if (t.value === 'verified') return d.isVerified && d.isActive !== false;
                  return d.isActive === false;
                }).length}
              </span>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full xl:max-w-xs">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            placeholder="Quick search by name or specialty..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border-none bg-gray-50/80 py-3.5 pl-11 pr-4 text-sm font-medium placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/10 transition-all"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Spinner className="h-10 w-10 text-teal-600" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Syncing Database...</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm ring-1 ring-black/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <tr>
                  <th className="px-6 py-5 text-left">Professional Information</th>
                  <th className="px-6 py-5 text-left">Field & Experience</th>
                  <th className="px-6 py-5 text-left">Consultation</th>
                  <th className="px-6 py-5 text-center">Status</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-300">
                          <Filter className="h-6 w-6" />
                        </div>
                        <p className="text-lg font-bold text-gray-400">No providers found</p>
                        <p className="text-xs text-gray-400">Try adjusting your filters or search terms</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((d) => (
                  <tr
                    key={d._id}
                    className="group hover:bg-teal-50/30 transition-colors cursor-pointer"
                    onClick={() => setSelected(d)}
                  >
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-50 to-emerald-50 font-black text-teal-700 shadow-sm transition-transform group-hover:scale-105">
                          {d.firstName?.[0] || ''}{d.lastName?.[0] || ''}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">Dr. {d.firstName} {d.lastName}</p>
                          <p className="text-xs font-semibold text-gray-400">{d.email || 'No email provided'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-bold text-gray-900">{d.specialization}</p>
                        <p className="text-xs font-semibold text-teal-600">{d.experienceYears} Years Experience</p>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div>
                        <p className="font-bold text-gray-900">{formatCurrency(d.consultationFee)}</p>
                        <div className="flex items-center gap-1 text-[10px] font-black text-amber-500 uppercase">
                          <Star className="h-3 w-3" /> {d.rating.average.toFixed(1)} Rating
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <StatusBadge doctor={d} />
                    </td>
                    <td className="px-6 py-5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                        {!d.isVerified && d.isActive !== false && (
                          <button
                            onClick={() => handleVerify(d._id)}
                            disabled={busyId === d._id}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 transition-all hover:bg-emerald-600 hover:text-white"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                        )}
                        {d.isActive !== false && (
                          <button
                            onClick={() => handleDeactivate(d._id)}
                            disabled={busyId === d._id}
                            className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 transition-all hover:bg-rose-600 hover:text-white"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                        <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-all hover:bg-gray-100">
                          <MoreHorizontal className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Slide-over */}
      {selected && (
        <SlideOver
          doctor={selected}
          onClose={() => setSelected(null)}
          onVerify={handleVerify}
          onDeactivate={handleDeactivate}
          isBusy={busyId === selected._id}
        />
      )}
    </div>
  );
}
