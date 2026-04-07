import { Star } from 'lucide-react';
import { cn } from '../../../shared/lib/cn';
import { formatCurrency } from '../../../shared/lib/formatCurrency';
import type { DoctorProfile } from '../model';

interface DoctorCardProps {
  doctor: DoctorProfile;
  onBook?: () => void;
  className?: string;
}

export function DoctorCard({ doctor, onBook, className }: DoctorCardProps) {
  return (
    <div className={cn('rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60', className)}>
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 text-lg font-bold text-white shadow-lg shadow-teal-500/20">
          {doctor.firstName[0]}{doctor.lastName[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {doctor.isVerified && (
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                Verified
              </span>
            )}
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              {doctor.languages?.slice(0, 2).join(' • ') || 'Specialist'}
            </span>
          </div>
          <h3 className="mt-3 truncate text-lg font-semibold text-slate-900">
            Dr. {doctor.firstName} {doctor.lastName}
          </h3>
          <p className="text-sm font-medium text-teal-700">{doctor.specialization}</p>
          <p className="mt-1 text-sm text-slate-500">{doctor.experienceYears} years experience</p>
          <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-500">{doctor.bio || 'Experienced specialist available for in-person and virtual consultations.'}</p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1.5 text-amber-600">
          <Star className="h-4 w-4 fill-current" />
          <span className="text-sm font-semibold text-amber-700">{doctor.rating.average.toFixed(1)}</span>
        </div>
      </div>
      <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Consultation fee</p>
          <span className="mt-1 block text-base font-semibold text-slate-900">{formatCurrency(doctor.consultationFee)}</span>
        </div>
        {onBook && (
          <button
            onClick={onBook}
            className="rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-800"
          >
            Book now
          </button>
        )}
      </div>
    </div>
  );
}
