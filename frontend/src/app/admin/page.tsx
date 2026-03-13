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
  const [chartData, setChartData] = useState<{ signups: { date: string; count: number }[]; redemptions: { date: string; count: number }[] } | null>(null);

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
    admin.analytics().then(setAnalytics).catch(() => {});
    admin.analyticsChart().then(setChartData).catch(() => {});
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
      {chartData && (chartData.signups.length > 0 || chartData.redemptions.length > 0) && (
        <div className="mt-6 rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-800 p-6">
          <h2 className="font-semibold text-black dark:text-zinc-100">Last 14 days</h2>
          <div className="mt-4 flex gap-8">
            {chartData.signups.length > 0 && (
              <div className="flex-1">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Signups</p>
                <div className="mt-2 flex h-24 items-end gap-1">
                  {chartData.signups.map((d) => (
                    <div key={d.date} className="flex-1 min-w-0" title={`${d.date}: ${d.count}`}>
                      <div
                        className="w-full rounded-t bg-blue-500 dark:bg-blue-600"
                        style={{ height: `${Math.max(4, (d.count / Math.max(1, Math.max(...chartData.signups.map((x) => x.count)))) * 100)}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{chartData.signups[0]?.date}</span>
                  <span>{chartData.signups[chartData.signups.length - 1]?.date}</span>
                </div>
              </div>
            )}
            {chartData.redemptions.length > 0 && (
              <div className="flex-1">
                <p className="text-sm text-zinc-500 dark:text-zinc-400">Redemptions</p>
                <div className="mt-2 flex h-24 items-end gap-1">
                  {chartData.redemptions.map((d) => (
                    <div key={d.date} className="flex-1 min-w-0" title={`${d.date}: ${d.count}`}>
                      <div
                        className="w-full rounded-t bg-emerald-500 dark:bg-emerald-600"
                        style={{ height: `${Math.max(4, (d.count / Math.max(1, Math.max(...chartData.redemptions.map((x) => x.count)))) * 100)}%` }}
                      />
                    </div>
                  ))}
                </div>
                <div className="mt-1 flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
                  <span>{chartData.redemptions[0]?.date}</span>
                  <span>{chartData.redemptions[chartData.redemptions.length - 1]?.date}</span>
                </div>
              </div>
            )}
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
        <Link href="/admin/pages">
          <div className="rounded-xl border border-black/10 dark:border-zinc-700 bg-white p-6 shadow-sm hover:shadow-md dark:bg-zinc-900">
            <h3 className="font-semibold text-black dark:text-zinc-100">Pages</h3>
            <p className="mt-2 text-sm text-black dark:text-zinc-400">Privacy, Terms, About, Contact</p>
          </div>
        </Link>
        <Link href="/admin/contact-inbox">
          <div className="rounded-xl border border-black/10 dark:border-zinc-700 bg-white p-6 shadow-sm hover:shadow-md dark:bg-zinc-900">
            <h3 className="font-semibold text-black dark:text-zinc-100">Contact inbox</h3>
            <p className="mt-2 text-sm text-black dark:text-zinc-400">Form submissions, status, notes</p>
          </div>
        </Link>
        <Link href="/admin/export">
          <div className="rounded-xl border border-black/10 dark:border-zinc-700 bg-white p-6 shadow-sm hover:shadow-md dark:bg-zinc-900">
            <h3 className="font-semibold text-black dark:text-zinc-100">Export</h3>
            <p className="mt-2 text-sm text-black dark:text-zinc-400">CSV export: users, coupons, redemptions</p>
          </div>
        </Link>
        <Link href="/admin/audit-log">
          <div className="rounded-xl border border-black/10 dark:border-zinc-700 bg-white p-6 shadow-sm hover:shadow-md dark:bg-zinc-900">
            <h3 className="font-semibold text-black dark:text-zinc-100">Audit log</h3>
            <p className="mt-2 text-sm text-black dark:text-zinc-400">Admin actions history</p>
          </div>
        </Link>
        <Link href="/admin/settings">
          <div className="rounded-xl border border-black/10 dark:border-zinc-700 bg-white p-6 shadow-sm hover:shadow-md dark:bg-zinc-900">
            <h3 className="font-semibold text-black dark:text-zinc-100">Settings</h3>
            <p className="mt-2 text-sm text-black dark:text-zinc-400">API keys, Stripe, PayPal, Maps</p>
          </div>
        </Link>
        <Link href="/admin/referral-withdrawals">
          <div className="rounded-xl border border-black/10 dark:border-zinc-700 bg-white p-6 shadow-sm hover:shadow-md dark:bg-zinc-900">
            <h3 className="font-semibold text-black dark:text-zinc-100">Referral withdrawals</h3>
            <p className="mt-2 text-sm text-black dark:text-zinc-400">Review money-out requests from referrers</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
