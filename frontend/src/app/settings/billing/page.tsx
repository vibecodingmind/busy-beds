'use client';

import { useEffect, useState, Suspense } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { subscriptions, stripe, paypal, flutterwave, promo, exchangeRates } from '@/lib/api';
import type { SubscriptionPlan } from '@/lib/api';
import { formatPlanPrice } from '@/lib/formatPlanPrice';
import { useToast } from '@/contexts/ToastContext';

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
  const [selectedCurrency, setSelectedCurrency] = useState('USD');
  const [rates, setRates] = useState<{ currency_code: string; rate: number }[]>([]);
  const toast = useToast();

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    subscriptions.plans().then((r) => setPlans(r.plans)).catch(() => { });
    exchangeRates.listPublic().then((r) => setRates(r.rates)).catch(() => { });
    if (user) {
      subscriptions.me().then((r) => {
        if (r.subscription) setCurrentSub(r.subscription as { plan: SubscriptionPlan; current_period_end: string });
      }).catch(() => { });
    }
  }, [user]);
  useEffect(() => {
    if (searchParams.get('success') && user) {
      subscriptions.me().then((r) => {
        if (r.subscription) setCurrentSub(r.subscription as { plan: SubscriptionPlan; current_period_end: string });
      }).catch(() => { });
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
        appliedPromo?.code,
        selectedCurrency
      );
      if (session?.url) {
        window.location.href = session.url;
        return;
      }
      toast('Could not start Stripe checkout. Please check payment configuration or try again.', 'error');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not start Stripe checkout. Please check payment configuration.';
      toast(message, 'error');
    }
    setLoading(null);
  };

  const handlePayPalSubscribe = async (planId: number) => {
    setLoading(`paypal-${planId}`);
    try {
      const res = await paypal.createSubscription(planId, undefined, undefined, selectedCurrency);
      if (res?.url) {
        window.location.href = res.url;
        return;
      }
      toast('Could not start PayPal checkout. Please check payment configuration or try again.', 'error');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not start PayPal checkout. Please check payment configuration.';
      toast(message, 'error');
    }
    setLoading(null);
  };

  const handleFlutterwaveSubscribe = async (planId: number) => {
    setLoading(`flutterwave-${planId}`);
    try {
      const res = await flutterwave.createCharge(planId, undefined, undefined, selectedCurrency);
      if (res?.url) {
        window.location.href = res.url;
        return;
      }
      toast('Could not start Flutterwave checkout. Please check payment configuration or try again.', 'error');
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not start Flutterwave checkout. Please check payment configuration.';
      toast(message, 'error');
    }
    setLoading(null);
  };

  const handleDirectSubscribe = async (planId: number) => {
    setLoading(`direct-${planId}`);
    try {
      await subscriptions.subscribe(planId);
      const r = await subscriptions.me();
      if (r.subscription) setCurrentSub(r.subscription as { plan: SubscriptionPlan; current_period_end: string });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Could not activate subscription. Please try again or contact support.';
      toast(message, 'error');
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
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Could not cancel subscription. Please try again or contact support.';
      toast(message, 'error');
    } finally {
      setLoading(null);
    }
  };

  if (authLoading || !user) return <div className="p-8 text-black dark:text-zinc-400">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header Breadcrumb */}
      <div className="flex items-center gap-2 border-b border-border px-8 py-5 text-sm">
        <span className="text-muted">My Account</span>
        <span className="text-zinc-300 dark:text-zinc-600">/</span>
        <span className="font-medium text-foreground flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" fill="none" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" /></svg>
          Subscription & Billing
        </span>
      </div>

      <div className="p-8 max-w-5xl space-y-8">
        <div>
          <h2 className="text-xl font-bold text-foreground">Active Plan</h2>
          <p className="mt-1 text-sm text-muted">
            {currentSub
              ? `Current plan: ${currentSub.plan.name} (${currentSub.plan.monthly_coupon_limit} coupons/${currentSub.plan.interval || 'month'})`
              : 'Choose a plan to start generating coupons.'}
          </p>
          {currentSub && (
            <button
              onClick={handleCancel}
              disabled={loading !== null}
              className="mt-4 rounded-lg bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50 dark:bg-red-950/30 dark:text-red-400 dark:hover:bg-red-900/50"
            >
              Cancel Subscription
            </button>
          )}
        </div>

        {!currentSub && (
          <div className="rounded-2xl border border-border bg-black/[0.02] p-6 dark:bg-white/[0.02]">
            <h3 className="text-sm font-semibold text-foreground">Promo code</h3>
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

        <div className="flex items-center justify-between border-b border-border pb-4">
          <h2 className="text-xl font-bold text-foreground">Available Plans</h2>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-muted">Currency:</span>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value)}
              className="rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            >
              <option value="USD">USD ($)</option>
              {rates.map(r => (
                <option key={r.currency_code} value={r.currency_code}>{r.currency_code}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-3">
          {plans.map((plan) => {
            const hasStripe = !!plan.stripe_price_id;
            const hasPayPal = !!plan.paypal_plan_id;
            const hasFlutterwave = !!plan.flutterwave_plan_id;
            const hasPayment = hasStripe || hasPayPal || hasFlutterwave;
            const isCurrent = currentSub?.plan.id === plan.id;
            const isLoading = loading !== null;

            return (
              <div
                key={plan.id}
                className={`flex flex-col justify-between rounded-3xl border p-8 transition-all ${isCurrent
                  ? 'border-primary/50 bg-primary/5 shadow-sm'
                  : 'border-border bg-card hover:border-primary/30'
                  }`}
              >
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <p className="text-3xl font-bold tracking-tight text-foreground">
                      {(() => {
                        if (selectedCurrency === (plan.currency || 'USD')) {
                          return formatPlanPrice(plan.price, plan.currency);
                        }
                        const rateObj = rates.find(r => r.currency_code === selectedCurrency);
                        if (rateObj) {
                          return formatPlanPrice(plan.price * rateObj.rate, selectedCurrency);
                        }
                        return formatPlanPrice(plan.price, plan.currency);
                      })()}
                    </p>
                    <p className="text-sm font-medium text-muted">/ {plan.interval || 'mo'}</p>
                  </div>
                  <p className="mt-4 text-sm text-muted">{plan.monthly_coupon_limit} coupons per {plan.interval || 'month'}</p>
                </div>
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
                          className="w-full rounded-full bg-foreground py-2.5 text-sm font-semibold text-background hover:bg-foreground/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {loading === `stripe-${plan.id}` ? 'Redirecting…' : 'Card / Stripe'}
                        </button>
                      )}
                      {hasPayPal && (
                        <button
                          onClick={() => handlePayPalSubscribe(plan.id)}
                          disabled={isLoading}
                          className="w-full rounded-full bg-[#0070ba] py-2.5 text-sm font-semibold text-white hover:bg-[#005ea6] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {loading === `paypal-${plan.id}` ? 'Redirecting…' : 'PayPal'}
                        </button>
                      )}
                      {hasFlutterwave && (
                        <button
                          onClick={() => handleFlutterwaveSubscribe(plan.id)}
                          disabled={isLoading}
                          className="w-full rounded-full bg-[#F5A623] py-2.5 text-sm font-semibold text-white hover:bg-[#e69512] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {loading === `flutterwave-${plan.id}` ? 'Redirecting…' : 'Flutterwave'}
                        </button>
                      )}
                      {!hasPayment && plan.price > 0 && (
                        <button
                          disabled
                          className="w-full rounded-full bg-muted/20 py-2.5 text-sm font-semibold text-muted cursor-not-allowed"
                        >
                          Unavailable
                        </button>
                      )}
                      {!hasPayment && plan.price === 0 && (
                        <button
                          onClick={() => handleDirectSubscribe(plan.id)}
                          disabled={isLoading}
                          className="w-full rounded-full bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {loading === `direct-${plan.id}` ? 'Subscribing...' : 'Subscribe Free'}
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
