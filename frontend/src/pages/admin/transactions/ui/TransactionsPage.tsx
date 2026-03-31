'use client';
import { useCallback, useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import toast from 'react-hot-toast';
import { paymentApi } from '@/src/entities/payment/api';
import type { Payment } from '@/src/entities/payment/model';
import { Badge } from '@/src/shared/ui/Badge';
import { Button } from '@/src/shared/ui/Button';
import { Spinner } from '@/src/shared/ui/Spinner';
import { formatDate } from '@/src/shared/lib/formatDate';
import { formatCurrency } from '@/src/shared/lib/formatCurrency';

const STATUS_OPTIONS = ['', 'pending', 'succeeded', 'failed', 'refunded'];

const STATUS_VARIANT: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  pending:   'warning',
  succeeded: 'success',
  failed:    'danger',
  refunded:  'info',
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

  const handleRefund = async (payment: Payment) => {
    const confirmed = window.confirm(
      `Refund ${formatCurrency(payment.amount)} to this patient?\n\nThis action is immediate and cannot be undone.`
    );
    if (!confirmed) return;

    setBusyId(payment._id);
    // Optimistic
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

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => exportCsv(payments)}
          disabled={payments.length === 0}
        >
          <Download className="h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <div className="mb-5 flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s ? s.charAt(0).toUpperCase() + s.slice(1) : 'All Statuses'}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">From</label>
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-500">To</label>
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
        </div>
        {(statusFilter || fromDate || toDate) && (
          <button
            onClick={() => { setStatusFilter(''); setFromDate(''); setToDate(''); }}
            className="text-sm text-teal-600 hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      <p className="mb-3 text-sm text-gray-500">
        {loading ? 'Loading…' : `${total} transaction${total !== 1 ? 's' : ''}`}
      </p>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner /></div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                {['Date', 'Appointment ID', 'Amount', 'Status', 'Stripe Intent', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                    No transactions found.
                  </td>
                </tr>
              ) : payments.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-gray-600">{formatDate(p.createdAt)}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {p.appointmentId.slice(-10)}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800">
                    {formatCurrency(p.amount, p.currency)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={STATUS_VARIANT[p.status] ?? 'default'}>
                      {p.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400 truncate max-w-[160px]">
                    {p.stripePaymentIntentId}
                  </td>
                  <td className="px-4 py-3">
                    {p.status === 'succeeded' && (
                      <Button
                        size="sm"
                        variant="danger"
                        isLoading={busyId === p._id}
                        onClick={() => handleRefund(p)}
                      >
                        Refund
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
