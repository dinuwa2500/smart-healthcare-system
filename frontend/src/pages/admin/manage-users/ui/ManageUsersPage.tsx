'use client';
import { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import toast from 'react-hot-toast';
import { userApi } from '@/src/entities/user/api';
import type { User } from '@/src/entities/user/model';
import { Badge } from '@/src/shared/ui/Badge';
import { Button } from '@/src/shared/ui/Button';
import { Spinner } from '@/src/shared/ui/Spinner';
import { Tabs } from '@/src/shared/ui/Tabs';
import { formatDate } from '@/src/shared/lib/formatDate';
import { cn } from '@/src/shared/lib/cn';

const PAGE_SIZE = 20;
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
      className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer select-none hover:text-teal-600 transition-colors"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className="flex flex-col">
          <ChevronUp   className={cn('h-3 w-3', active && dir === 'asc'  ? 'text-teal-600' : 'text-gray-300')} />
          <ChevronDown className={cn('h-3 w-3', active && dir === 'desc' ? 'text-teal-600' : 'text-gray-300')} />
        </span>
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
  const [busyId,  setBusyId]  = useState('');

  useEffect(() => {
    setLoading(true);
    userApi.getAll({ page, limit: PAGE_SIZE })
      .then((res) => {
        const all = (res.data.data as unknown as { users: User[]; total: number }).users
          .filter((u) => u.role === role);
        setTotal(all.length);

        const sorted = [...all].sort((a, b) => {
          const va = a[sortKey] ?? '';
          const vb = b[sortKey] ?? '';
          const cmp = String(va).localeCompare(String(vb));
          return sortDir === 'asc' ? cmp : -cmp;
        });
        setUsers(sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE));
      })
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, [page, sortKey, sortDir, role]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  };

  const handleToggle = async (user: User) => {
    setBusyId(user.id);
    const next = !user.isActive;
    // Optimistic
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: next } : u));
    try {
      await userApi.updateStatus(user.id, next);
      toast.success(`User ${next ? 'activated' : 'deactivated'}`);
    } catch {
      setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: !next } : u));
      toast.error('Status update failed');
    } finally {
      setBusyId('');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      {loading ? (
        <div className="flex justify-center py-16"><Spinner /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <SortHeader label="Email"      sortKey="email"     current={sortKey} dir={sortDir} onSort={handleSort} />
                <SortHeader label="Registered" sortKey="createdAt" current={sortKey} dir={sortDir} onSort={handleSort} />
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 ? (
                <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-400">No {role}s found.</td></tr>
              ) : users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.email}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={u.isActive ? 'success' : 'danger'}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      size="sm"
                      variant={u.isActive ? 'danger' : 'secondary'}
                      isLoading={busyId === u.id}
                      onClick={() => handleToggle(u)}
                    >
                      {u.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Page {page} of {totalPages} · {total} user{total !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
              Previous
            </Button>
            <Button variant="secondary" size="sm" disabled={page === totalPages} onClick={() => setPage((p) => p + 1)}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export function ManageUsersPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-gray-900">Manage Users</h1>
      <Tabs tabs={TABS}>
        {(tab) => <UserTable key={tab} role={tab as 'patient' | 'doctor'} />}
      </Tabs>
    </div>
  );
}
