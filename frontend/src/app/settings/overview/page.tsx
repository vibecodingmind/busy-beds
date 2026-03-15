'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { subscriptions, coupons } from '@/lib/api';
import { HouseIcon } from '@/components/icons';

export default function OverviewPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [sub, setSub] = useState<{ plan: { name: string }; current_period_end: string } | null>(null);
  const [couponCount, setCouponCount] = useState(0);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    subscriptions.me().then((r) => setSub(r.subscription ?? null)).catch(() => { });
    coupons.list().then((r) => setCouponCount(r.coupons.length)).catch(() => { });
  }, [user]);

  if (authLoading || !user) return <div className="p-8 text-muted">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header Breadcrumb */}
      <div className="flex items-center justify-between border-b border-border px-8 py-5 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted">Settings</span>
          <span className="text-zinc-300 dark:text-zinc-600">/</span>
          <span className="font-medium text-foreground flex items-center gap-1.5">
            <HouseIcon className="w-4 h-4" />
            Overview
          </span>
        </div>
      </div>

      <div className="p-8 space-y-8 flex-1">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {user.name}</h1>
          <p className="mt-1 text-muted">Here's what's happening with your account.</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl border border-border bg-black/[0.02] dark:bg-white/[0.02] p-6 shadow-sm">
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
              href="/settings/billing"
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              Manage subscription →
            </Link>
          </div>
          <div className="rounded-2xl border border-border bg-black/[0.02] dark:bg-white/[0.02] p-6 shadow-sm">
            <h3 className="font-semibold text-foreground">My Coupons</h3>
            <p className="mt-2 text-3xl font-bold text-foreground">{couponCount}</p>
            <Link
              href="/settings/coupons"
              className="mt-4 inline-block text-sm font-medium text-primary hover:underline"
            >
              View coupons →
            </Link>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-black/[0.02] dark:bg-white/[0.02] p-8 text-center">
          <p className="text-muted mb-6 text-sm">Discover more hotels and get exclusive rewards.</p>
          <Link
            href="/hotels"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 font-medium text-white shadow-md hover:bg-primary/90 transition-colors"
          >
            <HouseIcon className="w-5 h-5" />
            Browse Properties & Get Coupons
          </Link>
        </div>
      </div>
    </div>
  );
}
