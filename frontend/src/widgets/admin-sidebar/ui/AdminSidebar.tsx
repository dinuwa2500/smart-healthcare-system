'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LayoutDashboard, UserCheck, Users, CreditCard, Heart, Menu, X, LogOut } from 'lucide-react';
import { useAuthStore } from '@/src/shared/store/authStore';
import { cn } from '@/src/shared/lib/cn';

const NAV = [
  { href: '/admin/dashboard',      label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/admin/manage-doctors', label: 'Doctors',      icon: UserCheck       },
  { href: '/admin/manage-users',   label: 'Users',        icon: Users           },
  { href: '/admin/transactions',   label: 'Transactions', icon: CreditCard      },
];

function NavLink({ href, label, icon: Icon, onClick }: {
  href: string; label: string; icon: React.ElementType; onClick?: () => void;
}) {
  const pathname = usePathname();
  const active   = pathname.startsWith(href);
  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-teal-600 text-white'
          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {label}
    </Link>
  );
}

function SidebarContent({ onLinkClick }: { onLinkClick?: () => void }) {
  const router  = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/admin/login');
  };

  return (
    <div className="flex h-full flex-col bg-slate-900">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-6 border-b border-slate-800">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600">
          <Heart className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold text-white">MediConnect</p>
          <p className="text-xs text-slate-400">Admin Console</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {NAV.map((item) => (
          <NavLink key={item.href} {...item} onClick={onLinkClick} />
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-slate-800 p-3">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:w-60 md:flex-shrink-0 md:flex-col h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-40 md:hidden flex h-10 w-10 items-center justify-center rounded-lg bg-slate-900 text-white shadow-lg"
        aria-label="Open menu"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Mobile drawer overlay */}
      {open && (
        <div
          className="fixed inset-0 z-50 md:hidden"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60" />
          <aside
            className="absolute left-0 top-0 h-full w-64"
            onClick={(e) => e.stopPropagation()}
          >
            <SidebarContent onLinkClick={() => setOpen(false)} />
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-3 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </aside>
        </div>
      )}
    </>
  );
}
