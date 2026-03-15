"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import type { Hotel, MediaItem } from '@/lib/api';
import { hotels } from '@/lib/api';
import FavoriteButton from './FavoriteButton';
import { MapPinIcon, ChevronRightIcon } from '@/components/icons';
import StarRating from '@/components/StarRating';

interface HotelCardProps {
  hotel: Hotel;
  onRemoveFavorite?: () => void;
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&q=80';

function getFirstImageUrl(images: string[] | MediaItem[] | undefined): string {
  if (!images || images.length === 0) return PLACEHOLDER;
  const first = images[0];
  if (typeof first === 'string') return first;
  return first.url || PLACEHOLDER;
}

function BlurImage({
  src,
  alt,
  fill,
  sizes,
  className,
  priority,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      className={`object-cover bg-zinc-200 dark:bg-zinc-800 ${className || ''}`}
      priority={priority}
      unoptimized={src.startsWith('http')}
    />
  );
}

// Parse discount value for display (e.g. "10% off" -> "10%")
function getDiscountLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  const match = value.match(/\d+%?/);
  return match ? match[0] : value;
}

// Parse discount percent (e.g. "15% off" -> 15, "$50 off" -> 0)
function getDiscountPercent(value: string | null | undefined): number {
  if (!value) return 0;
  const match = value.match(/(\d+)%/);
  return match ? parseInt(match[1], 10) : 0;
}

function formatPrice(price: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
}

export default function HotelCard({ hotel, onRemoveFavorite }: HotelCardProps) {
  const imageUrl = getFirstImageUrl(hotel.images);
  const discountLabel = getDiscountLabel(hotel.coupon_discount_value);
  const [lowestPrice, setLowestPrice] = useState<{ original: number; discounted: number; currency: string } | null>(null);

  useEffect(() => {
    hotels
      .rooms(hotel.id)
      .then((r) => {
        if (r.rooms.length > 0) {
          const discountPercent = getDiscountPercent(hotel.coupon_discount_value);
          const prices = r.rooms.map((room) => ({
            original: room.base_price,
            discounted: room.base_price * (1 - discountPercent / 100),
            currency: room.currency,
          }));
          const lowest = prices.reduce((a, b) => (a.discounted < b.discounted ? a : b));
          setLowestPrice(lowest);
        }
      })
      .catch(() => { });
  }, [hotel.id, hotel.coupon_discount_value]);

  return (
    // Outer wrapper is position:relative so the FavoriteButton can be positioned absolutely
    // outside the <Link> to avoid invalid nested interactive element HTML.
    <div className="relative group/card h-full">
      <Link href={`/hotels/${hotel.id}`} className="block h-full">
        <div className="flex flex-col h-full overflow-hidden rounded-[1.5rem] border border-black/5 dark:border-white/5 bg-white dark:bg-zinc-900 shadow-sm transition-all duration-500 hover:shadow-[0_20px_40px_-12px_rgba(0,0,0,0.12)] hover:-translate-y-1 group-hover/card:border-primary/20">
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <BlurImage
              src={imageUrl}
              alt={hotel.name}
              fill
              sizes="(max-width: 640px) 50vw, 300px"
              className="transition-transform duration-700 ease-out group-hover/card:scale-110"
            />
            {/* Immersive overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 transition-opacity duration-500 group-hover/card:opacity-80" />

            {/* Tags overlay - Clean and minimal */}
            {(hotel.featured || discountLabel) && (
              <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
                {hotel.featured && (
                  <div className="rounded-full bg-amber-500/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm border border-white/20">
                    Featured
                  </div>
                )}
                {discountLabel && (
                  <div className="rounded-full bg-emerald-500/90 backdrop-blur-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm border border-white/20">
                    {discountLabel} OFF
                  </div>
                )}
              </div>
            )}

            {/* Quick action hint */}
            <div className="absolute bottom-3 right-3 z-10 translate-y-2 opacity-0 transition-all duration-300 group-hover/card:translate-y-0 group-hover/card:opacity-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                <ChevronRightIcon className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="flex flex-col flex-1 p-4 bg-white dark:bg-zinc-900">
            <div className="flex justify-between items-start gap-2">
              <h3 className="text-base font-bold text-foreground tracking-tight group-hover/card:text-emerald-600 dark:group-hover/card:text-emerald-400 transition-colors line-clamp-1">{hotel.name}</h3>
              {lowestPrice && (
                <div className="flex flex-col items-end shrink-0">
                  <div className="text-lg font-extrabold text-foreground leading-none">
                    {formatPrice(lowestPrice.discounted, lowestPrice.currency)}
                  </div>
                  <div className="text-[10px] text-muted font-medium mt-0.5">
                    per {hotel.price_type || 'day'}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
              <MapPinIcon className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span className="line-clamp-1 font-medium italic">{hotel.location?.split(',')[0]}</span>
            </div>

            {/* Dynamic visual indicator for reviews and popularity */}
            <div className="mt-4 pt-4 border-t border-border/50 flex items-center justify-between gap-4">
              <div className="flex flex-col gap-1">
                {(hotel.avg_rating != null && hotel.review_count != null && hotel.review_count > 0) ? (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-0.5">
                      <StarRating rating={1} size="xs" />
                      <span className="text-xs font-bold text-foreground">{Number(hotel.avg_rating).toFixed(1)}</span>
                    </div>
                    <div className="h-3.5 w-px bg-border/50" />
                    <span className="text-[11px] text-muted font-medium tracking-tight">
                      {hotel.review_count} {hotel.review_count === 1 ? 'Review' : 'Reviews'}
                    </span>
                  </div>
                ) : (
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">New Property</span>
                )}
              </div>

              {lowestPrice && lowestPrice.original > lowestPrice.discounted && (
                <div className="flex flex-col items-end">
                  <div className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-600/10 px-2 py-0.5 rounded-md">
                    SAVE {Math.round(((lowestPrice.original - lowestPrice.discounted) / lowestPrice.original) * 100)}%
                  </div>
                  <div className="text-[10px] text-muted line-through mt-0.5">
                    {formatPrice(lowestPrice.original, lowestPrice.currency)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Link>
      <div className="absolute right-3 top-3 z-20">
        <FavoriteButton hotelId={hotel.id} size="sm" onRemove={onRemoveFavorite} onImage />
      </div>
    </div>
  );
}
