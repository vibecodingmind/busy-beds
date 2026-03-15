'use client';

import { useState, useEffect } from 'react';
import SearchableSelect from '@/components/SearchableSelect';

export interface FilterState {
  search: string;
  region: string;
  minPrice: number | undefined;
  maxPrice: number | undefined;
  minRating: number | undefined;
  amenities: string[];
  hasDiscount: boolean;
}

interface LocationData {
  country: string;
  regions: string[];
}

interface FilterBarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onReset: () => void;
  locationData?: LocationData;
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
  locationData,
  availableAmenities = [],
}: FilterBarProps) {
  const [showAmenitiesDropdown, setShowAmenitiesDropdown] = useState(false);
  const [showMoreFilters, setShowMoreFilters] = useState(false);
  const [localSearch, setLocalSearch] = useState(filters.search);

  // Sync local search state when external filters reset
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

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

  const update = <K extends keyof FilterState>(key: K, value: FilterState[K]) => {
    const next = { ...filters, [key]: value };
    onFiltersChange(next);
  };

  const toggleAmenity = (id: string) => {
    const next = filters.amenities.includes(id)
      ? filters.amenities.filter(a => a !== id)
      : [...filters.amenities, id];
    update('amenities', next);
  };

  const availableRegions = locationData?.regions ?? [];

  const activeFilterCount =
    (filters.region ? 1 : 0) +
    (filters.minPrice != null ? 1 : 0) +
    (filters.maxPrice != null ? 1 : 0) +
    (filters.minRating != null ? 1 : 0) +
    (filters.amenities.length > 0 ? 1 : 0) +
    (filters.hasDiscount ? 1 : 0);

  const selectClass = 'rounded-xl border border-black/10 dark:border-zinc-700 px-3 py-2.5 bg-white dark:border-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-100 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-colors';

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Location cascade + Sort controls */}
      <div className="flex flex-wrap gap-2">
        {/* Search */}
        <div className="flex-1 min-w-[180px]">
          <input
            type="search"
            placeholder="Search properties…"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="w-full rounded-xl border border-black/10 dark:border-zinc-700 px-4 py-2.5 bg-white dark:border-zinc-600 dark:bg-zinc-800/50 dark:text-zinc-100 placeholder:text-zinc-500 dark:placeholder:text-zinc-400 focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-colors text-sm"
          />
        </div>

        {/* Region */}
        {availableRegions.length > 0 && (
          <div className="min-w-[180px]">
            <SearchableSelect
              value={filters.region}
              options={['', ...availableRegions]}
              onChange={(value) => update('region', value)}
              placeholder="All Regions"
              searchPlaceholder="Search regions..."
              optionLabel={(region) => region || 'All Regions'}
              searchFirst
            />
          </div>
        )}

        {/* More Filters toggle */}
        <button
          type="button"
          onClick={() => setShowMoreFilters(!showMoreFilters)}
          className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm transition-colors ${
            showMoreFilters || activeFilterCount > 0
              ? 'border-primary bg-primary/5 text-primary dark:border-primary dark:bg-primary/10'
              : 'border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-800/50 hover:bg-zinc-50 dark:hover:bg-zinc-700 dark:text-zinc-100'
          }`}
        >
          <FilterIcon />
          Filters
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white">
              {activeFilterCount}
            </span>
          )}
          <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${showMoreFilters ? 'rotate-180' : ''}`} />
        </button>

        {/* Clear */}
        {activeFilterCount > 0 && (
          <button
            type="button"
            onClick={onReset}
            className="flex items-center gap-1.5 rounded-xl border border-red-200 dark:border-red-800 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            <XMarkIcon />
            Clear ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Row 2: Extended filters (expandable) */}
      {showMoreFilters && (
        <div className="rounded-xl border border-black/10 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/30 p-4">
          <div className="flex flex-wrap gap-3 items-center">
            {/* Price range */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-500 dark:text-zinc-400 whitespace-nowrap">Price/night:</span>
              <input
                type="number"
                placeholder="Min $"
                value={filters.minPrice ?? ''}
                onChange={(e) => update('minPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-20 rounded-lg border border-black/10 dark:border-zinc-700 px-3 py-2 bg-white dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 text-sm outline-none"
              />
              <span className="text-zinc-400">–</span>
              <input
                type="number"
                placeholder="Max $"
                value={filters.maxPrice ?? ''}
                onChange={(e) => update('maxPrice', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-20 rounded-lg border border-black/10 dark:border-zinc-700 px-3 py-2 bg-white dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 text-sm outline-none"
              />
            </div>

            {/* Rating */}
            <select
              value={filters.minRating ?? ''}
              onChange={(e) => update('minRating', e.target.value ? parseFloat(e.target.value) : undefined)}
              className="rounded-lg border border-black/10 dark:border-zinc-700 px-3 py-2 bg-white dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-100 text-sm outline-none"
            >
              <option value="">Any Rating</option>
              <option value="4">4+ ★</option>
              <option value="3.5">3.5+ ★</option>
              <option value="3">3+ ★</option>
            </select>

            {/* Amenities */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAmenitiesDropdown(!showAmenitiesDropdown)}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                  filters.amenities.length > 0
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 dark:text-zinc-100'
                }`}
              >
                Amenities {filters.amenities.length > 0 && `(${filters.amenities.length})`}
                <ChevronDownIcon className="h-3.5 w-3.5" />
              </button>
              {showAmenitiesDropdown && (
                <div className="absolute top-full left-0 mt-1 w-56 rounded-xl border border-black/10 dark:border-zinc-700 bg-white dark:bg-zinc-800 shadow-xl z-30 max-h-60 overflow-auto">
                  {amenitiesList.map((amenity) => (
                    <label key={amenity.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filters.amenities.includes(amenity.id)}
                        onChange={() => toggleAmenity(amenity.id)}
                        className="h-4 w-4 rounded border-black/20 dark:border-zinc-600 accent-primary"
                      />
                      <span className="text-sm dark:text-zinc-100">{amenity.icon} {amenity.label}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Discount toggle */}
            <label className="flex items-center gap-2 rounded-lg border border-black/10 dark:border-zinc-700 px-3 py-2 bg-white dark:bg-zinc-800 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasDiscount}
                onChange={(e) => update('hasDiscount', e.target.checked)}
                className="h-4 w-4 rounded border-black/20 dark:border-zinc-600 accent-primary"
              />
              <span className="text-sm dark:text-zinc-100 whitespace-nowrap">Member Discount</span>
            </label>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.region && (
            <FilterChip label={`📍 ${filters.region}`} onRemove={() => update('region', '')} />
          )}
          {(filters.minPrice != null || filters.maxPrice != null) && (
            <FilterChip
              label={`$ ${filters.minPrice ?? 0}–${filters.maxPrice ?? '∞'}`}
              onRemove={() => onFiltersChange({ ...filters, minPrice: undefined, maxPrice: undefined })}
            />
          )}
          {filters.minRating != null && (
            <FilterChip label={`${filters.minRating}+ ★`} onRemove={() => update('minRating', undefined)} />
          )}
          {filters.amenities.map(a => (
            <FilterChip key={a} label={a} onRemove={() => toggleAmenity(a)} />
          ))}
          {filters.hasDiscount && (
            <FilterChip label="Member Discount" onRemove={() => update('hasDiscount', false)} />
          )}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-medium text-primary">
      {label}
      <button type="button" onClick={onRemove} className="hover:opacity-70 transition-opacity">
        <XMarkIcon className="h-3 w-3" />
      </button>
    </span>
  );
}

function FilterIcon() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  );
}

function ChevronDownIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

function XMarkIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}
