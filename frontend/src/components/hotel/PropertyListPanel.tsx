'use client';

import { useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Hotel, MediaItem } from '@/lib/api';
import FavoriteButton from './FavoriteButton';
import { MapPinIcon } from '@/components/icons';

interface PropertyListPanelProps {
  hotels: Hotel[];
  selectedHotelId: number | null;
  onHotelClick: (hotelId: number) => void;
  onLoadMore: () => void;
  hasMore: boolean;
  loading: boolean;
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80';

function getFirstImageUrl(images: string[] | MediaItem[] | undefined): string {
  if (!images || images.length === 0) return PLACEHOLDER;
  const first = images[0];
  if (typeof first === 'string') return first;
  return first.url || PLACEHOLDER;
}

function getDiscountLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.match(/\d+%?/);
  return match ? match[0] : value;
}

function StarIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />
    </svg>
  );
}

export default function PropertyListPanel({
  hotels,
  selectedHotelId,
  onHotelClick,
  onLoadMore,
  hasMore,
  loading,
}: PropertyListPanelProps) {
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const hotelRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  useEffect(() => {
    if (!selectedHotelId) return;
    const element = hotelRefs.current.get(selectedHotelId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [selectedHotelId]);

  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );
    const currentRef = loadMoreRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [hasMore, loading, onLoadMore]);

  if (hotels.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full py-12 text-zinc-500 dark:text-zinc-400">
        <MapPinIcon className="h-12 w-12 mb-4 opacity-50" />
        <p className="text-lg font-medium">No properties found</p>
        <p className="text-sm mt-1">Try adjusting your filters or map area</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-4 space-y-4">
        {hotels.map((hotel) => {
          const imageUrl = getFirstImageUrl(hotel.images);
          const discountLabel = getDiscountLabel(hotel.coupon_discount_value);
          const isSelected = selectedHotelId === hotel.id;

          return (
            <div
              key={hotel.id}
              ref={(el) => {
                if (el) hotelRefs.current.set(hotel.id, el);
              }}
              className={`relative group cursor-pointer transition-all duration-200 ${
                isSelected ? 'ring-2 ring-primary ring-offset-2 dark:ring-offset-zinc-900' : ''
              }`}
              onClick={() => onHotelClick(hotel.id)}
            >
              <Link href={`/hotels/${hotel.id}`} className="block">
                <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-lg hover:border-black/20 dark:hover:border-zinc-600">
                  <div className="flex">
                    <div className="relative w-40 h-32 flex-shrink-0 overflow-hidden rounded-l-2xl">
                      <Image
                        src={imageUrl}
                        alt={hotel.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="160px"
                        unoptimized={!imageUrl.includes('images.unsplash.com')}
                      />
                      {discountLabel && (
                        <div className="absolute left-1 top-1 z-10 rounded-md bg-black/80 px-1.5 py-0.5 text-xs font-medium text-white">
                          {discountLabel}% off
                        </div>
                      )}
                    </div>
                    <div className="flex-1 p-4 min-w-0">
                      <h3 className="text-base font-semibold text-foreground truncate">{hotel.name}</h3>
                      {hotel.location && (
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted truncate">
                          <MapPinIcon className="h-3.5 w-3.5 flex-shrink-0" />
                          <span className="truncate">{hotel.location}</span>
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-1">
                        {hotel.avg_rating != null && hotel.review_count != null && hotel.review_count > 0 ? (
                          <>
                            <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{Number(hotel.avg_rating).toFixed(1)}</span>
                            <span className="text-xs text-muted">({hotel.review_count})</span>
                          </>
                        ) : (
                          <span className="text-xs text-muted">No reviews yet</span>
                        )}
                      </div>
                      <p className="mt-2">
                        <span className="font-bold text-primary">
                          {hotel.coupon_discount_value}
                        </span>
                        {hotel.redemptions_this_month != null && hotel.redemptions_this_month > 0 && (
                          <span className="ml-2 text-xs text-muted">
                            {hotel.redemptions_this_month} redemptions
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
              <div className="absolute right-2 top-2 z-10">
                <FavoriteButton hotelId={hotel.id} size="sm" />
              </div>
            </div>
          );
        })}
      </div>

      <div ref={loadMoreRef} className="p-4">
        {loading && (
          <div className="flex justify-center py-4">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
        {!hasMore && hotels.length > 0 && (
          <p className="text-center text-sm text-muted py-4">No more properties to load</p>
        )}
      </div>
    </div>
  );
}
