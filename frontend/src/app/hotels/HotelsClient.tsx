'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { hotels } from '@/lib/api';
import type { Hotel } from '@/lib/api';
import HotelCard from '@/components/hotel/HotelCard';
import { CardSkeleton } from '@/components/LoadingSkeleton';
import SplitMapView from '@/components/hotel/SplitMapView';
import PropertyListPanel from '@/components/hotel/PropertyListPanel';
import FilterBar, { FilterState } from '@/components/hotel/FilterBar';
import { HouseIcon, MapPinIcon } from '@/components/icons';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/contexts/ToastContext';

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface LocationData {
  countries: string[];
  regions: { country: string; region: string }[];
  cities: { country: string; region: string | null; city: string }[];
}

const INITIAL_FILTERS: FilterState = {
  search: '',
  country: '',
  region: '',
  city: '',
  minPrice: undefined,
  maxPrice: undefined,
  minRating: undefined,
  amenities: [],
  hasDiscount: false,
};

function HotelsClientInner() {
  const searchParams = useSearchParams();
  const nearme = searchParams.get('nearme') === '1';
  const toast = useToast();

  const [displayedHotels, setDisplayedHotels] = useState<Hotel[]>([]);
  const [viewMode, setViewMode] = useState<'split' | 'list' | 'map'>('split');
  const [mobileMapOpen, setMobileMapOpen] = useState(false);

  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [sort, setSort] = useState<string>(nearme ? 'distance' : 'name');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [locationData, setLocationData] = useState<LocationData | undefined>(undefined);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);

  const debouncedSearch = useDebounce(filters.search, 300);
  const debouncedBounds = useDebounce(bounds, 500);

  // Load location data for filter dropdowns
  useEffect(() => {
    hotels.locations().then(setLocationData).catch(() => {});
  }, []);

  const fetchHotels = useCallback(async (reset = false) => {
    const currentOffset = reset ? 0 : offset;
    if (reset) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await hotels.list({
        search: debouncedSearch || undefined,
        sort: sort || 'name',
        lat: coords?.lat,
        lng: coords?.lng,
        north: debouncedBounds?.north,
        south: debouncedBounds?.south,
        east: debouncedBounds?.east,
        west: debouncedBounds?.west,
        min_price: filters.minPrice,
        max_price: filters.maxPrice,
        min_rating: filters.minRating,
        amenities: filters.amenities.length > 0 ? filters.amenities : undefined,
        has_discount: filters.hasDiscount || undefined,
        country: filters.country || undefined,
        region: filters.region || undefined,
        city: filters.city || undefined,
        limit: 20,
        offset: currentOffset,
      });

      if (reset) {
        setDisplayedHotels(result.hotels);
        setOffset(20);
      } else {
        setDisplayedHotels((prev) => [...prev, ...result.hotels]);
        setOffset((prev) => prev + 20);
      }

      setHasMore(result.hotels.length === 20);
    } catch (err) {
      console.error('Failed to fetch hotels:', err);
      if (reset) setDisplayedHotels([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [debouncedSearch, sort, coords, debouncedBounds, filters, offset]);

  useEffect(() => {
    fetchHotels(true);
  }, [debouncedSearch, sort, coords, debouncedBounds, filters.minPrice, filters.maxPrice, filters.minRating, filters.hasDiscount, filters.amenities, filters.country, filters.region, filters.city]);

  useEffect(() => {
    if (nearme && navigator.geolocation && !coords) {
      setViewMode('split');
      setSort('distance');
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {},
        { enableHighAccuracy: true }
      );
    }
  }, [nearme, coords]);

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) fetchHotels(false);
  }, [loadingMore, hasMore, fetchHotels]);

  const handleBoundsChange = useCallback((newBounds: MapBounds) => {
    setBounds(newBounds);
  }, []);

  const handleMarkerClick = useCallback((hotelId: number) => {
    setSelectedHotelId(hotelId);
  }, []);

  const handleListHotelClick = useCallback((hotelId: number) => {
    setSelectedHotelId(hotelId);
  }, []);

  const handleResetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
    setSort('name');
    setBounds(null);
  }, []);

  const handleNearby = useCallback(() => {
    if (!navigator.geolocation) {
      toast('Geolocation is not supported by your browser.', 'error');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setSort('distance');
      },
      () => toast('Could not get your location. Check permissions.', 'error'),
      { enableHighAccuracy: true }
    );
  }, [toast]);

  const toggleMobileMap = useCallback(() => {
    setMobileMapOpen((prev) => !prev);
  }, []);

  const locationBreadcrumb = [filters.country, filters.region, filters.city].filter(Boolean).join(' › ');

  return (
    <div className="min-h-screen">
      {/* Header card */}
      <div className="rounded-2xl border border-black/10 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/50 backdrop-blur-xl p-6 mb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-black dark:text-zinc-100 flex items-center gap-2">
              <HouseIcon className="h-7 w-7 text-primary" />
              Properties
            </h1>
            {locationBreadcrumb && (
              <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{locationBreadcrumb}</p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {/* View mode toggle */}
            <div className="hidden md:flex rounded-xl border border-black/10 dark:border-zinc-700 overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode('list')}
                className={`px-4 py-2 text-sm transition-colors flex items-center gap-2 ${viewMode === 'list' ? 'bg-zinc-200 dark:bg-zinc-700 text-black dark:text-zinc-100' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'}`}
              >
                <ListBulletIcon className="h-4 w-4" /> List
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`px-4 py-2 text-sm transition-colors flex items-center gap-2 ${viewMode === 'split' ? 'bg-zinc-200 dark:bg-zinc-700 text-black dark:text-zinc-100' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'}`}
              >
                Split
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`px-4 py-2 text-sm transition-colors flex items-center gap-2 ${viewMode === 'map' ? 'bg-zinc-200 dark:bg-zinc-700 text-black dark:text-zinc-100' : 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'}`}
              >
                <MapIcon className="h-4 w-4" /> Map
              </button>
            </div>
            <button
              type="button"
              onClick={handleNearby}
              className="flex items-center gap-2 rounded-xl border border-black/10 dark:border-zinc-700 px-4 py-2.5 text-sm hover:bg-zinc-100 dark:border-zinc-600 dark:hover:bg-zinc-800 transition-colors dark:text-zinc-100"
            >
              <MapPinIcon className="h-4 w-4" />
              <span className="hidden sm:inline">Nearby</span>
            </button>
          </div>
        </div>

        <FilterBar
          filters={filters}
          onFiltersChange={setFilters}
          onReset={handleResetFilters}
          locationData={locationData}
        />

        <div className="flex flex-wrap items-center gap-3 mt-4">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-xl border border-black/10 dark:border-zinc-700 px-4 py-2.5 bg-white dark:border-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-100 text-sm outline-none"
          >
            <option value="name">Sort by Name</option>
            <option value="location">Sort by Location</option>
            <option value="rating">Sort by Rating</option>
            {coords && <option value="distance">Sort by Distance</option>}
          </select>
          <span className="text-sm text-muted">
            {loading ? 'Loading…' : `${displayedHotels.length} propert${displayedHotels.length !== 1 ? 'ies' : 'y'} found`}
          </span>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 p-4">
          {[1, 2, 3, 4, 5, 6].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : viewMode === 'split' ? (
        <div className="flex flex-col md:flex-row gap-4 h-[calc(100vh-320px)] min-h-[500px]">
          <div className="w-full md:w-[45%] lg:w-[40%] h-full rounded-xl border border-black/10 dark:border-zinc-700 overflow-hidden bg-white dark:bg-zinc-900/50">
            <PropertyListPanel
              hotels={displayedHotels}
              selectedHotelId={selectedHotelId}
              onHotelClick={handleListHotelClick}
              onLoadMore={handleLoadMore}
              hasMore={hasMore}
              loading={loadingMore}
            />
          </div>
          <div className="w-full md:w-[55%] lg:w-[60%] h-full">
            <SplitMapView
              hotels={displayedHotels}
              selectedHotelId={selectedHotelId}
              onMarkerClick={handleMarkerClick}
              onBoundsChange={handleBoundsChange}
            />
          </div>
        </div>
      ) : viewMode === 'map' ? (
        <div className="h-[calc(100vh-320px)] min-h-[500px]">
          <SplitMapView
            hotels={displayedHotels}
            selectedHotelId={selectedHotelId}
            onMarkerClick={handleMarkerClick}
            onBoundsChange={handleBoundsChange}
          />
        </div>
      ) : (
        <>
          {displayedHotels.some((h) => h.featured) && (
            <div className="mb-8 p-4">
              <h2 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-200">Featured Properties</h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                {displayedHotels.filter((h) => h.featured).map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            </div>
          )}
          <div className="p-4">
            <h2 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
              {displayedHotels.some((h) => h.featured) ? 'All Properties' : 'Properties'}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {displayedHotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="px-6 py-2.5 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {loadingMore ? 'Loading…' : 'Load More'}
                </button>
              </div>
            )}
          </div>
        </>
      )}

      {!loading && displayedHotels.length === 0 && (
        <div className="py-16 text-center">
          <MapPinIcon className="h-14 w-14 mx-auto mb-4 text-zinc-300 dark:text-zinc-600" />
          <p className="text-lg font-medium text-zinc-600 dark:text-zinc-400">No properties found</p>
          <p className="mt-1 text-sm text-zinc-400 dark:text-zinc-500">Try adjusting your filters or location</p>
        </div>
      )}

      {/* Mobile: Map / List toggle button */}
      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={toggleMobileMap}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-white font-medium shadow-lg hover:bg-primary/90 transition-colors"
        >
          {mobileMapOpen ? (
            <><ListBulletIcon className="h-5 w-5" />Show List</>
          ) : (
            <><MapIcon className="h-5 w-5" />Show Map</>
          )}
        </button>
      </div>

      {mobileMapOpen && viewMode === 'split' && (
        <div className="md:hidden fixed inset-0 z-40 bg-white dark:bg-zinc-900 pt-16">
          <SplitMapView
            hotels={displayedHotels}
            selectedHotelId={selectedHotelId}
            onMarkerClick={handleMarkerClick}
            onBoundsChange={handleBoundsChange}
          />
        </div>
      )}
    </div>
  );
}

export default function HotelsClient() {
  return (
    <Suspense fallback={<div className="py-12 text-zinc-500 dark:text-zinc-400">Loading…</div>}>
      <HotelsClientInner />
    </Suspense>
  );
}

function ListBulletIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
    </svg>
  );
}

function MapIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
    </svg>
  );
}
