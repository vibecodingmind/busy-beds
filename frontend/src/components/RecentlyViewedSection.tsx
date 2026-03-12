'use client';

import Link from 'next/link';
import { useRecentlyViewedHotels } from '@/hooks/useRecentlyViewedHotels';
import HotelCard from '@/components/hotel/HotelCard';

export default function RecentlyViewedSection() {
  const list = useRecentlyViewedHotels();
  if (list.length === 0) return null;

  return (
    <section className="mt-16">
      <h2 className="text-2xl font-semibold text-black dark:text-white">
        Continue where you left off
      </h2>
      <p className="mt-1 text-black dark:text-zinc-400">
        Recently viewed properties
      </p>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
        {list.slice(0, 6).map((hotel) => (
          <HotelCard key={hotel.id} hotel={hotel} />
        ))}
      </div>
      <div className="mt-4">
        <Link href="/hotels" className="font-medium text-[#FF385C] hover:underline">
          View all properties →
        </Link>
      </div>
    </section>
  );
}
