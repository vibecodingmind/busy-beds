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
import { HouseIcon, MapPinIcon, ChevronRightIcon } from '@/components/icons';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/contexts/ToastContext';
import { tanzaniaRegions } from '@/data/tanzania-wards';

interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface LocationData {
  countries: string[];
  regions: { country: string; region: string }[];
}

const INITIAL_FILTERS: FilterState = {
  search: '',
  country: 'Tanzania', // Default to Tanzania as per user request
  region: '',
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

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [locationMetadata, setLocationMetadata] = useState<LocationData | null>(null);
  const [selectedHotelId, setSelectedHotelId] = useState<number | null>(null);

  const debouncedSearch = useDebounce(filters.search, 300);
  const debouncedBounds = useDebounce(bounds, 500);

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
        city: undefined,
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
  }, [debouncedSearch, sort, coords, debouncedBounds, filters.minPrice, filters.maxPrice, filters.minRating, filters.hasDiscount, filters.amenities, filters.region, filters.country]);

  useEffect(() => {
    // Fetch dynamic location metadata
    hotels.locations().then(res => {
      setLocationMetadata({
        countries: res.countries,
        regions: res.regions
      });
    }).catch(err => {
      console.error('Failed to fetch locations:', err);
      // Fallback to minimal data if API fails
      setLocationMetadata({
        countries: ['Tanzania'],
        regions: tanzaniaRegions.map(r => ({ country: 'Tanzania', region: r.region }))
      });
    });
  }, []);

  useEffect(() => {
    if (nearme && navigator.geolocation && !coords) {
      setViewMode('split');
      setSort('distance');
      navigator.geolocation.getCurrentPosition(
        (pos) => setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => { },
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

  const locationBreadcrumb = [filters.country, filters.region].filter(Boolean).join(' › ');

  return (
    <div className="min-h-screen bg-transparent">
      {/* Discovery Hub Header */}
      <div className="relative mb-8 overflow-hidden rounded-[2.5rem] bg-zinc-950 px-8 py-12 text-white shadow-2xl">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80')] bg-cover bg-center opacity-30 mix-blend-overlay" />
        <div className="absolute inset-0 bg-gradient-to-tr from-black via-black/40 to-transparent" />

        <div className="relative z-10">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
                  <HouseIcon className="h-6 w-6 text-white" />
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Discover Properties</h1>
              </div>
              <p className="text-lg text-zinc-300 font-medium leading-relaxed">
                Explore handpicked hotels and active deals in
                <span className="text-primary font-bold ml-1.5">{locationBreadcrumb || 'Tanzania'}</span>
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-white/5 backdrop-blur-md rounded-2xl p-1 border border-white/10">
                {[
                  { id: 'list', icon: <ListBulletIcon />, label: 'List' },
                  { id: 'split', icon: <div className="flex gap-0.5"><div className="w-1.5 h-3 bg-current rounded-sm opacity-50" /><div className="w-1.5 h-3 bg-current rounded-sm" /></div>, label: 'Split' },
                  { id: 'map', icon: <MapIcon />, label: 'Map' }
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setViewMode(mode.id as any)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-bold transition-all rounded-xl ${viewMode === mode.id
                      ? 'bg-primary text-white shadow-lg'
                      : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                  >
                    {mode.icon}
                    <span className="hidden sm:inline">{mode.label}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={handleNearby}
                className="flex items-center gap-2 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 px-5 py-3 text-sm font-bold text-white hover:bg-white/20 transition-all shadow-lg active:scale-95"
              >
                <MapPinIcon className="h-4 w-4" />
                <span>Nearby</span>
              </button>
            </div>
          </div>

          <div className="mt-10">
            <div className="rounded-3xl bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl p-2 shadow-2xl">
              <FilterBar
                filters={filters}
                onFiltersChange={setFilters}
                onReset={handleResetFilters}
                locationData={locationMetadata ?? { countries: ['Tanzania'], regions: [] }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 px-2">
        <div className="flex items-center gap-4">
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none rounded-2xl border border-black/5 dark:border-white/5 px-5 py-2.5 bg-white dark:bg-zinc-900 shadow-sm text-sm font-bold text-foreground outline-none hover:border-primary/30 transition-all pr-10"
            >
              <option value="name">Sort by Name</option>
              <option value="location">Location Alpha</option>
              <option value="rating">Top Rated</option>
              {coords && <option value="distance">Nearest First</option>}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
            </div>
          </div>
          <span className="text-xs font-bold text-muted uppercase tracking-widest bg-muted/30 px-3 py-1.5 rounded-full">
            {loading ? 'Discovering…' : `${displayedHotels.length} found`}
          </span>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-2">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => <CardSkeleton key={i} />)}
        </div>
      ) : viewMode === 'split' ? (
        <div className="flex flex-col md:flex-row gap-6 h-[calc(100vh-280px)] min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="w-full md:w-[45%] lg:w-[35%] h-full rounded-2xl border border-black/5 dark:border-white/5 overflow-hidden bg-white dark:bg-zinc-900 shadow-xl">
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
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="h-1.5 w-8 rounded-full bg-amber-500" />
                <h2 className="text-xl font-extrabold text-foreground tracking-tight">Handpicked Featured</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {displayedHotels.filter((h) => h.featured).map((hotel) => (
                  <HotelCard key={hotel.id} hotel={hotel} />
                ))}
              </div>
            </div>
          )}
          <div className="pb-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-1.5 w-8 rounded-full bg-primary" />
              <h2 className="text-xl font-extrabold text-foreground tracking-tight">
                {displayedHotels.some((h) => h.featured) ? 'Explore All Properties' : 'Explore Properties'}
              </h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {displayedHotels.map((hotel) => (
                <HotelCard key={hotel.id} hotel={hotel} />
              ))}
            </div>
            {hasMore && (
              <div className="mt-12 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                  className="group relative inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 font-bold text-white shadow-xl shadow-primary/20 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 overflow-hidden"
                >
                  <span className="relative z-10">{loadingMore ? 'Loading Properties…' : 'Deep Dive for More'}</span>
                  <div className="h-5 w-5 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-1 transition-transform">
                    <ChevronRightIcon className="h-3 w-3" />
                  </div>
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
