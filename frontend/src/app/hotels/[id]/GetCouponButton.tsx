'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { coupons } from '@/lib/api';

interface GetCouponButtonProps {
  hotelId: number;
  hotelName: string;
}

export default function GetCouponButton({ hotelId, hotelName }: GetCouponButtonProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!user) {
    return (
      <Link
        href="/login"
        className="inline-flex w-full justify-center rounded-lg bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary-hover"
      >
        Login to get coupon
      </Link>
    );
  }

  const handleClick = async () => {
    setError('');
    setLoading(true);
    try {
      await coupons.generate(hotelId);
      window.location.href = '/my-coupons';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate coupon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        className="w-full rounded-lg bg-primary px-6 py-3 font-medium text-white transition-colors hover:bg-primary-hover disabled:opacity-50"
      >
        {loading ? 'Generating...' : `Get Coupon for ${hotelName}`}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
