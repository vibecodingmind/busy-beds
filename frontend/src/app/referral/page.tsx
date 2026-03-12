'use client';

import { Suspense, useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { referrals, stripe, type ReferralMeResponse } from '@/lib/api';
import { useToast } from '@/contexts/ToastContext';

function ReferralContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [data, setData] = useState<ReferralMeResponse | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);
  const toast = useToast();
  const refreshData = useCallback(() => referrals.me().then(setData).catch(() => {}), []);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    refreshData();
  }, [user, refreshData]);

  useEffect(() => {
    const connected = searchParams.get('connected');
    const refresh = searchParams.get('refresh');
    if ((connected === '1' || refresh === '1') && user) {
      stripe
        .connectComplete()
        .then((res) => {
          if (res.success) {
            toast('Stripe account connected!', 'success');
            refreshData();
            router.replace('/referral');
          }
        })
        .catch(() => {});
    }
  }, [searchParams, user, refreshData, toast, router]);

  const shareUrl = typeof window !== 'undefined' && data ? `${window.location.origin}/register?ref=${data.code}` : '';

  const handleConnectStripe = async () => {
    setConnectLoading(true);
    try {
      const res = await stripe.connectOnboard();
      if (res.url) window.location.href = res.url;
      else toast(res.message || 'Already connected', 'success');
    } catch (e) {
      toast((e as Error).message || 'Failed to start', 'error');
    } finally {
      setConnectLoading(false);
    }
  };

  const getRewardForReferred = (referredId: number) =>
    data?.rewards.find((r) => r.referred_id === referredId);

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
          {!data.stripe_connected && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 dark:border-amber-800 dark:bg-amber-950/30">
              <h2 className="font-semibold text-foreground">Connect Stripe to receive payouts</h2>
              <p className="mt-2 text-sm text-muted">
                Link your Stripe account to get paid when your referrals subscribe.
              </p>
              <button
                onClick={handleConnectStripe}
                disabled={connectLoading}
                className="mt-4 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {connectLoading ? 'Connecting...' : 'Connect Stripe'}
              </button>
            </div>
          )}

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
                <span className="text-sm text-muted">Pending</span>
                <p className="text-xl font-bold text-amber-600">${data.total_pending.toFixed(2)}</p>
              </div>
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
                      <span>{r.name} ({r.email})</span>
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
                            {reward.status === 'paid' ? `Earned $${reward.amount.toFixed(2)}` : reward.status === 'pending' ? `Pending $${reward.amount.toFixed(2)}` : 'Failed'}
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
