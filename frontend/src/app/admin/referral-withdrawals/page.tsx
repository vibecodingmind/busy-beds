'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { admin } from '@/lib/api';

type AdminWithdrawRequest = {
  id: number;
  user_id: number;
  user_email: string;
  user_name: string;
  amount: number;
  method: string;
  method_details: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  processed_at: string | null;
};

const STATUS_FILTERS = ['all', 'pending', 'approved', 'paid', 'rejected'] as const;

export default function AdminReferralWithdrawalsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [requests, setRequests] = useState<AdminWithdrawRequest[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>('pending');
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, authLoading, router]);

  const load = async (status?: string) => {
    setLoading(true);
    try {
      const res = await admin.withdrawRequests.list(status && status !== 'all' ? status : undefined);
      setRequests(res.requests);
      setPendingCount(res.pending_count);
    } catch {
      // ignore; page will just show empty/error state
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    load(statusFilter === 'all' ? undefined : statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, statusFilter]);

  const handleUpdateStatus = async (id: number, status: 'approved' | 'paid' | 'rejected') => {
    setUpdatingId(id);
    try {
      await admin.withdrawRequests.update(id, { status });
      await load(statusFilter === 'all' ? undefined : statusFilter);
    } catch {
      // TODO: add toast when we add admin toasts here
    } finally {
      setUpdatingId(null);
    }
  };

  if (authLoading || !user || user.role !== 'admin') {
    return <div className="py-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black dark:text-zinc-100">Referral withdrawals</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Review and process withdrawal requests from users who earned referral rewards.
          </p>
        </div>
        <div className="rounded-full bg-amber-50 px-4 py-1 text-sm font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
          Pending: {pendingCount}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`rounded-full px-3 py-1 text-sm ${
              statusFilter === s
                ? 'bg-black text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700'
            }`}
          >
            {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 sm:p-6 overflow-x-auto">
        {loading ? (
          <p className="py-6 text-sm text-zinc-500 dark:text-zinc-400">Loading requests...</p>
        ) : requests.length === 0 ? (
          <p className="py-6 text-sm text-zinc-500 dark:text-zinc-400">No withdrawal requests found for this filter.</p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-black/5 dark:border-zinc-700">
                <th className="py-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">User</th>
                <th className="py-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">Amount</th>
                <th className="py-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">Method</th>
                <th className="py-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">Details</th>
                <th className="py-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">Status</th>
                <th className="py-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">Created</th>
                <th className="py-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">Processed</th>
                <th className="py-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((r) => (
                <tr key={r.id} className="border-b border-black/5 last:border-0 dark:border-zinc-800">
                  <td className="py-2 pr-4 align-top">
                    <div className="font-medium text-black dark:text-zinc-100">{r.user_name}</div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">{r.user_email}</div>
                  </td>
                  <td className="py-2 pr-4 align-top">
                    <div className="font-medium text-emerald-600 dark:text-emerald-400">${r.amount.toFixed(2)}</div>
                  </td>
                  <td className="py-2 pr-4 align-top text-zinc-700 dark:text-zinc-300">
                    {r.method === 'mobile_money' ? 'Mobile money' : r.method === 'bank' ? 'Bank' : 'PayPal'}
                  </td>
                  <td className="py-2 pr-4 align-top text-xs text-zinc-600 dark:text-zinc-400 max-w-xs">
                    <div className="line-clamp-3 whitespace-pre-wrap break-words">{r.method_details}</div>
                    {r.admin_notes && (
                      <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                        Admin notes: {r.admin_notes}
                      </div>
                    )}
                  </td>
                  <td className="py-2 pr-4 align-top">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.status === 'paid'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                          : r.status === 'approved'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                            : r.status === 'rejected'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                      }`}
                    >
                      {r.status.charAt(0).toUpperCase() + r.status.slice(1)}
                    </span>
                  </td>
                  <td className="py-2 pr-4 align-top text-xs text-zinc-600 dark:text-zinc-400">
                    {new Date(r.created_at).toLocaleString()}
                  </td>
                  <td className="py-2 pr-4 align-top text-xs text-zinc-600 dark:text-zinc-400">
                    {r.processed_at ? new Date(r.processed_at).toLocaleString() : '—'}
                  </td>
                  <td className="py-2 pr-4 align-top">
                    <div className="flex flex-col gap-1 text-xs">
                      {r.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(r.id, 'approved')}
                            disabled={updatingId === r.id}
                            className="rounded-full bg-blue-600 px-3 py-1 text-white hover:bg-blue-700 disabled:opacity-50"
                          >
                            {updatingId === r.id ? 'Updating...' : 'Mark approved'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUpdateStatus(r.id, 'rejected')}
                            disabled={updatingId === r.id}
                            className="rounded-full bg-red-600 px-3 py-1 text-white hover:bg-red-700 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {(r.status === 'approved' || r.status === 'pending') && (
                        <button
                          type="button"
                          onClick={() => handleUpdateStatus(r.id, 'paid')}
                          disabled={updatingId === r.id}
                          className="rounded-full bg-emerald-600 px-3 py-1 text-white hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {updatingId === r.id ? 'Updating...' : 'Mark paid'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

