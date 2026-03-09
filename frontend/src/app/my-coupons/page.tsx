'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { coupons } from '@/lib/api';
import CouponQRCard from '@/components/coupon/CouponQRCard';

export default function MyCouponsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [couponList, setCouponList] = useState<
    { id: number; code: string; hotel_name: string; discount_value: string; status: string; expires_at: string }[]
  >([]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    coupons.list().then((r) => setCouponList(r.coupons)).catch(() => {});
  }, [user]);

  if (authLoading || !user) return <div className="py-8">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900">My Coupons</h1>
      <p className="mt-2 text-zinc-600">Show the QR code at the hotel to redeem your discount.</p>
      <div className="mt-8 space-y-6">
        {couponList.map((c) => (
          <CouponQRCard
            key={c.id}
            code={c.code}
            hotelName={c.hotel_name}
            discountValue={c.discount_value}
            expiresAt={c.expires_at}
            status={c.status}
          />
        ))}
      </div>
      {couponList.length === 0 && (
        <p className="mt-8 text-center text-zinc-500">No coupons yet. Get one from a hotel!</p>
      )}
    </div>
  );
}
