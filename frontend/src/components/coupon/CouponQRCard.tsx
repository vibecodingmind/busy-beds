'use client';

import { QRCodeSVG } from 'qrcode.react';

interface CouponQRCardProps {
  id?: number;
  code: string;
  hotelName: string;
  discountValue: string;
  expiresAt: string;
  status: string;
  onCancel?: (id: number) => void;
}

export default function CouponQRCard({
  id,
  code,
  hotelName,
  discountValue,
  expiresAt,
  status,
  onCancel,
}: CouponQRCardProps) {
  const redeemUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/redeem/${code}`
      : `https://example.com/redeem/${code}`;

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
        <div className="rounded-lg border border-zinc-200 bg-white p-3">
          <QRCodeSVG value={redeemUrl} size={160} level="M" />
        </div>
        <div className="flex-1 text-center sm:text-left">
          <p className="font-mono text-lg font-bold text-zinc-900">{code}</p>
          <p className="mt-1 text-zinc-600">{hotelName}</p>
          <p className="mt-1 font-medium text-emerald-600">{discountValue}</p>
          <p className="mt-1 text-sm text-zinc-500">
            Expires: {new Date(expiresAt).toLocaleDateString()}
          </p>
          <span
            className={`mt-2 inline-block rounded-full px-3 py-0.5 text-xs font-medium ${
              status === 'active'
                ? 'bg-emerald-100 text-emerald-800'
                : status === 'redeemed'
                  ? 'bg-zinc-200 text-zinc-700'
                  : status === 'cancelled'
                    ? 'bg-red-100 text-red-800'
                    : 'bg-amber-100 text-amber-800'
            }`}
          >
            {status}
          </span>
          {status === 'active' && id !== undefined && onCancel && (
            <button
              onClick={() => onCancel(id)}
              className="mt-2 rounded border border-red-200 bg-white px-2 py-1 text-xs text-red-600 hover:bg-red-50"
            >
              Cancel coupon
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
