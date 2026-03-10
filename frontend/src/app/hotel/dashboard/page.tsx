'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useHotelAuth } from '@/contexts/HotelAuthContext';
import { useRouter } from 'next/navigation';
import { hotelDashboard } from '@/lib/api';

type Redemption = { code: string; user_name: string; discount_value: string; redeemed_at: string };

function toCSV(rows: Redemption[]): string {
  const header = 'Code,Guest,Discount,Date\n';
  const body = rows.map((r) => `"${r.code}","${r.user_name.replace(/"/g, '""')}","${r.discount_value}","${r.redeemed_at}"`).join('\n');
  return header + body;
}

export default function HotelDashboardPage() {
  const { hotel, loading: authLoading } = useHotelAuth();
  const router = useRouter();
  const [stats, setStats] = useState<{ today: number; this_week: number; this_month: number } | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [chartData, setChartData] = useState<{ date: string; count: number }[]>([]);

  useEffect(() => {
    if (!authLoading && !hotel) router.push('/hotel/login');
  }, [hotel, authLoading, router]);

  useEffect(() => {
    if (!hotel) return;
    hotelDashboard.stats().then(setStats).catch(() => {});
    hotelDashboard.chart(7).then((r) => setChartData(r.data)).catch(() => {});
  }, [hotel]);

  useEffect(() => {
    if (!hotel) return;
    const s = start || undefined;
    const e = end || undefined;
    hotelDashboard.redemptions(s, e).then((r) => setRedemptions(r.redemptions)).catch(() => {});
  }, [hotel, start, end]);

  const exportCSV = () => {
    const blob = new Blob([toCSV(redemptions)], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `redemptions-${hotel?.name?.replace(/\s/g, '-') || 'hotel'}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (authLoading || !hotel) return <div className="py-8">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-black dark:text-zinc-100">{hotel.name} Dashboard</h1>
      <p className="mt-2 text-black dark:text-zinc-400">Redemption statistics</p>

      {chartData.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-black dark:text-zinc-100">Redemptions (last 7 days)</h2>
          <div className="mt-4 flex h-32 items-end gap-2">
            {chartData.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col items-center gap-1">
                <div
                  className="w-full min-w-[24px] rounded-t bg-emerald-500 dark:bg-emerald-600"
                  style={{ height: `${Math.max(4, (d.count / Math.max(1, Math.max(...chartData.map((x) => x.count)))) * 100)}%` }}
                />
                <span className="text-xs text-black dark:text-zinc-400">
                  {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
      {stats && (
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-sm font-medium text-black dark:text-zinc-400">Today</h3>
            <p className="mt-2 text-3xl font-bold text-black dark:text-zinc-100">{stats.today}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-sm font-medium text-black dark:text-zinc-400">This Week</h3>
            <p className="mt-2 text-3xl font-bold text-black dark:text-zinc-100">{stats.this_week}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
            <h3 className="text-sm font-medium text-black dark:text-zinc-400">This Month</h3>
            <p className="mt-2 text-3xl font-bold text-black dark:text-zinc-100">{stats.this_month}</p>
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-100">Redemptions</h2>
        <div className="mt-4 flex flex-wrap gap-4">
          <input
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <input
            type="date"
            value={end}
            onChange={(e) => setEnd(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            onClick={exportCSV}
            disabled={redemptions.length === 0}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
        <div className="mt-4 overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
          <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
            <thead className="bg-zinc-50 dark:bg-zinc-800">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-black dark:text-zinc-300">Code</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-black dark:text-zinc-300">Guest</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-black dark:text-zinc-300">Discount</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-black dark:text-zinc-300">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
              {redemptions.map((r) => (
                <tr key={r.code + r.redeemed_at}>
                  <td className="px-4 py-2 font-mono text-sm text-black dark:text-zinc-100">{r.code}</td>
                  <td className="px-4 py-2 text-sm text-black dark:text-zinc-100">{r.user_name}</td>
                  <td className="px-4 py-2 text-sm text-black dark:text-zinc-100">{r.discount_value}</td>
                  <td className="px-4 py-2 text-sm text-black dark:text-zinc-400">
                    {new Date(r.redeemed_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {redemptions.length === 0 && (
          <p className="mt-4 text-center text-black dark:text-zinc-400">No redemptions yet.</p>
        )}
      </div>

      <Link
        href="/hotel/login"
        className="mt-8 inline-block text-sm text-zinc-500 hover:text-black dark:text-zinc-400 dark:hover:text-zinc-300"
      >
        Switch account
      </Link>
    </div>
  );
}
