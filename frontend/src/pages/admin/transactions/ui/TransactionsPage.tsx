'use client';
import { useCallback, useEffect, useState, useMemo } from 'react';
import { Download, Search, Filter, DollarSign, TrendingUp, BarChart3, RefreshCw, FileText, CreditCard, ArrowUpDown, CheckCircle2, XCircle, Info, Calendar, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentApi } from '@/src/entities/payment/api';
import type { Payment } from '@/src/entities/payment/model';
import { Badge } from '@/src/shared/ui/Badge';
import { Button } from '@/src/shared/ui/Button';
import { Spinner } from '@/src/shared/ui/Spinner';
import { formatDate } from '@/src/shared/lib/formatDate';
import { formatCurrency } from '@/src/shared/lib/formatCurrency';
import { cn } from '@/src/shared/lib/cn';

const STATUS_OPTIONS = ['', 'pending', 'succeeded', 'failed', 'refunded'];

const STATUS_STYLE: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
  pending:   { bg: 'bg-amber-50 ring-amber-600/20 text-amber-700', text: 'Pending', icon: <RefreshCw className="h-3 w-3 animate-spin-slow" /> },
  succeeded: { bg: 'bg-emerald-50 ring-emerald-600/20 text-emerald-700', text: 'Successful', icon: <CheckCircle2 className="h-3 w-3" /> },
  failed:    { bg: 'bg-rose-50 ring-rose-600/20 text-rose-700', text: 'Failed', icon: <XCircle className="h-3 w-3" /> },
  refunded:  { bg: 'bg-indigo-50 ring-indigo-600/20 text-indigo-700', text: 'Refunded', icon: <RefreshCw className="h-3 w-3" /> },
};

function exportCsv(payments: Payment[]) {
  const headers = ['Date', 'Payment ID', 'Appointment ID', 'Amount (LKR)', 'Status', 'Stripe Intent ID'];
  const rows = payments.map((p) => [
    formatDate(p.createdAt),
    p._id,
    p.appointmentId,
    String(p.amount),
    p.status,
    p.stripePaymentIntentId,
  ]);
  const csv  = [headers, ...rows].map((r) => r.map((cell) => `"${cell}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function TransactionsPage() {
  const [payments,  setPayments]  = useState<Payment[]>([]);
  const [total,     setTotal]     = useState(0);
  const [loading,   setLoading]   = useState(true);
  const [busyId,    setBusyId]    = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate,  setFromDate]  = useState('');
  const [toDate,    setToDate]    = useState('');
  const [search,    setSearch]    = useState('');

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await paymentApi.getAll({
        status: statusFilter || undefined,
        from:   fromDate    || undefined,
        to:     toDate      || undefined,
        limit:  200,
      });
      setPayments(res.data.data.payments);
      setTotal(res.data.data.total);
    } catch {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, fromDate, toDate]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const stats = useMemo(() => {
    const succeeded = payments.filter(p => p.status === 'succeeded');
    const refunded = payments.filter(p => p.status === 'refunded');
    return {
      revenue: succeeded.reduce((acc, p) => acc + p.amount, 0),
      refunds: refunded.reduce((acc, p) => acc + p.amount, 0),
      count: payments.length,
      successRate: payments.length > 0 ? (succeeded.length / payments.length) * 100 : 0
    };
  }, [payments]);

  const handleRefund = async (payment: Payment) => {
    const confirmed = window.confirm(
      `Refund ${formatCurrency(payment.amount)} to this patient?\n\nThis action is immediate and cannot be undone.`
    );
    if (!confirmed) return;

    setBusyId(payment._id);
    setPayments((prev) => prev.map((p) => p._id === payment._id ? { ...p, status: 'refunded' } : p));
    try {
      await paymentApi.refund(payment._id);
      toast.success('Refund issued successfully');
    } catch {
      setPayments((prev) => prev.map((p) => p._id === payment._id ? { ...p, status: payment.status } : p));
      toast.error('Refund failed');
    } finally {
      setBusyId('');
    }
  };

  const filtered = payments.filter(p => 
    !search || 
    p._id.toLowerCase().includes(search.toLowerCase()) || 
    p.appointmentId.toLowerCase().includes(search.toLowerCase()) ||
    p.stripePaymentIntentId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Top Header */}
      <div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-end">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600 ring-1 ring-inset ring-indigo-600/20">
            <DollarSign className="h-3 w-3" /> Financial Control Center
          </div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900">Transactions</h1>
          <p className="mt-2 max-w-md text-sm text-gray-500">Monitor all system payments, issue refunds, and track financial growth across the platform.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => exportCsv(payments)}
            disabled={payments.length === 0}
            className="flex items-center gap-2 rounded-2xl bg-white border border-gray-100 px-5 py-3 text-sm font-bold text-gray-700 shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={fetchPayments}
            className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-100 transition-all hover:bg-indigo-700 active:scale-95"
          >
            <RefreshCw className={cn('h-5 w-5', loading && 'animate-spin')} />
          </button>
        </div>
      </div>

      {/* Financial Summary Benchmarks */}
      <div className="mb-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Total Revenue', value: formatCurrency(stats.revenue), icon: <TrendingUp className="h-5 w-5" />, color: 'bg-emerald-50 text-emerald-600' },
          { label: 'Total Refunds', value: formatCurrency(stats.refunds), icon: <RefreshCw className="h-5 w-5" />, color: 'bg-amber-50 text-amber-700' },
          { label: 'Success Rate', value: `${stats.successRate.toFixed(1)}%`, icon: <BarChart3 className="h-5 w-5" />, color: 'bg-blue-50 text-blue-600' },
          { label: 'Transactions', value: stats.count, icon: <FileText className="h-5 w-5" />, color: 'bg-indigo-50 text-indigo-600' },
        ].map((stat, i) => (
          <div key={i} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm ring-1 ring-black/[0.02]">
            <div className="mb-4 flex items-center justify-between">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', stat.color)}>
                {stat.icon}
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Benchmarks</span>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{stat.label}</p>
            <p className="mt-1 text-2xl font-black text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Filters Hub */}
      <div className="mb-8 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              placeholder="Search by Payment ID, Intent, or Appointment..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border-none bg-gray-50 py-3.5 pl-11 pr-4 text-sm font-medium placeholder:text-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/10 transition-all"
            />
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-3">
              <Filter className="h-4 w-4 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-xl border-none bg-gray-50 py-2.5 pl-3 pr-8 text-sm font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Statuses'}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="rounded-xl border-none bg-gray-50 py-2.5 px-3 text-xs font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all"
              />
              <span className="text-gray-400">—</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="rounded-xl border-none bg-gray-50 py-2.5 px-3 text-xs font-bold text-gray-700 focus:bg-white focus:ring-2 focus:ring-indigo-500/10 transition-all"
              />
            </div>
            {(statusFilter || fromDate || toDate || search) && (
              <button
                onClick={() => { setStatusFilter(''); setFromDate(''); setToDate(''); setSearch(''); }}
                className="flex items-center justify-center rounded-xl bg-gray-50 p-2.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all"
              >
                <RefreshCw className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Spinner className="h-10 w-10 text-indigo-600" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest animate-pulse">Syncing Finances...</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm ring-1 ring-black/[0.02]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                <tr>
                  <th className="px-6 py-5 text-left">Internal Transaction</th>
                  <th className="px-6 py-5 text-left">Gateway Reference</th>
                  <th className="px-6 py-5 text-left">Amount & Currency</th>
                  <th className="px-6 py-5 text-center">Outcome</th>
                  <th className="px-6 py-5 text-right">Settlement</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-24 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-300">
                          <CreditCard className="h-6 w-6" />
                        </div>
                        <p className="text-lg font-bold text-gray-400">No transactions archived</p>
                        <p className="text-xs text-gray-400">Adjust your hub filters to see archived records</p>
                      </div>
                    </td>
                  </tr>
                ) : filtered.map((p) => {
                  const style = STATUS_STYLE[p.status] || { bg: 'bg-gray-50 text-gray-500', text: p.status, icon: <Info className="h-3 w-3" /> };
                  return (
                    <tr key={p._id} className="group hover:bg-indigo-50/20 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <p className="font-bold text-gray-900 truncate max-w-[140px] uppercase tracking-tighter">PAY-{p._id.slice(-8)}</p>
                          <div className="flex items-center gap-1.5 text-xs text-gray-400">
                            <Calendar className="h-3 w-3" /> {formatDate(p.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <p className="text-xs font-black text-gray-900 uppercase">Stripe Intent</p>
                          <p className="font-mono text-[10px] text-gray-400 truncate max-w-[160px]">{p.stripePaymentIntentId || 'Manual/Test'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col">
                          <p className="text-lg font-black text-gray-900">{formatCurrency(p.amount, p.currency)}</p>
                          <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Network Secure</p>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <div className={cn(
                          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ring-1 ring-inset',
                          style.bg
                        )}>
                          {style.icon}
                          {style.text}
                        </div>
                      </td>
                      <td className="px-6 py-5 text-right">
                        {p.status === 'succeeded' ? (
                          <div className="flex justify-end gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                            <button
                              onClick={() => handleRefund(p)}
                              disabled={busyId === p._id}
                              className="flex h-9 items-center gap-2 rounded-xl bg-orange-50 px-4 text-xs font-bold uppercase tracking-widest text-orange-600 transition-all hover:bg-orange-600 hover:text-white"
                            >
                              {busyId === p._id ? <Spinner className="h-3.5 w-3.5" /> : <RefreshCw className="h-3.5 w-3.5" />}
                              Issue Refund
                            </button>
                            <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50 text-gray-400 transition-all hover:bg-gray-100">
                              <MoreHorizontal className="h-5 w-5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">Immutable</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// Fixed missing import for MoreHorizontal which I used in the table
function MoreHorizontal(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg 
      {...props} 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" />
    </svg>
  );
}
