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

            {/* Top badges */}
            <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
              {discountLabel && (
                <div className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                  {discountLabel} OFF
                </div>
              )}
              {hotel.featured && (
                <div className="rounded-full bg-amber-500 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-lg">
                  Featured
                </div>
              )}
            </div>

            {/* Price tag on image */}
            {lowestPrice && (
              <div className="absolute bottom-3 left-3 z-10">
                <div className="rounded-xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md px-3 py-1.5 shadow-sm">
                  <span className="text-xs text-muted line-through mr-1 opacity-70">
                    {formatPrice(lowestPrice.original, lowestPrice.currency)}
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {formatPrice(lowestPrice.discounted, lowestPrice.currency)}
                  </span>
                  <span className="text-[10px] text-muted ml-0.5">/nt</span>
                </div>
              </div>
            )}

            {/* Quick action hint */}
            <div className="absolute bottom-3 right-3 z-10 translate-y-2 opacity-0 transition-all duration-300 group-hover/card:translate-y-0 group-hover/card:opacity-100">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white shadow-lg">
                <ChevronRightIcon className="h-4 w-4" />
              </div>
            </div>
          </div>

          <div className="flex flex-col flex-1 p-4">
            <h3 className="text-base font-bold text-foreground tracking-tight group-hover/card:text-primary transition-colors line-clamp-1">{hotel.name}</h3>

            <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
              <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-muted/50">
                <MapPinIcon className="h-3.5 w-3.5" />
              </div>
              <span className="line-clamp-1 font-medium">{hotel.location?.split(',')[0]}</span>
            </div>

            <div className="mt-auto pt-4 flex items-center justify-between border-t border-border/50">
              {(hotel.avg_rating != null && hotel.review_count != null && hotel.review_count > 0) ? (
                <div className="flex items-center gap-1">
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <StarRating key={s} rating={Number(hotel.avg_rating) >= s ? 1 : 0} size="xs" />
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-foreground ml-1">{Number(hotel.avg_rating).toFixed(1)}</span>
                  <span className="text-[10px] text-muted">({hotel.review_count})</span>
                </div>
              ) : (
                <span className="text-[10px] font-medium text-muted uppercase tracking-tighter">New Property</span>
              )}

              {hotel.redemptions_this_month != null && hotel.redemptions_this_month > 0 && (
                <div className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  🔥 Popular
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
