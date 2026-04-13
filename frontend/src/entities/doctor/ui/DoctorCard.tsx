import { Star, CheckCircle2, Clock, Globe, ChevronRight } from "lucide-react";
import { cn } from "../../../shared/lib/cn";
import { formatCurrency } from "../../../shared/lib/formatCurrency";
import type { DoctorProfile } from "../model";

interface DoctorCardProps {
  doctor: DoctorProfile;
  onBook?: () => void;
  className?: string;
}

export function DoctorCard({ doctor, onBook, className }: DoctorCardProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col h-full rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-teal-500/10 hover:border-teal-100",
        className,
      )}
    >
      <div className='flex gap-4'>
        {/* Avatar Design */}
        <div className='relative shrink-0'>
          <div className='flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-50 text-xl font-bold text-teal-600 transition-transform duration-300 group-hover:scale-105'>
            {doctor.firstName[0]}
            {doctor.lastName[0]}
          </div>
          {doctor.isVerified && (
            <div className='absolute -right-1.5 -top-1.5 rounded-full bg-white p-0.5 shadow-sm'>
              <CheckCircle2 className='h-5 w-5 fill-emerald-500 text-white' />
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className='flex-1 min-w-0 pt-0.5'>
          <div className='flex items-start justify-between gap-2'>
            <div className='min-w-0'>
              <h3 className='truncate text-lg font-bold text-slate-900 group-hover:text-teal-700 transition-colors'>
                Dr. {doctor.firstName} {doctor.lastName}
              </h3>
              <span className='inline-block mt-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600 uppercase tracking-wider'>
                {doctor.specialization}
              </span>
            </div>

            <div className='flex items-center gap-1 shrink-0 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/60'>
              <Star className='h-3.5 w-3.5 fill-amber-400 text-amber-500' />
              <span className='text-xs font-bold text-amber-700'>
                {doctor.rating.average.toFixed(1)}
              </span>
            </div>
          </div>

          {/* Stats Row */}
          <div className='mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-500'>
            <span className='flex items-center gap-1.5 whitespace-nowrap'>
              <Clock className='h-3.5 w-3.5 text-teal-500 shrink-0' />
              {doctor.experienceYears} Years Exp.
            </span>
            <span className='flex items-center gap-1.5 whitespace-nowrap'>
              <Globe className='h-3.5 w-3.5 text-slate-400 shrink-0' />
              {doctor.languages?.[0] || "English"}
            </span>
          </div>
        </div>
      </div>

      {/* Bio / Description */}
      <p className='mt-5 line-clamp-2 text-sm leading-relaxed text-slate-600'>
        {doctor.bio ||
          "Providing compassionate care and specialized treatment for all patients."}
      </p>

      {/* Footer / Actions */}
      <div className='mt-auto pt-6 flex items-center justify-between gap-3 border-t border-slate-100'>
        <div className='shrink-0'>
          <p className='text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1'>
            Consultation Fee
          </p>
          <p className='text-lg font-black text-slate-900 leading-none truncate'>
            {formatCurrency(doctor.consultationFee)}
          </p>
        </div>

        {onBook && (
          <button
            onClick={onBook}
            className='flex shrink-0 items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:bg-teal-700 hover:shadow-lg hover:shadow-teal-600/20 active:scale-95 whitespace-nowrap'
          >
            <span>Book Now</span>
            <ChevronRight className='h-4 w-4 shrink-0' />
          </button>
        )}
      </div>
    </div>
  );
}
