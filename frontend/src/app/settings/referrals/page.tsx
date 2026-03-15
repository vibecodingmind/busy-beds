'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { referrals, type ReferralMeResponse, type WithdrawRequestRow } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

function ReferralContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<ReferralMeResponse | null>(null);
  const [withdrawRequests, setWithdrawRequests] = useState<WithdrawRequestRow[]>([]);
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'bank' | 'mobile_money' | 'paypal'>('bank');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const loadData = useCallback(async () => {
    try {
      const [me, withdraws] = await Promise.all([referrals.me(), referrals.withdrawRequests()]);
      setData(me);
      setWithdrawRequests(withdraws.requests);
    } catch {
      // ignore for now; toasts on explicit actions
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, loadData]);

  const shareUrl = typeof window !== 'undefined' && data ? `${window.location.origin}/register?ref=${data.code}` : '';

  const getRewardForReferred = (referredId: number) =>
    data?.rewards.find((r) => r.referred_id === referredId);

  const handleSubmitWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data) return;
    const numericAmount = parseFloat(amount);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast('Enter a valid amount', 'error');
      return;
    }
    if (!details.trim()) {
      toast('Please enter account details for payout', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await referrals.withdrawRequest(numericAmount, method, details.trim());
      toast('Withdrawal request submitted', 'success');
      setAmount('');
      setDetails('');
      loadData();
    } catch (err) {
      toast((err as Error).message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !user) return <div className="p-8 text-muted">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header Breadcrumb */}
      <div className="flex items-center justify-between border-b border-border px-8 py-5 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted">Settings</span>
          <span className="text-zinc-300 dark:text-zinc-600">/</span>
          <span className="font-medium text-foreground flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
            Refer & Earn
          </span>
        </div>
      </div>

      <div className="p-8 space-y-8 flex-1">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Refer & Earn</h1>
          <p className="mt-1 text-muted">
            Share your code and earn 25% of your friends&apos; first payment.
          </p>
        </div>

        {data && (
          <div className="space-y-8">
            <div className="rounded-2xl border border-border bg-black/[0.02] dark:bg-white/[0.02] p-6">
              <h2 className="font-semibold text-foreground">Earnings Summary</h2>
              <div className="mt-4 flex flex-wrap gap-8">
                {typeof data.earnings_this_month === 'number' && (
                  <div>
                    <span className="text-sm text-muted">This month</span>
                    <p className="text-2xl font-bold text-emerald-600">${data.earnings_this_month.toFixed(2)}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm text-muted">Total earned</span>
                  <p className="text-2xl font-bold text-emerald-600">${data.total_earned.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted">Pending payout</span>
                  <p className="text-2xl font-bold text-amber-600">${data.total_pending.toFixed(2)}</p>
                </div>
                <div>
                  <span className="text-sm text-muted">Available now</span>
                  <p className="text-2xl font-bold text-foreground">${data.withdrawable_balance.toFixed(2)}</p>
                  <p className="mt-1 text-xs text-muted">
                    Limit: ${data.withdraw_min_amount} - ${data.withdraw_max_amount}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-black/[0.02] dark:bg-white/[0.02] p-8">
                <h2 className="font-semibold text-foreground">Request Withdrawal</h2>
                <p className="mt-2 text-sm text-muted mb-6">
                  Admin will review and mark as paid after sending funds.
                </p>
                <form onSubmit={handleSubmitWithdraw} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Amount (USD)</label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Payout Method</label>
                    <select
                      value={method}
                      onChange={(e) => setMethod(e.target.value as 'bank' | 'mobile_money' | 'paypal')}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none border-zinc-200 dark:border-zinc-700"
                    >
                      <option value="bank">Bank Transfer</option>
                      <option value="mobile_money">Mobile Money</option>
                      <option value="paypal">PayPal</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-1.5">Account Details</label>
                    <textarea
                      value={details}
                      onChange={(e) => setDetails(e.target.value)}
                      rows={3}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground outline-none transition-all focus:ring-2 focus:ring-primary/20"
                      placeholder="Bank info, wallet ID, or PayPal email"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-bold text-white hover:opacity-90 disabled:opacity-50 transition-all font-mono uppercase tracking-widest"
                  >
                    {submitting ? 'Processing...' : 'Submit Request'}
                  </button>
                </form>
              </div>

              <div className="rounded-2xl border border-border bg-black/[0.02] dark:bg-white/[0.02] p-8">
                <h2 className="font-semibold text-foreground mb-6">Recent Status</h2>
                {withdrawRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center bg-white/40 dark:bg-black/20 rounded-xl border border-dashed border-border">
                    <p className="text-sm text-muted">No withdrawal history available.</p>
                  </div>
                ) : (
                  <ul className="space-y-4">
                    {withdrawRequests.slice(0, 4).map((w) => (
                      <li key={w.id} className="flex items-center justify-between gap-4 p-4 rounded-xl bg-white/40 dark:bg-zinc-800/40 border border-border">
                        <div>
                          <p className="font-bold text-foreground">${w.amount.toFixed(2)}</p>
                          <p className="text-xs text-muted mt-0.5">{new Date(w.created_at).toLocaleDateString()}</p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${w.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                            : w.status === 'rejected'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                            }`}
                        >
                          {w.status}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-primary/5 p-8 border-primary/20">
              <h2 className="font-semibold text-foreground">Your Referral Link</h2>
              <p className="mt-2 text-sm text-muted mb-4 font-medium">Use the link below to invite your friends:</p>
              <div className="flex gap-2">
                <input
                  readOnly
                  value={shareUrl}
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm font-mono text-foreground outline-none"
                />
                <button
                  onClick={() => { navigator.clipboard.writeText(shareUrl); toast('Copied to clipboard!', 'success'); }}
                  className="rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white shadow-sm hover:translate-y-[-1px] transition-all"
                >
                  Copy
                </button>
              </div>
              <p className="mt-4 text-xs text-primary font-bold uppercase tracking-widest">
                Referral Code: {data.code}
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-black/[0.02] dark:bg-white/[0.02] p-8">
              <h2 className="font-semibold text-foreground mb-6">Referrals ({data.referred.length})</h2>
              {data.referred.length > 0 ? (
                <div className="rounded-xl overflow-hidden border border-border">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-zinc-50 dark:bg-zinc-800 text-muted uppercase text-[10px] font-bold tracking-widest">
                      <tr>
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {data.referred.map((r) => {
                        const reward = getRewardForReferred(r.id);
                        return (
                          <tr key={r.id} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.01]">
                            <td className="px-6 py-4">
                              <p className="font-medium text-foreground">{r.name}</p>
                              <p className="text-xs text-muted">{r.email}</p>
                            </td>
                            <td className="px-6 py-4">
                              {reward && (
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${reward.status === 'paid' ? 'text-emerald-600' : 'text-amber-600'
                                  }`}>
                                  {reward.status === 'paid' ? `+$${reward.amount}` : 'Pending'}
                                </span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-right text-muted">{new Date(r.created_at).toLocaleDateString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted text-center py-6">No referrals yet. Share your code to start earning!</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReferralPage() {
  return (
    <Suspense fallback={<div className="py-8">Loading...</div>}>
      <ReferralContent />
    </Suspense>
  );
}
