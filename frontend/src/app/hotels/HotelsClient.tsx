'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { hotels } from '@/lib/api';
import type { Hotel } from '@/lib/api';
import HotelCard from '@/components/hotel/HotelCard';
import { CardSkeleton } from '@/components/LoadingSkeleton';
import HotelsMapView from '@/components/hotel/HotelsMapView';
import { HouseIcon, MapPinIcon } from '@/components/icons';

export default function HotelsClient() {
  const [hotelList, setHotelList] = useState<Hotel[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<string>('name');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [minRating, setMinRating] = useState<number | undefined>(undefined);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchHotels = () => {
    setLoading(true);
    hotels
      .list({
        search: search || undefined,
        sort: sort || 'name',
        featured: featuredOnly ? true : undefined,
        min_rating: minRating,
        lat: coords?.lat,
        lng: coords?.lng,
      })
      .then((r) => setHotelList(r.hotels))
      .catch(() => setHotelList([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchHotels();
  }, [search, sort, featuredOnly, minRating, coords?.lat, coords?.lng]);

  const handleNearby = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSort('distance');
      },
      () => alert('Could not get your location. Check permissions.'),
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="min-h-screen">
      <div className="rounded-2xl border border-black/10 dark:border-zinc-700/80 bg-white dark:border-zinc-700/80 dark:bg-zinc-900/50 backdrop-blur-xl p-6 mb-6">
        <h1 className="text-2xl font-bold text-black dark:text-zinc-100 flex items-center gap-2">
          <HouseIcon className="h-7 w-7 text-[#FF385C]" />
          Properties
        </h1>
        <p className="mt-2 text-black dark:text-zinc-400">Browse properties and generate discount coupons.</p>

        <div className="mt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
            <input
              type="search"
              placeholder="Search by name, location..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 rounded-xl border border-black/10 dark:border-zinc-700 px-4 py-2.5 bg-white dark:border-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:ring-2 focus:ring-[#FF385C]/30 focus:border-[#FF385C] transition-colors"
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded-xl border border-black/10 dark:border-zinc-700 px-4 py-2.5 bg-white dark:border-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-100"
            >
              <option value="name">Sort by Name</option>
              <option value="location">Sort by Location</option>
              <option value="rating">Sort by Rating</option>
              <option value="distance">Sort by Distance</option>
            </select>
            <button
              type="button"
              onClick={handleNearby}
              className="flex items-center gap-2 rounded-xl border border-black/10 dark:border-zinc-700 px-4 py-2.5 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800 transition-colors"
            >
              <MapPinIcon className="h-4 w-4" />
              Nearby
            </button>
            <div className="flex rounded-xl border border-black/10 dark:border-zinc-700 dark:border-zinc-600 overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`px-4 py-2 text-sm transition-colors ${viewMode === 'grid' ? 'bg-zinc-200 dark:bg-zinc-700 text-black dark:text-zinc-100' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 text-sm transition-colors ${viewMode === 'map' ? 'bg-zinc-200 dark:bg-zinc-700 text-black dark:text-zinc-100' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
              >
                Map
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={featuredOnly}
                onChange={(e) => setFeaturedOnly(e.target.checked)}
                className="h-4 w-4 rounded border-black/20 dark:border-zinc-600"
              />
              <span className="text-sm text-black dark:text-zinc-300">Featured only</span>
            </label>
            <label className="flex items-center gap-2">
              <span className="text-sm text-black dark:text-zinc-300">Min rating:</span>
              <select
                value={minRating ?? ''}
                onChange={(e) => setMinRating(e.target.value ? parseFloat(e.target.value) : undefined)}
                className="rounded-lg border border-black/10 dark:border-zinc-700 px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-100"
              >
                <option value="">Any</option>
                <option value="4">4+ ★</option>
                <option value="3.5">3.5+ ★</option>
                <option value="3">3+ ★</option>
              </select>
            </label>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : viewMode === 'map' ? (
        <div className="rounded-2xl overflow-hidden border border-black/10 dark:border-zinc-700/80 dark:border-zinc-700/80">
          <HotelsMapView hotels={hotelList} />
        </div>
      ) : (
        <>
          {hotelList.some((h) => h.featured) && !featuredOnly && (
            <div className="mb-10">
              <h2 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-200">Featured Properties</h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {hotelList.filter((h) => h.featured).map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            </div>
          )}
          <div className={hotelList.some((h) => h.featured) && !featuredOnly ? 'mt-10' : ''}>
            <h2 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
              {featuredOnly ? 'Featured Properties' : hotelList.some((h) => h.featured) ? 'All Properties' : 'Properties'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {hotelList.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
          </div>
        </>
      )}
      {!loading && hotelList.length === 0 && (
        <p className="py-12 text-center text-zinc-500 dark:text-zinc-400">No properties found.</p>
      )}
    </div>
  );
}
