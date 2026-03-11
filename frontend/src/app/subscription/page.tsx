'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { subscriptions, stripe } from '@/lib/api';
import type { SubscriptionPlan } from '@/lib/api';

function SubscriptionContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSub, setCurrentSub] = useState<{
    plan: SubscriptionPlan;
    current_period_end: string;
  } | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    subscriptions.plans().then((r) => setPlans(r.plans)).catch(() => {});
    if (user) {
      subscriptions.me().then((r) => {
        if (r.subscription) setCurrentSub(r.subscription as { plan: SubscriptionPlan; current_period_end: string });
      }).catch(() => {});
    }
  }, [user]);
  useEffect(() => {
    if (searchParams.get('success') && user) {
      subscriptions.me().then((r) => {
        if (r.subscription) setCurrentSub(r.subscription as { plan: SubscriptionPlan; current_period_end: string });
      }).catch(() => {});
      router.replace('/subscription');
    }
  }, [searchParams, user, router]);

  const handleSubscribe = async (planId: number) => {
    setLoading(String(planId));
    try {
      const session = await stripe.createCheckoutSession(planId);
      if (session?.url) {
        window.location.href = session.url;
        return;
      }
    } catch {
      // Stripe not configured, fall through to direct subscribe
    }
    try {
      await subscriptions.subscribe(planId);
      const r = await subscriptions.me();
      if (r.subscription) setCurrentSub(r.subscription as { plan: SubscriptionPlan; current_period_end: string });
    } catch {
      // ignore
    } finally {
      setLoading(null);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription? You will keep access until the end of the billing period.')) return;
    setLoading('cancel');
    try {
      await subscriptions.cancel();
      setCurrentSub(null);
    } catch {
      // ignore
    } finally {
      setLoading(null);
    }
  };

  if (authLoading || !user) return <div className="py-12 text-black dark:text-zinc-400">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-zinc-100">Subscription</h1>
        <p className="mt-1 text-black dark:text-zinc-400">
          {currentSub
            ? `Current plan: ${currentSub.plan.name} (${currentSub.plan.monthly_coupon_limit} coupons/month)`
            : 'Choose a plan to start generating coupons.'}
        </p>
        {currentSub && (
          <button
            onClick={handleCancel}
            disabled={loading !== null}
            className="mt-4 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50 dark:border-red-800 dark:bg-transparent dark:text-red-400 dark:hover:bg-red-950/30"
          >
            Cancel Subscription
          </button>
        )}
      </div>
      <div className="grid gap-6 sm:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-xl border p-6 transition-colors ${
              currentSub?.plan.id === plan.id
                ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/30'
                : 'border-black/10 dark:border-zinc-700 bg-white dark:border-zinc-700 dark:bg-zinc-900'
            }`}
          >
            <h3 className="font-semibold text-black dark:text-zinc-100">{plan.name}</h3>
            <p className="mt-2 text-2xl font-bold text-black dark:text-zinc-100">${plan.price}</p>
            <p className="text-sm text-black dark:text-zinc-400">/ month</p>
            <p className="mt-2 text-black dark:text-zinc-400">{plan.monthly_coupon_limit} coupons per month</p>
            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading !== null || currentSub?.plan.id === plan.id}
              className="mt-4 w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-emerald-600 dark:hover:bg-emerald-500"
            >
              {currentSub?.plan.id === plan.id
                ? 'Current Plan'
                : loading === String(plan.id)
                  ? 'Subscribing...'
                  : 'Subscribe'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<div className="py-8">Loading...</div>}>
      <SubscriptionContent />
    </Suspense>
  );
}
