'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useHotelAuth } from '@/contexts/HotelAuthContext';

export default function HotelRedeemPage() {
  const { hotel, loading: authLoading } = useHotelAuth();
  const router = useRouter();
  const [code, setCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) return;
    router.push(`/redeem/${encodeURIComponent(trimmed)}`);
  };

  if (authLoading) return <div className="py-8">Loading...</div>;
  if (!hotel) {
    router.push('/hotel/login?redirect=/hotel/redeem');
    return null;
  }

  return (
    <div className="mx-auto max-w-md">
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
            Coupon code
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

      <p className="mt-6 text-sm text-black dark:text-zinc-400">
        Or: ask the guest to show their coupon QR code and <strong>scan it with your phone camera</strong>. The link will open the redeem page; log in as this property if needed, then tap Redeem.
      </p>
    </div>
  );
}
