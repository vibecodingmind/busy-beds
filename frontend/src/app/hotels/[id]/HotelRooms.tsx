'use client';

import { useState, useEffect } from 'react';
import { hotels } from '@/lib/api';
import type { HotelRoom } from '@/lib/api';

interface HotelRoomsProps {
  hotelId: number;
  discountValue: string;
}

function parseDiscountPercent(value: string): number {
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

export default function HotelRooms({ hotelId, discountValue }: HotelRoomsProps) {
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hotels
      .rooms(hotelId)
      .then((r) => setRooms(r.rooms))
      .catch(() => setRooms([]))
      .finally(() => setLoading(false));
  }, [hotelId]);

  const discountPercent = parseDiscountPercent(discountValue);

  if (loading) {
    return (
      <div className="mt-8 animate-pulse">
        <div className="h-6 w-48 rounded bg-zinc-200 dark:bg-zinc-700"></div>
        <div className="mt-4 space-y-3">
          <div className="h-20 rounded bg-zinc-200 dark:bg-zinc-700"></div>
          <div className="h-20 rounded bg-zinc-200 dark:bg-zinc-700"></div>
        </div>
      </div>
    );
  }

  if (rooms.length === 0) {
    return null;
  }

  return (
    <div className="mt-8">
      <h2 className="text-xl font-bold text-black dark:text-zinc-100">Available Rooms</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        All prices shown with your {discountPercent}% member discount
      </p>

      <div className="mt-4 space-y-3">
        {rooms.map((room) => {
          const discountedPrice = room.base_price * (1 - discountPercent / 100);

          return (
            <div
              key={room.id}
              className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-800 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-black dark:text-zinc-100">{room.room_type}</h3>
                {room.description && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{room.description}</p>
                )}
                {room.amenities && room.amenities.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {room.amenities.map((amenity, idx) => (
                      <span
                        key={idx}
                        className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-baseline gap-3 text-right">
                {discountPercent > 0 && (
                  <span className="text-sm text-zinc-400 line-through dark:text-zinc-500">
                    {formatPrice(room.base_price, room.currency)}
                  </span>
                )}
                <span className="text-xl font-bold text-primary">
                  {discountPercent > 0
                    ? formatPrice(discountedPrice, room.currency)
                    : formatPrice(room.base_price, room.currency)}
                </span>
                <span className="text-sm text-zinc-500 dark:text-zinc-400">/night</span>
              </div>
            </div>
          );
        })}
      </div>

      {discountPercent > 0 && (
        <p className="mt-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
          💰 You save up to {discountPercent}% with your membership coupon!
        </p>
      )}
    </div>
  );
}
