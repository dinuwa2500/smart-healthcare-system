"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Search,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  X,
} from "lucide-react";
import { doctorApi } from "@/src/entities/doctor/api";
import type { DoctorProfile } from "@/src/entities/doctor/model";
import { DoctorCard } from "@/src/entities/doctor/ui/DoctorCard";
import { Button } from "@/src/shared/ui/Button";
import { PatientPageHeader } from "@/src/widgets/patient-shell/ui/PatientPageHeader";
import { cn } from "@/src/shared/lib/cn";

const SPECIALTIES = [
  "",
  "Cardiology",
  "Neurology",
  "Dermatology",
  "Pediatrics",
  "Orthopedics",
  "Gynecology",
  "Psychiatry",
  "General Practice",
  "ENT",
  "Ophthalmology",
  "Oncology",
  "Urology",
];

const PAGE_SIZE = 10;

// Improved: High-fidelity skeleton that matches the updated DoctorCard layout
function SkeletonCard() {
  return (
    <div className='flex flex-col h-full rounded-[24px] border border-slate-100 bg-white p-6 shadow-sm animate-pulse'>
      <div className='flex gap-4'>
        <div className='h-16 w-16 rounded-2xl bg-slate-100 shrink-0' />
        <div className='flex-1 pt-1 space-y-3'>
          <div className='flex justify-between items-start'>
            <div className='space-y-2 w-full'>
              <div className='h-5 w-3/4 bg-slate-100 rounded-md' />
              <div className='h-4 w-1/3 bg-slate-100 rounded-md' />
            </div>
            <div className='h-6 w-12 bg-slate-100 rounded-lg shrink-0' />
          </div>
          <div className='flex gap-4'>
            <div className='h-3 w-20 bg-slate-50 rounded' />
            <div className='h-3 w-20 bg-slate-50 rounded' />
          </div>
        </div>
      </div>
      <div className='mt-5 space-y-2'>
        <div className='h-3 w-full bg-slate-50 rounded' />
        <div className='h-3 w-4/5 bg-slate-50 rounded' />
      </div>
      <div className='mt-auto pt-6 flex items-end justify-between border-t border-slate-50'>
        <div className='space-y-2'>
          <div className='h-2 w-20 bg-slate-100 rounded' />
          <div className='h-6 w-24 bg-slate-100 rounded' />
        </div>
        <div className='h-10 w-28 bg-slate-100 rounded-xl' />
      </div>
    </div>
  );
}

export function FindDoctorsPage() {
  const router = useRouter();
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true); // Start loading true on initial mount
  const [specialty, setSpecialty] = useState("");
  const [name, setName] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchDoctors = useCallback(
    async (spec: string, nm: string, pg: number) => {
      setLoading(true);
      try {
        const res = await doctorApi.search({
          specialty: spec || undefined,
          name: nm || undefined,
          page: pg,
          limit: PAGE_SIZE,
        });
        setDoctors(res.data.data.doctors);
        setTotal(res.data.data.total);
      } catch {
        // silent – toast handled by interceptor
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Debounce name input
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      fetchDoctors(specialty, name, 1);
    }, 300);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [name, specialty, fetchDoctors]);

  // Re-fetch on page change
  useEffect(() => {
    fetchDoctors(specialty, name, page);
  }, [page]); // eslint-disable-line

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className='mx-auto max-w-7xl space-y-8 py-4 px-4 sm:px-6 lg:px-8'>
      <PatientPageHeader
        eyebrow='Discover care'
        title='Find the right doctor faster'
        description='Search by name or specialty, compare experience and fees, and move directly into booking when you find the right fit.'
        actions={
          <div className='rounded-2xl border border-teal-100 bg-teal-50/50 px-4 py-3 text-sm font-medium text-teal-800 shadow-sm transition-all hover:bg-teal-50'>
            <span className='mr-2 inline-flex items-center justify-center rounded-full bg-white px-2.5 py-0.5 text-xs font-bold text-teal-700 shadow-sm border border-teal-100'>
              {total}
            </span>
            doctors matched
          </div>
        }
      />

      {/* Improved: Changed xl grid to lg grid for better responsiveness on tablets/smaller laptops */}
      <div className='grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]'>
        {/* Main Content Area */}
        <div className='flex flex-col gap-6'>
          {/* Filter Container */}
          <div className='rounded-[28px] border border-slate-200 bg-white p-4 sm:p-6 shadow-sm'>
            <div className='mb-5 flex items-center gap-3'>
              <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 text-slate-700 border border-slate-100'>
                <SlidersHorizontal className='h-5 w-5 text-teal-600' />
              </div>
              <div>
                <h2 className='text-lg font-bold text-slate-900'>
                  Refine your search
                </h2>
                <p className='text-sm text-slate-500'>
                  Narrow down the best specialist for your needs.
                </p>
              </div>
            </div>

            <div className='flex flex-col sm:flex-row gap-4'>
              {/* Search Input with Clear Action */}
              <div className='relative flex-1 group'>
                <Search className='absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-teal-500' />
                <input
                  placeholder='Search by doctor name...'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className='w-full h-12 rounded-2xl border border-slate-200 bg-slate-50/50 py-3 pl-11 pr-10 text-sm font-medium text-slate-700 outline-none transition-all placeholder:text-slate-400 focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10'
                />
                {name && (
                  <button
                    onClick={() => setName("")}
                    className='absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-700 transition-colors'
                    aria-label='Clear search'
                  >
                    <X className='h-4 w-4' />
                  </button>
                )}
              </div>

              {/* Specialty Select */}
              <select
                value={specialty}
                onChange={(e) => {
                  setSpecialty(e.target.value);
                  setPage(1);
                }}
                className='h-12 w-full sm:w-64 rounded-2xl border border-slate-200 bg-slate-50/50 px-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-teal-400 focus:bg-white focus:ring-4 focus:ring-teal-500/10 cursor-pointer appearance-none'
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2364748b' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                  backgroundPosition: "right 0.5rem center",
                  backgroundRepeat: "no-repeat",
                  backgroundSize: "1.5em 1.5em",
                  paddingRight: "2.5rem",
                }}
              >
                {SPECIALTIES.map((s) => (
                  <option key={s} value={s}>
                    {s || "All Specialties"}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Summary */}
          <div className='flex items-center justify-between px-2'>
            <p className='text-sm font-medium text-slate-500'>
              {loading
                ? "Searching..."
                : `Showing ${doctors.length} of ${total} results`}
            </p>
            {!loading && doctors.length > 0 && (
              <p className='text-sm font-semibold text-slate-400'>
                Page {page} of {Math.max(totalPages, 1)}
              </p>
            )}
          </div>

          {/* Doctors Grid */}
          {loading ? (
            <div className='grid gap-5 sm:grid-cols-2 xl:grid-cols-2'>
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : doctors.length === 0 ? (
            <div className='flex flex-col items-center justify-center rounded-[32px] border border-dashed border-slate-200 bg-slate-50/50 py-16 px-6 text-center'>
              <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400'>
                <Search className='h-8 w-8' />
              </div>
              <h3 className='text-lg font-bold text-slate-900'>
                No doctors found
              </h3>
              <p className='mt-2 max-w-sm text-sm leading-relaxed text-slate-500'>
                We couldn't find any specialists matching your current filters.
                Try broadening your search.
              </p>
              <Button
                className='mt-6 bg-slate-900 text-white hover:bg-slate-800'
                onClick={() => {
                  setName("");
                  setSpecialty("");
                  setPage(1);
                  fetchDoctors("", "", 1);
                }}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className='grid gap-5 sm:grid-cols-2 xl:grid-cols-2'>
              {doctors.map((doc) => (
                <DoctorCard
                  key={doc._id}
                  doctor={doc}
                  onBook={() =>
                    router.push(`/patient/book-appointment?doctorId=${doc._id}`)
                  }
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && totalPages > 1 && (
            <div className='mt-4 flex items-center justify-center gap-3'>
              <Button
                variant='secondary'
                size='sm'
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className='disabled:opacity-50 disabled:cursor-not-allowed rounded-xl'
              >
                Previous
              </Button>
              <span className='flex h-9 min-w-9 items-center justify-center rounded-xl bg-teal-50 px-3 text-sm font-bold text-teal-700 border border-teal-100'>
                {page}
              </span>
              <Button
                variant='secondary'
                size='sm'
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className='disabled:opacity-50 disabled:cursor-not-allowed rounded-xl'
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {/* Informational Sidebar */}
        <div className='space-y-5'>
          <div className='group rounded-[28px] bg-slate-900 p-7 text-white shadow-xl shadow-slate-900/10 transition-transform hover:-translate-y-1'>
            <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/20 text-teal-300'>
              <Sparkles className='h-6 w-6' />
            </div>
            <h3 className='mt-6 text-xl font-bold'>Choose with confidence</h3>
            <p className='mt-3 text-sm leading-relaxed text-slate-300'>
              Compare specialties, real patient ratings, and consultation fees
              securely before you book.
            </p>
            <button
              onClick={() => router.push("/patient/book-appointment")}
              className='mt-8 inline-flex items-center gap-2 text-sm font-bold text-teal-300 transition-colors hover:text-white group-hover:gap-3'
            >
              Learn about our vetting process
              <ArrowRight className='h-4 w-4' />
            </button>
          </div>

          <div className='rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm'>
            <h3 className='text-base font-bold text-slate-900 flex items-center gap-2'>
              <Stethoscope className='h-4 w-4 text-slate-400' />
              Booking Checklist
            </h3>
            <ul className='mt-5 space-y-4 text-sm font-medium text-slate-500'>
              <li className='flex gap-3 items-start'>
                <span className='mt-1.5 h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0' />
                <span>
                  Confirm the specialty aligns with your primary symptoms.
                </span>
              </li>
              <li className='flex gap-3 items-start'>
                <span className='mt-1.5 h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0' />
                <span>Have your previous medical reports ready to upload.</span>
              </li>
              <li className='flex gap-3 items-start'>
                <span className='mt-1.5 h-1.5 w-1.5 rounded-full bg-teal-500 shrink-0' />
                <span>Check the doctor's spoken languages.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
