'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useHotelAuth } from '@/contexts/HotelAuthContext';
import { hotelDashboard } from '@/lib/api';

export default function HotelRedeemPage() {
  const { hotel, loading: authLoading } = useHotelAuth();
  const router = useRouter();
  const [code, setCode] = useState('');
  const [bulkCodes, setBulkCodes] = useState('');
  const [bulkResults, setBulkResults] = useState<{ code: string; success: boolean; error?: string }[] | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    router.push(`/redeem/${encodeURIComponent(trimmed)}`);
  };

  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const codes = bulkCodes
      .split(/[\n,]+/)
      .map((c) => c.trim())
      .filter(Boolean);
    if (codes.length === 0) return;
    setBulkLoading(true);
    setBulkResults(null);
    try {
      const res = await hotelDashboard.bulkRedeem(codes);
      setBulkResults(res.results);
    } catch {
      setBulkResults([{ code: '', success: false, error: 'Request failed' }]);
    } finally {
      setBulkLoading(false);
    }
  };

  if (authLoading) return <div className="py-8">Loading...</div>;
  if (!hotel) {
    router.push('/hotel/login?redirect=/hotel/redeem');
    return null;
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/hotel/dashboard" className="text-sm text-emerald-600 hover:underline dark:text-emerald-400">
        ← Dashboard
      </Link>
      <h1 className="mt-6 text-2xl font-bold text-black dark:text-zinc-100">Redeem coupon</h1>
      <p className="mt-2 text-black dark:text-zinc-400">
        Enter the coupon code from the guest, or scan their QR code with your phone camera to open the redeem page.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label htmlFor="code" className="block text-sm font-medium text-black dark:text-zinc-300">
            Single code
          </label>
          <input
            id="code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="e.g. BB-XXXX-XXXX"
            className="mt-1 w-full rounded-lg border border-black/20 dark:border-zinc-600 bg-white px-4 py-3 font-mono text-black dark:bg-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400"
            autoFocus
          />
        </div>
        <button
          type="submit"
          disabled={!code.trim()}
          className="w-full rounded-lg bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-50 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          Validate & redeem
        </button>
      </form>

      <div className="mt-10 border-t border-zinc-200 pt-8 dark:border-zinc-700">
        <h2 className="text-lg font-semibold text-black dark:text-zinc-100">Bulk redeem</h2>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Paste one code per line (or comma-separated). Max 50 at a time.
        </p>
        <form onSubmit={handleBulkSubmit} className="mt-4 space-y-4">
          <textarea
            value={bulkCodes}
            onChange={(e) => setBulkCodes(e.target.value)}
            rows={4}
            placeholder={'BB-CODE-1\nBB-CODE-2'}
            className="w-full rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100"
          />
          <button
            type="submit"
            disabled={bulkLoading || !bulkCodes.trim()}
            className="rounded-lg bg-zinc-700 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-600 disabled:opacity-50 dark:bg-zinc-600 dark:hover:bg-zinc-500"
          >
            {bulkLoading ? 'Redeeming...' : 'Redeem all'}
          </button>
        </form>
        {bulkResults && (
          <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="text-sm font-medium text-black dark:text-zinc-300">Results</p>
            <ul className="mt-2 space-y-1 text-sm">
              {bulkResults.map((r, i) => (
                <li key={i} className={r.success ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}>
                  {r.code || '—'} {r.success ? '✓' : `✗ ${r.error || ''}`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <p className="mt-6 text-sm text-black dark:text-zinc-400">
        Or: ask the guest to show their coupon QR code and <strong>scan it with your phone camera</strong>. The link will open the redeem page; log in as this property if needed, then tap Redeem.
      </p>
    </div>
  );
}
