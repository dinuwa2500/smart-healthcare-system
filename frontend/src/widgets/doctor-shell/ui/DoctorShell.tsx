'use client';
import { useState, type ElementType, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { CalendarDays, Clock, FileText, LayoutDashboard, LogOut, Menu, Stethoscope, Video, X } from 'lucide-react';
import { useAuthStore } from '@/src/shared/store/authStore';
import { cn } from '@/src/shared/lib/cn';

const NAV_ITEMS = [
  { href: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/doctor/appointments', label: 'Appointments', icon: CalendarDays },
  { href: '/doctor/patient-records', label: 'Patient Records', icon: FileText },
  { href: '/doctor/schedule', label: 'Schedule', icon: Clock },
];

function NavLink({ href, label, icon: Icon, onClick }: { href: string; label: string; icon: ElementType; onClick?: () => void }) {
  const pathname = usePathname();
  const active = pathname === href || (href !== '/doctor/dashboard' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all',
        active
          ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
          : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span>{label}</span>
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const { logout, user } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  return (
    <div className="flex h-full flex-col bg-slate-950 text-white">
      <div className="border-b border-white/10 px-5 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500 shadow-lg shadow-cyan-500/20">
            <Stethoscope className="h-6 w-6 text-slate-950" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">MediConnect</p>
            <p className="text-xs text-slate-400">Doctor Workspace</p>
          </div>
        </div>
      </div>

      <div className="px-4 py-5">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Signed in as</p>
          <p className="mt-2 truncate text-sm font-semibold text-white">{user?.name || user?.email || 'Doctor'}</p>
          <p className="mt-1 text-xs text-slate-400">Review appointments, manage follow-ups, and keep your day on track.</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3">
        {NAV_ITEMS.map((item) => (
          <NavLink key={item.href} {...item} onClick={onNavigate} />
        ))}
      </nav>

      <div className="px-4 pb-4">
        <div className="mb-4 rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-cyan-500/20 to-sky-500/10 p-4">
          <p className="text-sm font-semibold text-white">Today’s focus</p>
          <p className="mt-1 text-xs leading-5 text-slate-300">Keep video consultations, pending reviews, and prescriptions in a single workflow.</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export function DoctorShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (pathname.startsWith('/doctor/video-session')) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 overflow-y-auto lg:block">
        <SidebarContent />
      </aside>

      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-lg lg:hidden"
        aria-label="Open doctor navigation"
      >
        <Menu className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-slate-950/55" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 overflow-y-auto shadow-2xl">
            <SidebarContent onNavigate={() => setOpen(false)} />
            <button
              onClick={() => setOpen(false)}
              className="absolute right-4 top-4 rounded-xl bg-white/10 p-2 text-white"
              aria-label="Close doctor navigation"
            >
              <X className="h-4 w-4" />
            </button>
          </aside>
        </div>
      )}

      <main className="min-h-screen lg:pl-72">
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_32%),linear-gradient(to_bottom,_#f8fafc,_#eef2ff_45%,_#f8fafc)] px-4 pb-10 pt-20 sm:px-6 lg:px-8 lg:pt-8">
          {children}
        </div>
      </main>
    </div>
  );
}
