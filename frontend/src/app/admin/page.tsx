'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { admin } from '@/lib/api';

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [counts, setCounts] = useState<{ hotels: number; users: number; coupons: number; pending: number } | null>(null);
  const [analytics, setAnalytics] = useState<{
    total_users: number;
    total_hotels: number;
    active_subscriptions: number;
    active_coupons: number;
    total_redemptions: number;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    Promise.all([
      admin.hotels.list(),
      admin.users(),
      admin.coupons(),
      admin.pendingHotelAccounts(),
    ])
      .then(([h, u, c, p]) =>
        setCounts({
          hotels: h.hotels.length,
          users: u.users.length,
          coupons: c.coupons.length,
          pending: p.accounts.length,
        })
      )
      .catch(() => {});
    admin
      .analytics()
      .then((a) => setAnalytics(a))
      .catch(() => {});
  }, [user]);

  if (authLoading || !user || user.role !== 'admin') return <div className="py-8">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-black">Admin Dashboard</h1>
      {analytics && (
        <div className="mt-6 rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
          <h2 className="font-semibold text-black">Analytics Overview</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <div>
              <p className="text-sm text-black">Total users</p>
              <p className="text-2xl font-bold text-black">{analytics.total_users}</p>
            </div>
            <div>
              <p className="text-sm text-black">Total hotels</p>
              <p className="text-2xl font-bold text-black">{analytics.total_hotels}</p>
            </div>
            <div>
              <p className="text-sm text-black">Active subscriptions</p>
              <p className="text-2xl font-bold text-black">{analytics.active_subscriptions}</p>
            </div>
            <div>
              <p className="text-sm text-black">Active coupons</p>
              <p className="text-2xl font-bold text-black">{analytics.active_coupons}</p>
            </div>
            <div>
              <p className="text-sm text-black">Total redemptions</p>
              <p className="text-2xl font-bold text-black">{analytics.total_redemptions}</p>
            </div>
          </div>
        </div>
      )}
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <Link href="/admin/hotels">
          <div className="rounded-xl border border-black/10 dark:border-zinc-700 bg-white p-6 shadow-sm hover:shadow-md">
            <h3 className="font-semibold text-black">Hotels</h3>
            <p className="mt-2 text-3xl font-bold text-black">{counts?.hotels ?? '-'}</p>
          </div>
        </Link>
        <Link href="/admin/users">
          <div className="rounded-xl border border-black/10 dark:border-zinc-700 bg-white p-6 shadow-sm hover:shadow-md">
            <h3 className="font-semibold text-black">Users</h3>
            <p className="mt-2 text-3xl font-bold text-black">{counts?.users ?? '-'}</p>
          </div>
        </Link>
        <Link href="/admin/coupons">
          <div className="rounded-xl border border-black/10 dark:border-zinc-700 bg-white p-6 shadow-sm hover:shadow-md">
            <h3 className="font-semibold text-black">Coupons</h3>
            <p className="mt-2 text-3xl font-bold text-black">{counts?.coupons ?? '-'}</p>
          </div>
        </Link>
        <Link href="/admin/plans">
          <div className="rounded-xl border border-black/10 dark:border-zinc-700 bg-white p-6 shadow-sm hover:shadow-md dark:bg-zinc-900">
            <h3 className="font-semibold text-black dark:text-zinc-100">Subscription Plans</h3>
            <p className="mt-2 text-sm text-black dark:text-zinc-400">Manage plans and pricing</p>
          </div>
        </Link>
        <Link href="/admin/hotel-accounts">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm hover:shadow-md">
            <h3 className="font-semibold text-black">Pending Hotel Approvals</h3>
            <p className="mt-2 text-3xl font-bold text-amber-700">{counts?.pending ?? '-'}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
