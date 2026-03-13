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
    // Outer wrapper is position:relative so the FavoriteButton can be positioned absolutely
    // outside the <Link> to avoid invalid nested interactive element HTML.
    <div className="relative group">
      <Link href={`/hotels/${hotel.id}`} className="block">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-lg hover:border-black/20 dark:hover:border-zinc-600">
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <Image
              src={imageUrl}
              alt={hotel.name}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              sizes="(max-width: 640px) 50vw, 300px"
              unoptimized={!imageUrl.includes('images.unsplash.com')}
            />
            {/* Dark gradient overlay for text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent pointer-events-none" />
            {/* Discount tag - top left */}
            {discountLabel && (
              <div className="absolute left-2 top-2 z-10 rounded-lg bg-black/80 px-2 py-1 text-xs font-medium text-white">
                {discountLabel} off
              </div>
            )}
            {/* View Details - bottom right, white text on dark */}
            <div className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-lg bg-black/80 px-3 py-1.5 text-sm font-medium text-white opacity-0 transition-opacity group-hover:opacity-100">
              View Details
              <ChevronRightIcon className="text-white" />
            </div>
          </div>
          <div className="p-4">
            <h3 className="text-base font-semibold text-foreground">{hotel.name}</h3>
            {hotel.location && (
              <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
                <MapPinIcon className="h-4 w-4 flex-shrink-0 text-muted" />
                <span className="line-clamp-1">{hotel.location}</span>
              </p>
            )}
            {(hotel.avg_rating != null && hotel.review_count != null && hotel.review_count > 0) ? (
              <p className="mt-2 flex items-center gap-1.5 text-sm">
                <StarRating rating={Number(hotel.avg_rating)} size="sm" />
                <span className="text-muted">
                  {Number(hotel.avg_rating).toFixed(1)} ({hotel.review_count})
                </span>
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted">No reviews yet</p>
            )}
            {hotel.redemptions_this_month != null && hotel.redemptions_this_month > 0 && (
              <p className="mt-2 text-xs text-muted">
                {hotel.redemptions_this_month} redemption{hotel.redemptions_this_month !== 1 ? 's' : ''} this month
              </p>
            )}
            {hotel.created_at && (
              <p className="mt-1 text-xs text-muted">
                Member since {new Date(hotel.created_at).getFullYear()}
              </p>
            )}
            <p className="mt-3 font-medium text-primary">
              {hotel.coupon_discount_value}
            </p>
          </div>
        </div>
      </Link>
      {/* FavoriteButton lives outside the <Link> to avoid button-inside-anchor (invalid HTML) */}
      <div className="absolute right-2 top-2 z-20 rounded-full bg-black/50 p-1">
        <FavoriteButton hotelId={hotel.id} size="sm" onRemove={onRemoveFavorite} onImage />
      </div>
    </div>
  );
}
