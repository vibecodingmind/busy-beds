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

  if (authLoading || !user) return <div className="py-12 text-muted">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Refer & Earn</h1>
        <p className="mt-1 text-muted">
          Share your code. When friends subscribe, you earn 25% of their first payment.
        </p>
      </div>

      {data && (
        <div className="space-y-8">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold text-foreground">Earnings</h2>
            <div className="mt-4 flex flex-wrap gap-6">
              {typeof data.earnings_this_month === 'number' && (
                <div>
                  <span className="text-sm text-muted">This month</span>
                  <p className="text-xl font-bold text-emerald-600">${data.earnings_this_month.toFixed(2)}</p>
                </div>
              )}
              <div>
                <span className="text-sm text-muted">Total earned</span>
                <p className="text-xl font-bold text-emerald-600">${data.total_earned.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-sm text-muted">Pending (not yet paid)</span>
                <p className="text-xl font-bold text-amber-600">${data.total_pending.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-sm text-muted">Available to withdraw</span>
                <p className="text-xl font-bold text-foreground">${data.withdrawable_balance.toFixed(2)}</p>
                <p className="mt-1 text-xs text-muted">
                  Min ${data.withdraw_min_amount.toFixed(2)} · Max ${data.withdraw_max_amount.toFixed(2)} per request
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold text-foreground">Request withdrawal</h2>
              <p className="mt-2 text-sm text-muted">
                Request a payout to your preferred method. An admin will review and mark it as paid after sending the money.
              </p>
              <form onSubmit={handleSubmitWithdraw} className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground">Amount (USD)</label>
                  <input
                    type="number"
                    min={0}
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    placeholder="Enter amount to withdraw"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Method</label>
                  <select
                    value={method}
                    onChange={(e) => setMethod(e.target.value as 'bank' | 'mobile_money' | 'paypal')}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                  >
                    <option value="bank">Bank transfer</option>
                    <option value="mobile_money">Mobile money</option>
                    <option value="paypal">PayPal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground">Payout details</label>
                  <textarea
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    rows={3}
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                    placeholder="Bank account / mobile wallet / PayPal email"
                  />
                  <p className="mt-1 text-xs text-muted">
                    Please include everything the admin needs to send your payout (e.g. bank name + account number, M-Pesa number, or PayPal email).
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Request withdrawal'}
                </button>
              </form>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="font-semibold text-foreground">Recent withdrawal requests</h2>
              {withdrawRequests.length === 0 ? (
                <p className="mt-3 text-sm text-muted">You have not requested any withdrawals yet.</p>
              ) : (
                <ul className="mt-3 space-y-2 text-sm">
                  {withdrawRequests.slice(0, 5).map((w) => (
                    <li key={w.id} className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium text-foreground">
                          ${w.amount.toFixed(2)} • {w.method === 'mobile_money' ? 'Mobile money' : w.method === 'bank' ? 'Bank' : 'PayPal'}
                        </p>
                        <p className="text-xs text-muted">
                          {new Date(w.created_at).toLocaleDateString()} • {w.method_details}
                        </p>
                      </div>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          w.status === 'paid'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                            : w.status === 'approved'
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400'
                              : w.status === 'rejected'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                        }`}
                      >
                        {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold text-foreground">Your referral code</h2>
            <p className="mt-2 font-mono text-2xl font-bold text-emerald-600">{data.code}</p>
            <p className="mt-2 text-sm text-muted">Share this link:</p>
            <div className="mt-2 flex gap-2">
              <input
                readOnly
                value={shareUrl}
                className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
              <button
                onClick={() => { navigator.clipboard.writeText(shareUrl); toast('Link copied!', 'success'); }}
                className="rounded-lg bg-primary px-4 py-2 text-sm text-white"
              >
                Copy
              </button>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="font-semibold text-foreground">People you referred ({data.referred.length})</h2>
            {data.referred.length > 0 ? (
              <ul className="mt-4 space-y-2">
                {data.referred.map((r) => {
                  const reward = getRewardForReferred(r.id);
                  return (
                    <li key={r.id} className="flex items-center justify-between text-sm text-foreground">
                      <span>
                        {r.name} ({r.email})
                      </span>
                      <div className="flex items-center gap-3">
                        {reward && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                              reward.status === 'paid'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                : reward.status === 'pending'
                                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                                  : 'bg-black/5 dark:bg-zinc-700 text-foreground'
                            }`}
                          >
                            {reward.status === 'paid'
                              ? `Earned $${reward.amount.toFixed(2)}`
                              : reward.status === 'pending'
                                ? `Pending $${reward.amount.toFixed(2)}`
                                : 'Failed'}
                          </span>
                        )}
                        <span>{new Date(r.created_at).toLocaleDateString()}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 text-muted">No referrals yet. Share your link to get started!</p>
            )}
          </div>
        </div>
      )}
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
