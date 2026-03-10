import Link from 'next/link';
import Image from 'next/image';
import type { Hotel } from '@/lib/api';

interface HotelCardProps {
  hotel: Hotel;
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80';
const DESC_LIMIT = 49;

function truncate(s: string | null | undefined, len: number): string {
  if (!s) return '';
  return s.length <= len ? s : s.slice(0, len) + '…';
}

export default function HotelCard({ hotel }: HotelCardProps) {
  const imageUrl = hotel.images?.length ? hotel.images[0] : PLACEHOLDER;

  return (
    <Link href={`/hotels/${hotel.id}`}>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md">
        <div className="relative aspect-[16/10] w-full">
          <Image
            src={imageUrl}
            alt={hotel.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 400px"
            unoptimized={!imageUrl.includes('images.unsplash.com')}
          />
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-zinc-900">{hotel.name}</h3>
          <p className="mt-2 text-sm text-zinc-600">{truncate(hotel.description, DESC_LIMIT)}</p>
          {hotel.location && (
            <p className="mt-2 text-sm text-zinc-500">{hotel.location}</p>
          )}
          <p className="mt-3 font-medium text-emerald-600">{hotel.coupon_discount_value}</p>
        </div>
      </div>
    </Link>
  );
}
