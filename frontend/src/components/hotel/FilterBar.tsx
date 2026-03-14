'use client';

import { useState, useEffect } from 'react';
import { MapPinIcon } from '@/components/icons';

export interface FilterState {
  search: string;
  city: string;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  minRating: number | undefined;
  amenities: string[];
  hasDiscount: boolean;
}

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
  cities?: string[];
  availableAmenities?: string[];
}

const DEFAULT_AMENITIES = [
  { id: 'wifi', label: 'WiFi', icon: '📶' },
  { id: 'pool', label: 'Pool', icon: '🏊' },
  { id: 'parking', label: 'Parking', icon: '🅿️' },
  { id: 'gym', label: 'Gym', icon: '🏋️' },
  { id: 'restaurant', label: 'Restaurant', icon: '🍽️' },
  { id: 'spa', label: 'Spa', icon: '💆' },
  { id: 'beach', label: 'Beach', icon: '🏖️' },
  { id: 'airport-shuttle', label: 'Airport Shuttle', icon: '🚌' },
  { id: 'pet-friendly', label: 'Pet Friendly', icon: '🐾' },
  { id: 'room-service', label: 'Room Service', icon: '🛎️' },
];

export default function FilterBar({
  filters,
  onFiltersChange,
  onReset,
  cities = [],
  availableAmenities = [],
}: FilterBarProps) {
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const [showAmenitiesDropdown, setShowAmenitiesDropdown] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (localSearch !== filters.search) {
        onFiltersChange({ ...filters, search: localSearch });
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch]);

  const amenitiesList = availableAmenities.length > 0
    ? availableAmenities.map(a => ({ id: a, label: a, icon: '✓' }))
    : DEFAULT_AMENITIES;

  const updateFilter = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const toggleAmenity = (amenityId: string) => {
    const newAmenities = filters.amenities.includes(amenityId)
      ? filters.amenities.filter(a => a !== amenityId)
      : [...filters.amenities, amenityId];
    updateFilter('amenities', newAmenities);
  };

  const activeFilterCount =
    (filters.city ? 1 : 0) +
    (filters.minPrice != null ? 1 : 0) +
    (filters.maxPrice != null ? 1 : 0) +
    (filters.minRating != null ? 1 : 0) +
    (filters.amenities.length > 0 ? 1 : 0) +
    (filters.hasDiscount ? 1 : 0);

  return (
    <div className="rounded-2xl border border-black/10 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/50 backdrop-blur-xl p-4 mb-4">
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="search"
              placeholder="Search by name, location..."
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              className="w-full rounded-xl border border-black/10 dark:border-zinc-700 px-4 py-2.5 bg-white dark:border-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowCityDropdown(!showCityDropdown)}
              className="flex items-center gap-2 rounded-xl border border-black/10 dark:border-zinc-700 px-4 py-2.5 bg-white dark:border-zinc-600 dark:bg-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors"
            >
              <MapPinIcon className="h-4 w-4" />
              <span className="text-sm dark:text-zinc-100">
                {filters.city || 'Any City'}
              </span>
              <ChevronDownIcon className="h-4 w-4" />
            </button>
            {showCityDropdown && (
              <div className="absolute top-full left-0 mt-1 w-48 rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg z-20 max-h-60 overflow-auto">
                <button
                  type="button"
                  onClick={() => {
                    updateFilter('city', '');
                    setShowCityDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 dark:text-zinc-100"
                >
                  Any City
                </button>
                {cities.map((city) => (
                  <button
                    key={city}
                    type="button"
                    onClick={() => {
                      updateFilter('city', city);
                      setShowCityDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-zinc-100 dark:hover:bg-zinc-700 ${
                      filters.city === city ? 'bg-primary/10 text-primary' : 'dark:text-zinc-100'
                    }`}
                  >
                    {city}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min $"
              value={filters.minPrice ?? ''}
              onChange={(e) => updateFilter('minPrice', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-20 rounded-xl border border-black/10 dark:border-zinc-700 px-3 py-2.5 bg-white dark:border-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-100 text-sm placeholder:text-zinc-400"
            />
            <span className="text-zinc-400">-</span>
            <input
              type="number"
              placeholder="Max $"
              value={filters.maxPrice ?? ''}
              onChange={(e) => updateFilter('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
              className="w-20 rounded-xl border border-black/10 dark:border-zinc-700 px-3 py-2.5 bg-white dark:border-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-100 text-sm placeholder:text-zinc-400"
            />
          </div>

          <select
            value={filters.minRating ?? ''}
            onChange={(e) => updateFilter('minRating', e.target.value ? parseFloat(e.target.value) : undefined)}
            className="rounded-xl border border-black/10 dark:border-zinc-700 px-4 py-2.5 bg-white dark:border-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-100 text-sm"
          >
            <option value="">Any Rating</option>
            <option value="4">4+ ★</option>
            <option value="3.5">3.5+ ★</option>
            <option value="3">3+ ★</option>
          </select>

          <div className="relative">
            <button
              type="button"
              onClick={() => setShowAmenitiesDropdown(!showAmenitiesDropdown)}
              className={`flex items-center gap-2 rounded-xl border border-black/10 dark:border-zinc-700 px-4 py-2.5 bg-white dark:border-zinc-600 dark:bg-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors ${
                filters.amenities.length > 0 ? 'border-primary ring-1 ring-primary/30' : ''
              }`}
            >
              <span className="text-sm dark:text-zinc-100">
                Amenities {filters.amenities.length > 0 && `(${filters.amenities.length})`}
              </span>
              <ChevronDownIcon className="h-4 w-4" />
            </button>
            {showAmenitiesDropdown && (
              <div className="absolute top-full left-0 mt-1 w-56 rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-lg z-20 max-h-60 overflow-auto">
                {amenitiesList.map((amenity) => (
                  <label
                    key={amenity.id}
                    className="flex items-center gap-3 px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.amenities.includes(amenity.id)}
                      onChange={() => toggleAmenity(amenity.id)}
                      className="h-4 w-4 rounded border-black/20 dark:border-zinc-600"
                    />
                    <span className="text-sm dark:text-zinc-100">
                      {amenity.icon} {amenity.label}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <label className="flex items-center gap-2 rounded-xl border border-black/10 dark:border-zinc-700 px-4 py-2.5 bg-white dark:border-zinc-600 dark:bg-zinc-800/50 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.hasDiscount}
              onChange={(e) => updateFilter('hasDiscount', e.target.checked)}
              className="h-4 w-4 rounded border-black/20 dark:border-zinc-600"
            />
            <span className="text-sm dark:text-zinc-100 whitespace-nowrap">Member Discount</span>
          </label>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={onReset}
              className="flex items-center gap-1 rounded-xl border border-red-200 dark:border-red-800 px-4 py-2.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              <XMarkIcon className="h-4 w-4" />
              <span className="text-sm">Clear ({activeFilterCount})</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ChevronDownIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function XMarkIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
