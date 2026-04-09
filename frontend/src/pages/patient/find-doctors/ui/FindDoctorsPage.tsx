'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Search, SlidersHorizontal, Sparkles, Stethoscope } from 'lucide-react';
import { doctorApi } from '@/src/entities/doctor/api';
import type { DoctorProfile } from '@/src/entities/doctor/model';
import { DoctorCard } from '@/src/entities/doctor/ui/DoctorCard';
import { Button } from '@/src/shared/ui/Button';
import { PatientPageHeader } from '@/src/widgets/patient-shell/ui/PatientPageHeader';

const SPECIALTIES = [
  '', 'Cardiology', 'Neurology', 'Dermatology', 'Pediatrics',
  'Orthopedics', 'Gynecology', 'Psychiatry', 'General Practice',
  'ENT', 'Ophthalmology', 'Oncology', 'Urology',
];

const PAGE_SIZE = 10;

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-full bg-gray-200 shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-40 bg-gray-200 rounded" />
          <div className="h-3 w-28 bg-gray-200 rounded" />
          <div className="h-3 w-20 bg-gray-200 rounded" />
        </div>
      </div>
      <div className="mt-4 flex justify-between">
        <div className="h-4 w-24 bg-gray-200 rounded" />
        <div className="h-8 w-16 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}

export function FindDoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors]     = useState<DoctorProfile[]>([]);
  const [total, setTotal]         = useState(0);
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(false);
  const [specialty, setSpecialty] = useState('');
  const [name, setName]           = useState('');
  const debounceRef               = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDoctors = useCallback(async (spec: string, nm: string, pg: number) => {
    setLoading(true);
    try {
      const res = await doctorApi.search({
        specialty: spec || undefined,
        name:      nm   || undefined,
        page:      pg,
        limit:     PAGE_SIZE,
      });
      setDoctors(res.data.data.doctors);
      setTotal(res.data.data.total);
    } catch {
      // silent – toast handled by interceptor
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounce name input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchDoctors(specialty, name, 1);
    }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [name, specialty, fetchDoctors]);

  // Re-fetch on page change
  useEffect(() => { fetchDoctors(specialty, name, page); }, [page]); // eslint-disable-line

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="mx-auto max-w-7xl space-y-8 py-2">
      <PatientPageHeader
        eyebrow="Discover care"
        title="Find the right doctor faster"
        description="Search by name or specialty, compare experience and fees, and move directly into booking when you find the right fit."
        actions={
          <div className="rounded-2xl border border-teal-100 bg-teal-50 px-4 py-3 text-sm font-medium text-teal-800">
            <span className="mr-2 inline-flex rounded-full bg-white px-2 py-0.5 text-xs font-semibold text-teal-700">{total}</span>
            doctors matched your search
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <div className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-sm backdrop-blur sm:p-6">
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <SlidersHorizontal className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Refine your search</h2>
                <p className="text-sm text-slate-500">Use filters to narrow down the best specialist for your needs.</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <div className="relative min-w-[240px] flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  placeholder="Search by doctor name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm text-slate-700 outline-none transition-colors focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
                />
              </div>
              <select
                value={specialty}
                onChange={(e) => { setSpecialty(e.target.value); setPage(1); }}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 outline-none transition-colors focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
              >
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>{s || 'All Specialties'}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 px-1">
            <p className="text-sm text-slate-500">{loading ? 'Searching for doctors…' : `${total} doctor${total !== 1 ? 's' : ''} available`}</p>
            {!loading && doctors.length > 0 && (
              <p className="text-sm font-medium text-slate-400">Page {page} of {Math.max(totalPages, 1)}</p>
            )}
          </div>

          {loading ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : doctors.length === 0 ? (
            <div className="mt-4 rounded-[28px] border border-dashed border-slate-300 bg-white/80 p-10 text-center shadow-sm">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Stethoscope className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">No doctors match your filters</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">Try another specialty or search with a broader name to discover more specialists.</p>
              <Button className="mt-5" variant="secondary" onClick={() => { setName(''); setSpecialty(''); setPage(1); fetchDoctors('', '', 1); }}>
                Reset filters
              </Button>
            </div>
          ) : (
            <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {doctors.map((doc) => (
                <DoctorCard
                  key={doc._id}
                  doctor={doc}
                  onBook={() => router.push(`/patient/book-appointment?doctorId=${doc._id}`)}
                />
              ))}
            </div>
          )}

          {!loading && totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                Previous
              </Button>
              <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm">Page {page} of {totalPages}</span>
              <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
                Next
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="rounded-[28px] bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl shadow-slate-950/10">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-teal-200">
              <Sparkles className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-xl font-semibold">Choose with confidence</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300">Compare specialties, ratings, languages, and consultation fees before you book.</p>
            <button
              onClick={() => router.push('/patient/book-appointment')}
              className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-teal-200 transition-colors hover:text-white"
            >
              Go to booking
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
            <h3 className="text-base font-semibold text-slate-900">What to check before booking</h3>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-500">
              <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-teal-500" />Confirm the specialty fits your symptoms.</li>
              <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-teal-500" />Review consultation fee and appointment type.</li>
              <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-teal-500" />Upload reports beforehand for a smoother consultation.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
