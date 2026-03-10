import Link from 'next/link';
import Image from 'next/image';
import type { Hotel } from '@/lib/api';
import FavoriteButton from './FavoriteButton';

interface HotelCardProps {
  hotel: Hotel;
  onRemoveFavorite?: () => void; // When on favorites page, remove from list when unfavorited
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80';
const DESC_LIMIT = 49;

function truncate(s: string | null | undefined, len: number): string {
  if (!s) return '';
  return s.length <= len ? s : s.slice(0, len) + '…';
}

export default function HotelCard({ hotel, onRemoveFavorite }: HotelCardProps) {
  const imageUrl = hotel.images?.length ? hotel.images[0] : PLACEHOLDER;

  return (
    <Link href={`/hotels/${hotel.id}`}>
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-shadow hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900">
        <div className="relative aspect-[16/10] w-full">
          <div className="absolute right-2 top-2 z-10">
            <FavoriteButton hotelId={hotel.id} size="sm" onRemove={onRemoveFavorite} />
          </div>
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
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{hotel.name}</h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{truncate(hotel.description, DESC_LIMIT)}</p>
          {hotel.location && (
            <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{hotel.location}</p>
          )}
          {(hotel.avg_rating != null && hotel.review_count != null && hotel.review_count > 0) ? (
            <p className="mt-2 text-sm text-amber-600">
              {Number(hotel.avg_rating).toFixed(1)} ★ ({hotel.review_count} reviews)
            </p>
          ) : (
            <p className="mt-2 text-sm text-zinc-400">No reviews yet</p>
          )}
          <p className="mt-3 font-medium text-emerald-600 dark:text-emerald-400">{hotel.coupon_discount_value}</p>
        </div>
      </div>
    </Link>
  );
}
