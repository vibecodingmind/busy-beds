'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { coupons } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';

type Coupon = { id: number; code: string; hotel_name: string; discount_value: string; status: string; expires_at: string };

const DEFAULT_TERMS = [
  'Redeemable at the hotel at check-in',
  'Can be used for eligible room rates only',
  'Cannot be reactivated after expiry',
  'Limit to one-time usage per coupon',
];

export default function MyCouponsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [couponList, setCouponList] = useState<Coupon[]>([]);
  const [selected, setSelected] = useState<Coupon | null>(null);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    coupons.list().then((r) => setCouponList(r.coupons)).catch(() => {});
  }, [user]);

  const handleCancel = async (couponId: number) => {
    if (!confirm('Cancel this coupon? It cannot be used after cancellation.')) return;
    try {
      await coupons.cancel(couponId);
      setCouponList((prev) => prev.map((c) => (c.id === couponId ? { ...c, status: 'cancelled' } : c)));
      if (selected?.id === couponId) setSelected(null);
    } catch {
      // ignore
    }
  };

  if (authLoading || !user) return <div className="py-8">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">My Coupons</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">Select a coupon to view details and QR code.</p>

      <div className="mt-8 flex flex-col gap-6 lg:flex-row lg:items-stretch">
        {/* Left: Coupon list */}
        <div className="flex flex-1 flex-col gap-4 lg:max-w-md">
          {couponList.map((c) => (
            <div
              key={c.id}
              className={`flex cursor-pointer items-center gap-4 rounded-xl border-2 bg-white p-4 transition dark:bg-zinc-900 ${
                selected?.id === c.id
                  ? 'border-emerald-500 shadow-md dark:border-emerald-600'
                  : 'border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
              }`}
              onClick={() => setSelected(c)}
            >
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xl font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                {c.hotel_name?.charAt(0) || 'H'}
              </div>
              <div className="min-w-0 flex-1 border-l-2 border-dashed border-zinc-200 pl-4 dark:border-zinc-600">
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">{c.hotel_name}</p>
                <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">{c.discount_value}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Expires {new Date(c.expires_at).toLocaleDateString()}
                </p>
              </div>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setSelected(c); }}
                className="rounded-lg bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
              >
                View
              </button>
            </div>
          ))}
          {couponList.length === 0 && (
            <p className="rounded-xl border-2 border-dashed border-zinc-200 bg-white p-8 text-center text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
              No coupons yet. Get one from a hotel!
            </p>
          )}
        </div>

        {/* Right: Selected coupon detail */}
        <div className="lg:min-w-[360px]">
          {selected ? (
            <div className="rounded-xl border-2 border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-zinc-200 text-2xl font-bold text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                  {selected.hotel_name?.charAt(0) || 'H'}
                </div>
                <div>
                  <p className="font-semibold text-zinc-900 dark:text-zinc-100">{selected.hotel_name}</p>
                  <p className="font-medium text-emerald-600 dark:text-emerald-400">{selected.discount_value} Coupon</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Expires on {new Date(selected.expires_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Terms */}
              <div className="mt-6">
                <h3 className="text-sm font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">Terms of Use</h3>
                <ul className="mt-2 space-y-1 text-sm text-zinc-600 dark:text-zinc-300">
                  {DEFAULT_TERMS.map((t, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <span className="text-emerald-500">•</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Code + QR (ticket style) */}
              <div className="mt-6 rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 p-4 dark:border-zinc-600 dark:bg-zinc-800/50">
                <p className="mb-2 text-center font-mono text-xl font-bold text-zinc-900 dark:text-zinc-100">
                  {selected.code}
                </p>
                <div className="flex justify-center rounded bg-white p-4 dark:bg-zinc-900">
                  <QRCodeSVG
                    value={typeof window !== 'undefined' ? `${window.location.origin}/redeem/${selected.code}` : ''}
                    size={180}
                    level="M"
                  />
                </div>
                <p className="mt-2 text-center text-xs text-zinc-500 dark:text-zinc-400">
                  Show at hotel check-in
                </p>
              </div>

              {/* Status & actions */}
              <div className="mt-6 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    selected.status === 'active'
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300'
                      : selected.status === 'redeemed'
                        ? 'bg-zinc-200 text-zinc-700 dark:bg-zinc-600 dark:text-zinc-300'
                        : selected.status === 'cancelled'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                  }`}
                >
                  {selected.status}
                </span>
                {selected.status === 'active' && (
                  <button
                    onClick={() => handleCancel(selected.id)}
                    className="rounded-lg border border-red-200 px-3 py-1 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-950/30"
                  >
                    Cancel coupon
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-12 dark:border-zinc-700 dark:bg-zinc-900/50">
              <p className="text-zinc-500 dark:text-zinc-400">Select a coupon to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
