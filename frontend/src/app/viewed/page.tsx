'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useRecentlyViewedHotels } from '@/hooks/useRecentlyViewedHotels';
import HotelCard from '@/components/hotel/HotelCard';
import { HouseIcon } from '@/components/icons';

export default function ViewedPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const hotels = useRecentlyViewedHotels();

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  if (authLoading || !user) return <div className="py-12 text-black dark:text-zinc-400">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-zinc-100 flex items-center gap-2">
          <HouseIcon className="h-7 w-7 text-[#FF385C]" />
          Viewed
        </h1>
        <p className="mt-1 text-black dark:text-zinc-400">
          Properties you&apos;ve recently viewed. Pick up where you left off.
        </p>
      </div>

      {hotels.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-black/10 dark:border-zinc-700/80 bg-white dark:border-zinc-700/80 dark:bg-zinc-900/40 p-12 text-center backdrop-blur-sm">
          <p className="text-black dark:text-zinc-400">No recently viewed properties yet.</p>
          <Link href="/hotels" className="mt-4 inline-block font-medium text-[#FF385C] hover:underline">
            Browse properties →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
          {hotels.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>
      )}
    </div>
  );
}
