'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { subscriptions, stripe } from '@/lib/api';
import type { SubscriptionPlan } from '@/lib/api';

type Sub = {
  id: number;
  status: string;
  current_period_start: string;
  current_period_end: string;
  plan: SubscriptionPlan;
};

export default function BillingPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sub, setSub] = useState<Sub | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    subscriptions
      .me()
      .then((r) => setSub((r.subscription as Sub) ?? null))
      .catch(() => setSub(null))
      .finally(() => setLoading(false));
  }, [user]);

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const { url } = await stripe.billingPortal();
      window.location.href = url;
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Unable to open billing portal. You may need an active Stripe subscription first.');
    } finally {
      setPortalLoading(false);
    }
  };

  if (authLoading || !user) return <div className="py-8">Loading...</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <Link href="/profile" className="text-sm text-zinc-500 hover:underline dark:text-zinc-400">
        ← Account
      </Link>
      <h1 className="mt-6 text-2xl font-bold text-black dark:text-zinc-100">Billing history</h1>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        View your subscription and manage payment methods or download invoices.
      </p>

      {loading ? (
        <p className="mt-6 text-zinc-500">Loading...</p>
      ) : (
        <div className="mt-8 space-y-6">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
            <h2 className="font-semibold text-black dark:text-zinc-100">Current subscription</h2>
            {sub ? (
              <>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  <span className="font-medium">{sub.plan.name}</span> — {sub.plan.monthly_coupon_limit} coupons/month
                </p>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-500">
                  Status: <span className="capitalize">{sub.status}</span>
                  {sub.current_period_end && (
                    <> · Current period ends {new Date(sub.current_period_end).toLocaleDateString()}</>
                  )}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="/subscription"
                    className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                  >
                    Change plan
                  </Link>
                  {sub.status === 'active' && (
                    <button
                      type="button"
                      onClick={handleManageBilling}
                      disabled={portalLoading}
                      className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {portalLoading ? 'Opening...' : 'Manage billing & invoices'}
                    </button>
                  )}
                </div>
                <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">
                  Use &quot;Manage billing & invoices&quot; to update your card, view past invoices, or download PDFs (Stripe).
                </p>
              </>
            ) : (
              <>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">You don’t have an active subscription.</p>
                <Link
                  href="/subscription"
                  className="mt-4 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
                >
                  Choose a plan
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
