'use client';
import { useEffect, useState, useCallback } from 'react';
import { ChevronUp, ChevronDown, Search, UserCheck, ShieldAlert, Users, ArrowUpDown, CheckCircle2, XCircle, MoreVertical, Mail, Calendar, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';
import { userApi } from '@/src/entities/user/api';
import type { User } from '@/src/entities/user/model';
import { Badge } from '@/src/shared/ui/Badge';
import { Button } from '@/src/shared/ui/Button';
import { Spinner } from '@/src/shared/ui/Spinner';
import { Tabs } from '@/src/shared/ui/Tabs';
import { formatDate } from '@/src/shared/lib/formatDate';
import { cn } from '@/src/shared/lib/cn';

const PAGE_SIZE = 10;
type SortKey = 'email' | 'createdAt';
type SortDir = 'asc' | 'desc';

const TABS = [
  { label: 'Patients', value: 'patient' },
  { label: 'Doctors',  value: 'doctor'  },
];

function SortHeader({ label, sortKey, current, dir, onSort }: {
  label: string; sortKey: SortKey; current: SortKey; dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = current === sortKey;
  return (
    <th
      className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400 cursor-pointer select-none hover:text-teal-600 transition-colors"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        {label}
        <ArrowUpDown className={cn('h-3 w-3 transition-colors', active ? 'text-teal-600' : 'text-gray-300')} />
      </div>
    </th>
  );
}

function UserTable({ role }: { role: 'patient' | 'doctor' }) {
  const [users,   setUsers]   = useState<User[]>([]);
  const [total,   setTotal]   = useState(0);
  const [page,    setPage]    = useState(1);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [search,  setSearch]  = useState('');
  const [busyId,  setBusyId]  = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await userApi.getAll({ page: 1, limit: 1000 });
      const data = res.data.data as unknown as { users: User[]; total: number };
      const all = data.users.filter((u) => u.role === role);
      setTotal(all.length);
      setUsers(all);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, [role]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleToggle = async (user: User) => {
    setBusyId(user.id);
    const next = !user.isActive;
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: next } : u));
    try {
      await userApi.updateStatus(user.id, next);
      toast.success(`Account ${next ? 'activated' : 'deactivated'} successfully`);
    } catch {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: !next } : u));
      toast.error('Status update failed');
    } finally {
      setBusyId('');
    }
  };

  const filtered = users
    .filter((u) => !search || u.email.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      const va = a[sortKey] ?? '';
      const vb = b[sortKey] ?? '';
      if (sortKey === 'createdAt') {
        const da = new Date(va).getTime();
        const db = new Date(vb).getTime();
        return sortDir === 'asc' ? da - db : db - da;
      }
      const cmp = String(va).localeCompare(String(vb));
      return sortDir === 'asc' ? cmp : -cmp;
    });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6">
      {/* Search & Statistics Footer (Condensed) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            placeholder={`Search ${role}s by email...`}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-2xl border-none bg-white py-3.5 pl-11 pr-4 text-sm font-medium shadow-sm ring-1 ring-gray-100 placeholder:text-gray-400 focus:ring-2 focus:ring-teal-500/10 transition-all"
          />
        </div>
        <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-widest text-gray-400">
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {users.filter(u => u.isActive).length} Active
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            {users.filter(u => !u.isActive).length} Inactive
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Spinner className="h-10 w-10 text-teal-600" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Scanning Platform...</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm ring-1 ring-black/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <SortHeader label="Account Details" sortKey="email" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <SortHeader label="Joined Date" sortKey="createdAt" current={sortKey} dir={sortDir} onSort={handleSort} />
                  <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-300">
                          <Users className="h-6 w-6" />
                        </div>
                        <p className="text-lg font-bold text-gray-400">No {role}s found</p>
                        <p className="text-xs text-gray-400">Refine your search or filters to see more results</p>
                      </div>
                    </td>
                  </tr>
                ) : paginated.map((u) => (
                  <tr key={u.id} className="group hover:bg-teal-50/20 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-50 to-emerald-50 font-black text-teal-700">
                          {u.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">{u.email}</p>
                          <p className="text-[10px] font-medium text-gray-400 uppercase tracking-tighter">System ID: {u.id.slice(-8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-gray-600 font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5 text-gray-400" />
                        {formatDate(u.createdAt)}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset',
                        u.isActive 
                          ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' 
                          : 'bg-rose-50 text-rose-700 ring-rose-600/20'
                      )}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', u.isActive ? 'bg-emerald-500' : 'bg-rose-500')} />
                        {u.isActive ? 'Active' : 'Banned'}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleToggle(u)}
                          disabled={busyId === u.id}
                          className={cn(
                            'flex h-9 items-center gap-2 rounded-xl px-4 text-xs font-bold uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50',
                            u.isActive 
                              ? 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white' 
                              : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'
                          )}
                        >
                          {busyId === u.id ? (
                            <Spinner className="h-3.5 w-3.5" />
                          ) : u.isActive ? (
                            <ShieldAlert className="h-3.5 w-3.5" />
                          ) : (
                            <ShieldCheck className="h-3.5 w-3.5" />
                          )}
                          {u.isActive ? 'Suspend' : 'Unsuspend'}
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

      {/* Pagination Container */}
      {!loading && totalPages > 1 && (
        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-gray-100 pt-6 sm:flex-row">
          <p className="text-xs font-black uppercase tracking-widest text-gray-400">
            Scanning {role} <span className="text-teal-600">{(page - 1) * PAGE_SIZE + 1} - {Math.min(page * PAGE_SIZE, filtered.length)}</span> of {filtered.length}
          </p>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex h-9 items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 text-xs font-bold uppercase text-gray-500 transition-all hover:bg-gray-50 disabled:opacity-30"
            >
              Back
            </button>
            <div className="flex gap-1.5">
              {[...Array(totalPages)].map((_, i) => (
                <button
                  key={i}
                  onClick={() => setPage(i + 1)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold transition-all',
                    page === i + 1 
                      ? 'bg-teal-600 text-white shadow-lg shadow-teal-100' 
                      : 'hover:bg-gray-100 text-gray-400'
                  )}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex h-9 items-center gap-2 rounded-xl border border-gray-100 bg-white px-4 text-xs font-bold uppercase text-gray-500 transition-all hover:bg-gray-50 disabled:opacity-30"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ManageUsersPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Top Header */}
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="mb-1 inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-teal-600 ring-1 ring-inset ring-teal-600/20">
            <ShieldCheck className="h-3 w-3" /> Administrative Panel
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900">User Management</h1>
          <p className="mt-2 max-w-md text-sm text-gray-500">Monitor platform activity, manage user access, and enforce safety protocols across the system.</p>
        </div>
        <div className="flex items-center gap-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-black/[0.02]">
          <div className="text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Status Node</p>
            <p className="text-xl font-black text-gray-900">Operational</p>
          </div>
          <div className="h-10 w-[1px] bg-gray-100" />
          <div className="text-center text-teal-600">
            <UserCheck className="h-6 w-6" />
          </div>
        </div>
      </div>

      <Tabs tabs={TABS}>
        {(tab) => <UserTable key={tab} role={tab as 'patient' | 'doctor'} />}
      </Tabs>
    </div>
  );
}
