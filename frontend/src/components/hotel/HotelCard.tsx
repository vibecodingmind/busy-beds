import Link from 'next/link';
import type { Hotel } from '@/lib/api';

interface HotelCardProps {
  hotel: Hotel;
}

export default function HotelCard({ hotel }: HotelCardProps) {
  return (
    <Link href={`/hotels/${hotel.id}`}>
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md">
        <h3 className="text-lg font-semibold text-zinc-900">{hotel.name}</h3>
        <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{hotel.description}</p>
        {hotel.location && (
          <p className="mt-2 text-sm text-zinc-500">{hotel.location}</p>
        )}
        <p className="mt-3 font-medium text-emerald-600">{hotel.coupon_discount_value}</p>
      </div>
    </Link>
  );
}
