'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { hotels } from '@/lib/api';
import type { Hotel } from '@/lib/api';
import StarRating from '@/components/StarRating';

function CompareContent() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get('ids') || '';
  const ids = idsParam.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n) && n > 0).slice(0, 3);
  const [hotelsList, setHotelsList] = useState<(Hotel & { avg_rating?: number | null; review_count?: number })[]>([]);
  const [loading, setLoading] = useState(!!ids.length);

  useEffect(() => {
    if (ids.length === 0) {
      setHotelsList([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all(ids.map((id) => hotels.get(id).catch(() => null)))
      .then((results) => results.filter((h): h is Hotel & { avg_rating?: number | null; review_count?: number } => h != null))
      .then(setHotelsList)
      .catch(() => setHotelsList([]))
      .finally(() => setLoading(false));
  }, [ids.join(',')]);

  if (ids.length === 0) {
    return (
      <div className="rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-8 text-center">
        <h1 className="text-xl font-bold text-black dark:text-zinc-100">Compare hotels</h1>
        <p className="mt-2 text-black dark:text-zinc-400">
          Add up to 3 hotel IDs in the URL: <code className="rounded bg-zinc-100 dark:bg-zinc-800 px-1">/compare?ids=1,2,3</code>
        </p>
        <p className="mt-4 text-sm text-black dark:text-zinc-500">
          Or open a hotel page and use &quot;Add to compare&quot; (if available).
        </p>
        <Link href="/hotels" className="mt-6 inline-block font-medium text-primary hover:underline">Browse hotels →</Link>
      </div>
    );
  }

  if (loading) return <div className="py-12 text-black dark:text-zinc-400">Loading...</div>;
  if (hotelsList.length === 0) return <div className="py-12 text-black dark:text-zinc-400">No hotels found. Check the IDs.</div>;

  const rows = [
    { label: 'Name', key: 'name', fn: (h: Hotel) => h.name },
    { label: 'Location', key: 'location', fn: (h: Hotel) => h.location || '—' },
    { label: 'Discount', key: 'discount', fn: (h: Hotel) => h.coupon_discount_value },
    { label: 'Rating', key: 'rating', fn: (h: Hotel & { avg_rating?: number | null; review_count?: number }) => h.avg_rating != null ? `${Number(h.avg_rating).toFixed(1)} (${h.review_count ?? 0} reviews)` : '—' },
    { label: 'Redemptions this month', key: 'redemptions', fn: (h: Hotel) => (h as { redemptions_this_month?: number }).redemptions_this_month ?? '—' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-zinc-100">Compare hotels</h1>
        <p className="mt-1 text-black dark:text-zinc-400">Side-by-side comparison of up to 3 properties.</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-900">
        <table className="w-full min-w-[600px] text-left">
          <thead>
            <tr className="border-b border-black/10 dark:border-zinc-700">
              <th className="p-4 font-semibold text-black dark:text-zinc-100 w-48">Feature</th>
              {hotelsList.map((h) => (
                <th key={h.id} className="p-4 font-semibold text-black dark:text-zinc-100">
                  <Link href={`/hotels/${h.id}`} className="hover:underline">{h.name}</Link>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-b border-black/5 dark:border-zinc-700/50">
                <td className="p-4 text-black dark:text-zinc-400">{row.label}</td>
                {hotelsList.map((h) => (
                  <td key={h.id} className="p-4 text-black dark:text-zinc-300">{String(row.fn(h))}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Link href="/hotels" className="font-medium text-primary hover:underline">Browse all hotels →</Link>
    </div>
  );
}

export default function ComparePage() {
  return (
    <Suspense fallback={<div className="py-12 text-black dark:text-zinc-400">Loading...</div>}>
      <CompareContent />
    </Suspense>
  );
}
