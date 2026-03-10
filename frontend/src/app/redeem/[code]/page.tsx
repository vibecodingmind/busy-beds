'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { coupons } from '@/lib/api';
import { HotelAuthContext } from '@/contexts/HotelAuthContext';
import { useContext } from 'react';

export default function RedeemPage() {
  const params = useParams();
  const code = params.code as string;
  const hotelAuth = useContext(HotelAuthContext);

  const [coupon, setCoupon] = useState<{
    code: string;
    user_name: string;
    hotel_name: string;
    hotel_id: number;
    discount_value: string;
    status: string;
    expires_at: string;
  } | null>(null);
  const [error, setError] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [redeemed, setRedeemed] = useState(false);

  useEffect(() => {
    if (!code) return;
    coupons
      .validate(code)
      .then(setCoupon)
      .catch(() => setError('Coupon not found or invalid'));
  }, [code]);

  const handleRedeem = async () => {
    if (!coupon || !hotelAuth) return;
    setRedeeming(true);
    setError('');
    try {
      await coupons.redeem(code);
      setRedeemed(true);
      setCoupon((c) => (c ? { ...c, status: 'redeemed' } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Redemption failed');
    } finally {
      setRedeeming(false);
    }
  };

  const canRedeem =
    coupon &&
    coupon.status === 'active' &&
    hotelAuth?.hotel &&
    hotelAuth.hotel.id === coupon.hotel_id;

  const wrongHotel =
    coupon &&
    hotelAuth?.hotel &&
    hotelAuth.hotel.id !== coupon.hotel_id;

  if (error && !coupon) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="text-red-600">{error}</p>
        <Link href="/" className="mt-4 inline-block text-emerald-600 hover:underline">
          Go home
        </Link>
      </div>
    );
  }

  if (!coupon) return <div className="py-8">Loading...</div>;

  return (
    <div className="mx-auto max-w-lg">
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900 p-8 shadow-sm">
        <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Coupon Validation</h1>
        <div className="mt-6 space-y-2">
          <p>
            <span className="text-zinc-900 dark:text-zinc-400">Code:</span>{' '}
            <span className="font-mono font-semibold text-zinc-900 dark:text-zinc-100">{coupon.code}</span>
          </p>
          <p>
            <span className="text-zinc-900 dark:text-zinc-400">Guest:</span>{' '}
            <span className="text-zinc-900 dark:text-zinc-100">{coupon.user_name}</span>
          </p>
          <p>
            <span className="text-zinc-900 dark:text-zinc-400">Hotel:</span>{' '}
            <span className="text-zinc-900 dark:text-zinc-100">{coupon.hotel_name}</span>
          </p>
          <p>
            <span className="text-zinc-900 dark:text-zinc-400">Discount:</span>{' '}
            <span className="font-medium text-emerald-600 dark:text-emerald-400">{coupon.discount_value}</span>
          </p>
          <p>
            <span className="text-zinc-900 dark:text-zinc-400">Status:</span>{' '}
            <span
              className={
                coupon.status === 'active'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : coupon.status === 'redeemed'
                    ? 'text-zinc-900 dark:text-zinc-400'
                    : 'text-amber-600 dark:text-amber-400'
              }
            >
              {coupon.status}
            </span>
          </p>
        </div>

        {redeemed && (
          <div className="mt-6 rounded-lg bg-emerald-50 p-4 text-emerald-800">
            Coupon redeemed successfully.
          </div>
        )}

        {!redeemed && (
          <div className="mt-6">
            {!hotelAuth?.hotel ? (
              <div className="rounded-lg bg-amber-50 p-4 text-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
                <p>Log in as the property to redeem this coupon.</p>
                <Link
                  href={`/hotel/login?redirect=/redeem/${code}`}
                  className="mt-2 inline-block font-medium text-amber-900 hover:underline dark:text-amber-100"
                >
                  Property Login →
                </Link>
              </div>
            ) : wrongHotel ? (
              <div className="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900/20 dark:text-red-200">
                This coupon is for <strong>{coupon.hotel_name}</strong>. You are logged in as{' '}
                <strong>{hotelAuth.hotel.name}</strong>. Please log in as the correct property.
              </div>
            ) : canRedeem ? (
              <div>
                {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
                <button
                  onClick={handleRedeem}
                  disabled={redeeming}
                  className="w-full rounded-lg bg-emerald-600 py-3 font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {redeeming ? 'Redeeming...' : 'Redeem Coupon'}
                </button>
              </div>
            ) : (
              <p className="text-zinc-900 dark:text-zinc-400">
                This coupon cannot be redeemed (already used or expired).
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
