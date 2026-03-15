'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { favorites } from '@/lib/api';
import type { Hotel } from '@/lib/api';
import HotelCard from '@/components/hotel/HotelCard';

export default function FavoritesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [user, authLoading, router]);

  useEffect(() => {
    if (!user) return;
    favorites
      .hotels()
      .then((r) => setHotels(r.hotels))
      .catch(() => setHotels([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (authLoading || !user) return <div className="p-8 text-muted">Loading...</div>;

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header Breadcrumb */}
      <div className="flex items-center justify-between border-b border-border px-8 py-5 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted">Settings</span>
          <span className="text-zinc-300 dark:text-zinc-600">/</span>
          <span className="font-medium text-foreground flex items-center gap-1.5">
            <svg className="w-4 h-4" fill="none" strokeWidth={2} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
            </svg>
            Favorites
          </span>
        </div>
      </div>

      <div className="p-8 space-y-8 flex-1">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Favorites</h1>
          <p className="mt-1 text-muted">Properties you've saved for later.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-pulse flex flex-col items-center">
              <div className="h-12 w-12 bg-zinc-200 dark:bg-zinc-800 rounded-full mb-4"></div>
              <div className="h-4 w-32 bg-zinc-200 dark:bg-zinc-800 rounded"></div>
            </div>
          </div>
        ) : hotels.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-black/[0.01] dark:bg-white/[0.01] p-16 text-center">
            <p className="text-muted">No favorites yet.</p>
            <Link href="/hotels" className="mt-4 inline-block font-medium text-primary hover:underline">
              Browse properties →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {hotels.map((hotel) => (
              <HotelCard
                key={hotel.id}
                hotel={hotel}
                onRemoveFavorite={() => setHotels((prev) => prev.filter((h) => h.id !== hotel.id))}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
