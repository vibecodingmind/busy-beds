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

// Parse discount value for display (e.g. "10% off" -> "10%")
function getDiscountLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.match(/\d+%?/);
  return match ? match[0] : value;
}

export default function HotelCard({ hotel, onRemoveFavorite }: HotelCardProps) {
  const imageUrl = hotel.images?.length ? hotel.images[0] : PLACEHOLDER;
  const discountLabel = getDiscountLabel(hotel.coupon_discount_value);

  return (
    <Link href={`/hotels/${hotel.id}`}>
      <div className="group overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition-all hover:shadow-md dark:border-zinc-700 dark:bg-zinc-900">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={hotel.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 300px"
            unoptimized={!imageUrl.includes('images.unsplash.com')}
          />
          {/* Discount tag - top left */}
          {discountLabel && (
            <div className="absolute left-2 top-2 z-10 rounded-md bg-black/70 px-2 py-1 text-xs font-medium text-white">
              {discountLabel} off
            </div>
          )}
          <div className="absolute right-2 top-2 z-10">
            <FavoriteButton hotelId={hotel.id} size="sm" onRemove={onRemoveFavorite} />
          </div>
          {/* View Details - bottom right overlay */}
          <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-md bg-white/90 px-3 py-1.5 text-sm font-medium text-zinc-800 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-zinc-800/90 dark:text-zinc-200">
            View Details
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{hotel.name}</h3>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            {truncate(hotel.description, DESC_LIMIT)}
          </p>
          {hotel.location && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              <svg className="h-4 w-4 flex-shrink-0 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              </svg>
              {hotel.location}
            </p>
          )}
          {(hotel.avg_rating != null && hotel.review_count != null && hotel.review_count > 0) ? (
            <p className="mt-2 text-sm text-amber-600 dark:text-amber-500">
              ★ {Number(hotel.avg_rating).toFixed(1)} ({hotel.review_count} reviews)
            </p>
          ) : (
            <p className="mt-2 text-sm text-zinc-400 dark:text-zinc-500">No reviews yet</p>
          )}
          <p className="mt-3 font-medium text-[#FF385C] dark:text-[#ff6b81]">
            {hotel.coupon_discount_value}
          </p>
        </div>
      </div>
    </Link>
  );
}
