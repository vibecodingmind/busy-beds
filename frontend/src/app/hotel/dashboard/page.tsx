'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useHotelAuth } from '@/contexts/HotelAuthContext';
import { useRouter } from 'next/navigation';
import { hotelDashboard } from '@/lib/api';

export default function HotelDashboardPage() {
  const { hotel, loading: authLoading } = useHotelAuth();
  const router = useRouter();
  const [stats, setStats] = useState<{ today: number; this_week: number; this_month: number } | null>(null);
  const [redemptions, setRedemptions] = useState<{ code: string; user_name: string; discount_value: string; redeemed_at: string }[]>([]);

  useEffect(() => {
    if (!authLoading && !hotel) router.push('/hotel/login');
  }, [hotel, authLoading, router]);

  useEffect(() => {
    if (!hotel) return;
    hotelDashboard.stats().then(setStats).catch(() => {});
    hotelDashboard.redemptions().then((r) => setRedemptions(r.redemptions)).catch(() => {});
  }, [hotel]);

  if (authLoading || !hotel) return <div className="py-8">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">{hotel.name} Dashboard</h1>
      <p className="mt-2 text-zinc-600">Redemption statistics</p>

      {stats && (
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-zinc-500">Today</h3>
            <p className="mt-2 text-3xl font-bold text-zinc-900">{stats.today}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-zinc-500">This Week</h3>
            <p className="mt-2 text-3xl font-bold text-zinc-900">{stats.this_week}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
            <h3 className="text-sm font-medium text-zinc-500">This Month</h3>
            <p className="mt-2 text-3xl font-bold text-zinc-900">{stats.this_month}</p>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-900">Recent Redemptions</h2>
        <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-zinc-700">Code</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-zinc-700">Guest</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-zinc-700">Discount</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-zinc-700">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {redemptions.map((r) => (
                <tr key={r.code + r.redeemed_at}>
                  <td className="px-4 py-2 font-mono text-sm">{r.code}</td>
                  <td className="px-4 py-2 text-sm">{r.user_name}</td>
                  <td className="px-4 py-2 text-sm">{r.discount_value}</td>
                  <td className="px-4 py-2 text-sm text-zinc-500">
                    {new Date(r.redeemed_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {redemptions.length === 0 && (
          <p className="mt-4 text-center text-zinc-500">No redemptions yet.</p>
        )}
      </div>

      <Link
        href="/hotel/login"
        className="mt-8 inline-block text-sm text-zinc-500 hover:text-zinc-700"
      >
        Switch account
      </Link>
    </div>
  );
}
