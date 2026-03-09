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

  if (authLoading || !user) return <div className="py-8">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
      <p className="mt-2 text-zinc-600">Welcome, {user.name}</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-zinc-900">Subscription</h3>
          <p className="mt-2 text-zinc-600">
            {sub ? sub.plan.name : 'No subscription'}
          </p>
          {sub && (
            <p className="mt-1 text-sm text-zinc-500">
              Renews: {new Date(sub.current_period_end).toLocaleDateString()}
            </p>
          )}
          <Link
            href="/subscription"
            className="mt-4 inline-block text-sm text-emerald-600 hover:underline"
          >
            Manage subscription
          </Link>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="font-semibold text-zinc-900">My Coupons</h3>
          <p className="mt-2 text-2xl font-bold text-zinc-900">{couponCount}</p>
          <Link
            href="/my-coupons"
            className="mt-4 inline-block text-sm text-emerald-600 hover:underline"
          >
            View coupons
          </Link>
        </div>
      </div>
      <Link
        href="/hotels"
        className="mt-8 inline-block rounded-lg bg-emerald-600 px-6 py-3 font-medium text-white hover:bg-emerald-700"
      >
        Browse Hotels & Get Coupons
      </Link>
    </div>
  );
}
