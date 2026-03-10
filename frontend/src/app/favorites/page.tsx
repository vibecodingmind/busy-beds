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

  if (authLoading || !user) return <div className="py-12 text-black dark:text-zinc-400">Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-black dark:text-zinc-100">Favourites</h1>
        <p className="mt-1 text-black dark:text-zinc-400">
          Properties you&apos;ve saved for later. Remove by clicking the heart on any property card.
        </p>
      </div>

      {loading ? (
        <p className="text-black dark:text-zinc-400">Loading favourites...</p>
      ) : hotels.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-zinc-200/80 bg-white dark:border-zinc-700/80 dark:bg-zinc-900/40 border-2 border-zinc-200/80 p-12 text-center backdrop-blur-sm">
          <p className="text-black dark:text-zinc-400">No favourites yet.</p>
          <Link href="/hotels" className="mt-4 inline-block font-medium text-[#FF385C] hover:underline">
            Browse properties →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
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
  );
}
