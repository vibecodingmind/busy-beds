'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { admin } from '@/lib/api';
import type { AdminHotel } from '@/lib/api';

export default function AdminHotelsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [hotels, setHotels] = useState<AdminHotel[]>([]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, authLoading, router]);

  const fetchHotels = () => {
    if (!user || user.role !== 'admin') return;
    admin.hotels.list().then((r) => setHotels(r.hotels)).catch(() => {});
  };

  useEffect(() => {
    fetchHotels();
  }, [user]);

  const handleDelete = async (h: AdminHotel) => {
    if (!confirm(`Delete "${h.name}"? This cannot be undone.`)) return;
    try {
      await admin.hotels.delete(h.id);
      setHotels((prev) => prev.filter((x) => x.id !== h.id));
    } catch {
      alert('Failed to delete hotel');
    }
  };

  if (authLoading || !user || user.role !== 'admin') return <div className="py-8">Loading...</div>;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black dark:text-zinc-100">Manage Hotels</h1>
        <Link
          href="/admin/hotels/new"
          className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700"
        >
          Add Hotel
        </Link>
      </div>
      <div className="mt-8 overflow-x-auto rounded-lg border border-black/10 dark:border-zinc-700">
        <table className="min-w-full divide-y divide-zinc-200 dark:divide-zinc-700">
          <thead className="bg-white dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-black dark:text-zinc-100">Name</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-black dark:text-zinc-100">Location</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-black dark:text-zinc-100">Status</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-black dark:text-zinc-100">Managed by</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-black dark:text-zinc-100">Discount</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-black dark:text-zinc-100">Limit</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-black dark:text-zinc-100">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white dark:divide-zinc-700 dark:bg-zinc-900">
            {hotels.map((h) => (
              <tr key={h.id}>
                <td className="px-4 py-2 font-medium text-black dark:text-zinc-100">{h.name}</td>
                <td className="px-4 py-2 text-sm text-black dark:text-zinc-400">{h.location ?? '-'}</td>
                <td className="px-4 py-2">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${h.active !== false ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-600 dark:text-zinc-200'}`}>
                    {h.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-black dark:text-zinc-400" title={h.managing_account ? `${h.managing_account.name} (${h.managing_account.approved ? 'Approved' : 'Pending'})` : undefined}>
                  {h.managing_account ? h.managing_account.email : '—'}
                </td>
                <td className="px-4 py-2 text-sm text-black dark:text-zinc-400">{h.coupon_discount_value}</td>
                <td className="px-4 py-2 text-sm text-black dark:text-zinc-400">{h.coupon_limit} / {h.limit_period}</td>
                <td className="px-4 py-2 flex items-center gap-3">
                  <Link
                    href={`/admin/hotels/${h.id}`}
                    className="text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleDelete(h)}
                    className="text-red-600 hover:underline dark:text-red-400"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
