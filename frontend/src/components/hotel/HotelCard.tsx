import Link from 'next/link';
import Image from 'next/image';
import type { Hotel } from '@/lib/api';
import FavoriteButton from './FavoriteButton';
import { MapPinIcon, ChevronRightIcon } from '@/components/icons';
import StarRating from '@/components/StarRating';

interface HotelCardProps {
  hotel: Hotel;
  onRemoveFavorite?: () => void; // When on favorites page, remove from list when unfavorited
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80';

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
      <div className="group overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/80 dark:border-zinc-700/80 dark:bg-zinc-900/60 backdrop-blur-sm shadow-sm transition-all hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-600">
        <div className="relative aspect-[4/3] w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={hotel.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, 300px"
            unoptimized={!imageUrl.includes('images.unsplash.com')}
          />
          {/* Discount tag - top left */}
          {discountLabel && (
            <div className="absolute left-2 top-2 z-10 rounded-lg bg-black/70 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
              {discountLabel} off
            </div>
          )}
          <div className="absolute right-2 top-2 z-10">
            <FavoriteButton hotelId={hotel.id} size="sm" onRemove={onRemoveFavorite} />
          </div>
          {/* View Details - bottom right overlay */}
          <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-lg bg-white/90 px-3 py-1.5 text-sm font-medium text-zinc-800 opacity-0 transition-opacity group-hover:opacity-100 dark:bg-zinc-800/90 dark:text-zinc-200">
            View Details
            <ChevronRightIcon />
          </div>
        </div>
        <div className="p-4">
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{hotel.name}</h3>
          {hotel.location && (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              <MapPinIcon className="h-4 w-4 flex-shrink-0 text-zinc-400" />
              <span className="line-clamp-1">{hotel.location}</span>
            </p>
          )}
          {(hotel.avg_rating != null && hotel.review_count != null && hotel.review_count > 0) ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm">
              <StarRating rating={Number(hotel.avg_rating)} size="sm" />
              <span className="text-zinc-600 dark:text-zinc-400">
                {Number(hotel.avg_rating).toFixed(1)} ({hotel.review_count})
              </span>
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
