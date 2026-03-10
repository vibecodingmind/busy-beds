'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { admin } from '@/lib/api';

export default function AdminCouponsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [coupons, setCoupons] = useState<
    { code: string; user_name: string; hotel_name: string; status: string; created_at: string }[]
  >([]);

  useEffect(() => {
    if (!authLoading && (!user || user.role !== 'admin')) router.push('/');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user || user.role !== 'admin') return;
    admin.coupons().then((r) => setCoupons(r.coupons)).catch(() => {});
  }, [user]);

  if (authLoading || !user || user.role !== 'admin') return <div className="py-8">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Coupons</h1>
      <div className="mt-8 overflow-x-auto rounded-lg border border-zinc-200">
        <table className="min-w-full divide-y divide-zinc-200">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-4 py-2 text-left text-sm font-medium text-zinc-900">Code</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-zinc-900">User</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-zinc-900">Hotel</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-zinc-900">Status</th>
              <th className="px-4 py-2 text-left text-sm font-medium text-zinc-900">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 bg-white">
            {coupons.map((c) => (
              <tr key={c.code + c.created_at}>
                <td className="px-4 py-2 font-mono text-sm">{c.code}</td>
                <td className="px-4 py-2 text-sm">{c.user_name}</td>
                <td className="px-4 py-2 text-sm">{c.hotel_name}</td>
                <td className="px-4 py-2">
                  <span
                    className={`rounded px-2 py-0.5 text-xs ${
                      c.status === 'active'
                        ? 'bg-emerald-100 text-emerald-800'
                        : c.status === 'redeemed'
                          ? 'bg-zinc-200 text-zinc-700'
                          : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    {c.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-sm text-zinc-900">
                  {new Date(c.created_at).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
