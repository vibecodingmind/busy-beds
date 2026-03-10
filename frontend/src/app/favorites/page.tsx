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

  if (authLoading || !user) return <div className="py-8">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">My Favorites</h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Hotels you&apos;ve saved for later. Remove by clicking the heart on any hotel card.
      </p>

      {loading ? (
        <p className="mt-8 text-zinc-500">Loading favorites...</p>
      ) : hotels.length === 0 ? (
        <div className="mt-8 rounded-xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-12 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
          <p className="text-zinc-500 dark:text-zinc-400">No favorites yet.</p>
          <Link href="/hotels" className="mt-4 inline-block text-emerald-600 hover:underline dark:text-emerald-400">
            Browse hotels →
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
