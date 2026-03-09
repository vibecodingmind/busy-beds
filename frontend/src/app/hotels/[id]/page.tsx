import Link from 'next/link';
import { hotels } from '@/lib/api';
import GetCouponButton from './GetCouponButton';

export const dynamic = 'force-dynamic';

export default async function HotelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  let hotel: { id: number; name: string; description: string | null; location: string | null; contact_phone: string | null; contact_email: string | null; images: string[]; coupon_discount_value: string; coupon_limit: number; limit_period: string } | null = null;
  try {
    hotel = await hotels.get(parseInt(id));
  } catch {
    hotel = null;
  }

  if (!hotel) {
    return (
      <div>
        <p className="text-zinc-600">Hotel not found.</p>
        <Link href="/hotels" className="mt-4 text-emerald-600 hover:underline">
          Back to hotels
        </Link>
      </div>
    );
  }

  return (
    <div>
      <Link href="/hotels" className="text-sm text-emerald-600 hover:underline">
        ← Back to hotels
      </Link>
      <div className="mt-6 rounded-xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-zinc-900">{hotel.name}</h1>
        {hotel.description && (
          <p className="mt-4 text-zinc-600">{hotel.description}</p>
        )}
        {hotel.location && (
          <p className="mt-2 text-zinc-500">{hotel.location}</p>
        )}
        <p className="mt-4 font-semibold text-emerald-600">
          Coupon discount: {hotel.coupon_discount_value}
        </p>
        <div className="mt-8">
          <GetCouponButton hotelId={hotel.id} hotelName={hotel.name} />
        </div>
      </div>
    </div>
  );
}
