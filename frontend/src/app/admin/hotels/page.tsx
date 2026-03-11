'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { admin } from '@/lib/api';
import type { Hotel } from '@/lib/api';

export default function AdminHotelsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [hotels, setHotels] = useState<Hotel[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    admin.hotels.list().then((r) => setHotels(r.hotels)).catch(() => {});
  }, [user]);

  if (authLoading || !user || user.role !== 'admin') return <div className="py-8">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">Manage Hotels</h1>
        <Link
          href="/admin/hotels/new"
          className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
        >
          Add Hotel
        </Link>
      </div>
      <div className="mt-8 overflow-x-auto rounded-lg border border-black/10 dark:border-zinc-700">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-white">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-black">Name</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-black">Location</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-black">Discount</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-black">Limit</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-black">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {hotels.map((h) => (
              <tr key={h.id}>
                <td className="px-4 py-2 font-medium">{h.name}</td>
                <td className="px-4 py-2 text-sm text-black">{h.location ?? '-'}</td>
                <td className="px-4 py-2 text-sm">{h.coupon_discount_value}</td>
                <td className="px-4 py-2 text-sm">{h.coupon_limit} / {h.limit_period}</td>
                <td className="px-4 py-2">
                  <Link
                    href={`/admin/hotels/${h.id}`}
                    className="text-emerald-600 hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
