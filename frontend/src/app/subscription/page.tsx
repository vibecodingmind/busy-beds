'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { subscriptions } from '@/lib/api';
import type { SubscriptionPlan } from '@/lib/api';

export default function SubscriptionPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
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

  const handleSubscribe = async (planId: number) => {
    setLoading(String(planId));
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

  if (authLoading || !user) return <div className="py-8">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Subscription</h1>
      <p className="mt-2 text-zinc-600">
        {currentSub
          ? `Current plan: ${currentSub.plan.name} (${currentSub.plan.monthly_coupon_limit} coupons/month)`
          : 'Choose a plan to start generating coupons.'}
      </p>
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-xl border p-6 ${
              currentSub?.plan.id === plan.id
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-zinc-200 bg-white'
            }`}
          >
            <h3 className="font-semibold text-zinc-900">{plan.name}</h3>
            <p className="mt-2 text-2xl font-bold text-zinc-900">${plan.price}</p>
            <p className="text-sm text-zinc-600">/ month</p>
            <p className="mt-2 text-zinc-600">{plan.monthly_coupon_limit} coupons per month</p>
            <button
              onClick={() => handleSubscribe(plan.id)}
              disabled={loading !== null || currentSub?.plan.id === plan.id}
              className="mt-4 w-full rounded-lg bg-zinc-900 py-2 font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
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
