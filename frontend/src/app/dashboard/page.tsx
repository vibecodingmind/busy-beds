'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { subscriptions, coupons } from '@/lib/api';

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sub, setSub] = useState<{ plan: { name: string }; current_period_end: string } | null>(null);
  const [couponCount, setCouponCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    subscriptions.me().then((r) => setSub(r.subscription ?? null)).catch(() => {});
    coupons.list().then((r) => setCouponCount(r.coupons.length)).catch(() => {});
  }, [user]);

  if (authLoading || !user) return <div className="py-12 text-zinc-500 dark:text-zinc-400">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Dashboard</h1>
        <p className="mt-1 text-zinc-600 dark:text-zinc-400">Welcome back, {user.name}</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Subscription</h3>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            {sub ? sub.plan.name : 'No subscription'}
          </p>
          {sub && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Renews: {new Date(sub.current_period_end).toLocaleDateString()}
            </p>
          )}
          <Link
            href="/subscription"
            className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            Manage subscription →
          </Link>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">My Coupons</h3>
          <p className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-100">{couponCount}</p>
          <Link
            href="/my-coupons"
            className="mt-4 inline-block text-sm font-medium text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
          >
            View coupons →
          </Link>
        </div>
      </div>
      <Link
        href="/hotels"
        className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 font-medium text-white shadow-md hover:bg-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 transition-colors"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        Browse Hotels & Get Coupons
      </Link>
    </div>
  );
}
