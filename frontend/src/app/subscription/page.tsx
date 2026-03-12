'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { subscriptions, stripe, paypal, promo } from '@/lib/api';
import type { SubscriptionPlan } from '@/lib/api';
import { formatPlanPrice } from '@/lib/formatPlanPrice';

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
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; message: string } | null>(null);
  const [promoError, setPromoError] = useState('');
  const [promoChecking, setPromoChecking] = useState(false);

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

  const handleApplyPromo = async () => {
    const code = promoCode.trim();
    if (!code) return;
    setPromoError('');
    setPromoChecking(true);
    try {
      const result = await promo.validate(code);
      if (result.valid && result.message) {
        setAppliedPromo({ code, message: result.message });
      } else {
        setPromoError('Invalid or expired code');
        setAppliedPromo(null);
      }
    } catch {
      setPromoError('Could not validate code');
      setAppliedPromo(null);
    } finally {
      setPromoChecking(false);
    }
  };

  const handleStripeSubscribe = async (planId: number) => {
    setLoading(`stripe-${planId}`);
    try {
      const session = await stripe.createCheckoutSession(
        planId,
        undefined,
        undefined,
        appliedPromo?.code
      );
      if (session?.url) {
        window.location.href = session.url;
        return;
      }
    } catch {
      // ignore
    }
    setLoading(null);
  };

  const handlePayPalSubscribe = async (planId: number) => {
    setLoading(`paypal-${planId}`);
    try {
      const res = await paypal.createSubscription(planId);
      if (res?.url) {
        window.location.href = res.url;
        return;
      }
    } catch {
      // ignore
    }
    setLoading(null);
  };

  const handleDirectSubscribe = async (planId: number) => {
    setLoading(`direct-${planId}`);
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

      {!currentSub && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-900">
          <h3 className="text-sm font-medium text-black dark:text-zinc-100">Promo code</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            <input
              type="text"
              value={promoCode}
              onChange={(e) => { setPromoCode(e.target.value); setPromoError(''); }}
              placeholder="Enter code"
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
            />
            <button
              type="button"
              onClick={handleApplyPromo}
              disabled={promoChecking || !promoCode.trim()}
              className="rounded-lg bg-zinc-200 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-300 disabled:opacity-50 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
            >
              {promoChecking ? 'Checking...' : 'Apply'}
            </button>
          </div>
          {appliedPromo && <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{appliedPromo.message} applied</p>}
          {promoError && <p className="mt-2 text-sm text-red-600 dark:text-red-400">{promoError}</p>}
        </div>
      )}

      <div className="grid gap-6 sm:grid-cols-3">
        {plans.map((plan) => {
          const hasStripe = !!plan.stripe_price_id;
          const hasPayPal = !!plan.paypal_plan_id;
          const hasPayment = hasStripe || hasPayPal;
          const isCurrent = currentSub?.plan.id === plan.id;
          const isLoading = loading !== null;

          return (
            <div
              key={plan.id}
              className={`rounded-xl border p-6 transition-colors ${
                isCurrent
                  ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/30'
                  : 'border-black/10 dark:border-zinc-700 bg-white dark:border-zinc-700 dark:bg-zinc-900'
              }`}
            >
              <h3 className="font-semibold text-black dark:text-zinc-100">{plan.name}</h3>
              <p className="mt-2 text-2xl font-bold text-black dark:text-zinc-100">{formatPlanPrice(plan.price, plan.currency)}</p>
              <p className="text-sm text-black dark:text-zinc-400">/ month</p>
              <p className="mt-2 text-black dark:text-zinc-400">{plan.monthly_coupon_limit} coupons per month</p>
              <div className="mt-4 flex flex-col gap-2">
                {isCurrent ? (
                  <div className="rounded-lg bg-emerald-200/50 py-2.5 text-center font-medium text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200">
                    Current Plan
                  </div>
                ) : (
                  <>
                    {hasStripe && (
                      <button
                        onClick={() => handleStripeSubscribe(plan.id)}
                        disabled={isLoading}
                        className="w-full rounded-lg bg-zinc-900 py-2.5 font-medium text-white hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
                      >
                        {loading === `stripe-${plan.id}` ? 'Redirecting…' : 'Pay with Card (Stripe)'}
                      </button>
                    )}
                    {hasPayPal && (
                      <button
                        onClick={() => handlePayPalSubscribe(plan.id)}
                        disabled={isLoading}
                        className="w-full rounded-lg bg-[#0070ba] py-2.5 font-medium text-white hover:bg-[#005ea6] disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading === `paypal-${plan.id}` ? 'Redirecting…' : 'Pay with PayPal'}
                      </button>
                    )}
                    {!hasPayment && (
                      <button
                        onClick={() => handleDirectSubscribe(plan.id)}
                        disabled={isLoading}
                        className="w-full rounded-lg bg-emerald-600 py-2.5 font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-emerald-600 dark:hover:bg-emerald-500"
                      >
                        {loading === `direct-${plan.id}` ? 'Subscribing...' : 'Subscribe'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}
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
