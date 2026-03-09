'use client';

import { QRCodeSVG } from 'qrcode.react';

interface CouponQRCardProps {
  code: string;
  hotelName: string;
  discountValue: string;
  expiresAt: string;
  status: string;
}

export default function CouponQRCard({
  code,
  hotelName,
  discountValue,
  expiresAt,
  status,
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
                  : 'bg-amber-100 text-amber-800'
            }`}
          >
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}
