'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { subscriptions, coupons } from '@/lib/api';
import { HouseIcon } from '@/components/icons';

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

  if (authLoading || !user) return <div className="py-12 text-muted">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="mt-1 text-muted">Welcome back, {user.name}</p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card backdrop-blur-sm p-6 shadow-sm">
          <h3 className="font-semibold text-foreground">Subscription</h3>
          <p className="mt-2 text-muted">
            {sub ? sub.plan.name : 'No subscription'}
          </p>
          {sub && (
            <p className="mt-1 text-sm text-muted">
              Renews: {new Date(sub.current_period_end).toLocaleDateString()}
            </p>
          )}
          <Link
            href="/subscription"
            className="mt-4 inline-block text-sm font-medium text-[#FF385C] hover:underline"
          >
            Manage subscription →
          </Link>
        </div>
        <div className="rounded-2xl border border-border bg-card backdrop-blur-sm p-6 shadow-sm">
          <h3 className="font-semibold text-foreground">My Coupons</h3>
          <p className="mt-2 text-3xl font-bold text-foreground">{couponCount}</p>
          <Link
            href="/my-coupons"
            className="mt-4 inline-block text-sm font-medium text-[#FF385C] hover:underline"
          >
            View coupons →
          </Link>
        </div>
      </div>
      <Link
        href="/hotels"
        className="inline-flex items-center gap-2 rounded-xl bg-[#FF385C] px-6 py-3 font-medium text-white shadow-md hover:bg-[#e31c5f] transition-colors"
      >
        <HouseIcon />
        Browse Properties & Get Coupons
      </Link>
    </div>
  );
}
