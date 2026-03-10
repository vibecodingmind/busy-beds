import Link from 'next/link';
import Image from 'next/image';
import type { Hotel } from '@/lib/api';

interface HotelCardProps {
  hotel: Hotel;
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80';

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
          <p className="mt-2 line-clamp-2 text-sm text-zinc-600">{hotel.description}</p>
          {hotel.location && (
            <p className="mt-2 text-sm text-zinc-500">{hotel.location}</p>
          )}
          <p className="mt-3 font-medium text-emerald-600">{hotel.coupon_discount_value}</p>
        </div>
      </div>
    </Link>
  );
}
