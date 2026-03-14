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
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '100px' }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const isExternalImage = src.includes('images.unsplash.com') || src.includes('res.cloudinary') || src.includes('cloudfront');

  return (
    <div ref={imgRef} className={`relative ${className}`}>
      {!isLoaded && (
        <div className="absolute inset-0 bg-zinc-200 dark:bg-zinc-800 animate-pulse" />
      )}
      {isInView && (
        <Image
          src={src}
          alt={alt}
          fill={fill}
          sizes={sizes}
          className={`object-cover transition-all duration-500 ${
            isLoaded ? 'blur-0 opacity-100' : 'blur-xl opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
          priority={priority}
          unoptimized={!isExternalImage}
        />
      )}
    </div>
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
      .catch(() => {});
  }, [hotel.id, hotel.coupon_discount_value]);

  return (
    // Outer wrapper is position:relative so the FavoriteButton can be positioned absolutely
    // outside the <Link> to avoid invalid nested interactive element HTML.
    <div className="relative group">
      <Link href={`/hotels/${hotel.id}`} className="block">
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:shadow-lg hover:border-black/20 dark:hover:border-zinc-600">
          <div className="relative aspect-[4/3] w-full overflow-hidden">
            <BlurImage
              src={imageUrl}
              alt={hotel.name}
              fill
              sizes="(max-width: 640px) 50vw, 300px"
              className="transition-transform duration-300 group-hover:scale-105"
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
            {lowestPrice ? (
              <p className="mt-3 text-sm">
                <span className="text-zinc-400 line-through dark:text-zinc-500">
                  {formatPrice(lowestPrice.original, lowestPrice.currency)}
                </span>
                {' '}
                <span className="font-bold text-primary">
                  {formatPrice(lowestPrice.discounted, lowestPrice.currency)}
                </span>
                <span className="text-zinc-500 dark:text-zinc-400">/night</span>
                {' '}
                <span className="text-xs font-medium text-primary">
                  ({hotel.coupon_discount_value})
                </span>
              </p>
            ) : (
              <p className="mt-3 font-medium text-primary">
                {hotel.coupon_discount_value}
              </p>
            )}
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
