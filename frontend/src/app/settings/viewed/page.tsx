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

  if (authLoading || !user) return <div className="p-8 text-black dark:text-zinc-400">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header Breadcrumb */}
      <div className="flex items-center justify-between border-b border-border px-8 py-5 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted">Settings</span>
          <span className="text-zinc-300 dark:text-zinc-600">/</span>
          <span className="font-medium text-foreground flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recently Viewed
          </span>
        </div>
      </div>

      <div className="p-8 space-y-8 flex-1">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Recently Viewed</h1>
          <p className="mt-1 text-muted">Pick up where you left off.</p>
        </div>

        {hotels.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-black/[0.01] dark:bg-white/[0.01] p-16 text-center">
            <p className="text-muted">No recently viewed properties yet.</p>
            <Link href="/hotels" className="mt-4 inline-block font-medium text-primary hover:underline">
              Browse properties →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {hotels.map((hotel) => (
              <HotelCard key={hotel.id} hotel={hotel} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
