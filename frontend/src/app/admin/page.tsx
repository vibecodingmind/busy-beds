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
  }, [user]);

  if (authLoading || !user || user.role !== 'admin') return <div className="py-8">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">Admin Dashboard</h1>
      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        <Link href="/admin/hotels">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md">
            <h3 className="font-semibold text-zinc-900">Hotels</h3>
            <p className="mt-2 text-3xl font-bold text-zinc-900">{counts?.hotels ?? '-'}</p>
          </div>
        </Link>
        <Link href="/admin/users">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md">
            <h3 className="font-semibold text-zinc-900">Users</h3>
            <p className="mt-2 text-3xl font-bold text-zinc-900">{counts?.users ?? '-'}</p>
          </div>
        </Link>
        <Link href="/admin/coupons">
          <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm hover:shadow-md">
            <h3 className="font-semibold text-zinc-900">Coupons</h3>
            <p className="mt-2 text-3xl font-bold text-zinc-900">{counts?.coupons ?? '-'}</p>
          </div>
        </Link>
        <Link href="/admin/hotel-accounts">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 shadow-sm hover:shadow-md">
            <h3 className="font-semibold text-zinc-900">Pending Hotel Approvals</h3>
            <p className="mt-2 text-3xl font-bold text-amber-700">{counts?.pending ?? '-'}</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
