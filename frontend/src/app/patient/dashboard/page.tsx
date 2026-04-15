'use client';
import Link from 'next/link';
import { ArrowRight, Calendar, ClipboardList, Search, ShieldCheck, Sparkles, Stethoscope, Upload, Video } from 'lucide-react';
import { useAuthStore } from '@/src/shared/store/authStore';
import { PatientPageHeader } from '@/src/widgets/patient-shell/ui/PatientPageHeader';

const QUICK_LINKS = [
  { href: '/patient/find-doctors', icon: Search, label: 'Find Doctors', description: 'Browse specialists and compare fees.', color: 'from-teal-500 to-cyan-500' },
  { href: '/patient/my-appointments', icon: Calendar, label: 'Appointments', description: 'Track upcoming, past, and cancelled visits.', color: 'from-blue-500 to-indigo-500' },
  { href: '/patient/symptom-check', icon: Stethoscope, label: 'Symptom Check', description: 'Get quick guidance before booking.', color: 'from-orange-500 to-amber-500' },
  { href: '/patient/upload-report', icon: Upload, label: 'Medical Reports', description: 'Keep your documents ready for every visit.', color: 'from-violet-500 to-fuchsia-500' },
  { href: '/patient/video-session', icon: Video, label: 'Video Session', description: 'Join consultations with one tap.', color: 'from-emerald-500 to-teal-500' },
];

const HIGHLIGHTS = [
  { icon: ClipboardList, title: 'Stay prepared', text: 'Upload reports and symptoms before each visit so doctors have full context.' },
  { icon: ShieldCheck, title: 'Private and secure', text: 'Your appointments, reports, and virtual sessions stay in one protected workspace.' },
  { icon: Sparkles, title: 'Care made simpler', text: 'Book faster, join video sessions on time, and keep track of your health journey.' },
];

export default function PatientDashboard() {
  const { user } = useAuthStore();
  const firstName = user?.name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'there';

  return (
    <div className="mx-auto max-w-7xl space-y-8 py-2">
      <PatientPageHeader
        eyebrow="Patient dashboard"
        title={`Welcome back, ${firstName}`}
        description="Manage appointments, reports, video consultations, and health insights from one calm, patient-friendly space."
        actions={
          <>
            <Link
              href="/patient/book-appointment"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-800"
            >
              Book appointment
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/patient/find-doctors"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Find a specialist
            </Link>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[28px] bg-gradient-to-br from-slate-950 to-slate-800 p-6 text-white shadow-xl shadow-slate-950/10 md:col-span-2">
          <p className="text-sm font-medium text-teal-200">Your next best action</p>
          <h2 className="mt-3 max-w-xl text-2xl font-semibold tracking-tight sm:text-3xl">
            Keep your care journey smooth with faster booking and better visit prep.
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300 sm:text-base">
            Search specialists, upload reports before consultations, and use the symptom checker when you want quick guidance before booking.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/patient/upload-report" className="rounded-2xl bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-white/15">
              Upload latest report
            </Link>
            <Link href="/patient/symptom-check" className="rounded-2xl border border-white/15 px-4 py-2.5 text-sm font-medium text-slate-200 transition-colors hover:bg-white/5">
              Run symptom check
            </Link>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-sm backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Today</p>
          <h3 className="mt-3 text-xl font-semibold text-slate-900">Your care hub is ready</h3>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Focus</p>
              <p className="mt-1 text-sm font-medium text-slate-700">Book your next consultation or review appointment history.</p>
            </div>
            <div className="rounded-2xl bg-teal-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-teal-600">Tip</p>
              <p className="mt-1 text-sm font-medium text-teal-900">Upload reports before your visit to save time during consultation.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {QUICK_LINKS.map(({ href, icon: Icon, label, description, color }) => (
          <Link
            key={href}
            href={href}
            className="group rounded-[28px] border border-white/70 bg-white/90 p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/60"
          >
            <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="mt-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">{label}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
              </div>
              <ArrowRight className="mt-1 h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-slate-500" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {HIGHLIGHTS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="rounded-[24px] border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-500">{text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
