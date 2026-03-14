'use client';

import { useState, useEffect } from 'react';
import { hotels } from '@/lib/api';

interface LocationValue {
  country: string;
  region: string;
  city: string;
  location: string; // street / neighborhood detail
}

interface LocationFieldsProps {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
}

interface LocationData {
  countries: string[];
  regions: { country: string; region: string }[];
  cities: { country: string; region: string | null; city: string }[];
}

/**
 * Cascading Country → Region → City dropdowns + free-text street/detail field.
 * All fields also accept free-text input so admins can add new values.
 */
export default function LocationFields({ value, onChange }: LocationFieldsProps) {
  const [data, setData] = useState<LocationData | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    hotels
      .locations()
      .then(setData)
      .catch(() => setLoadError(true));
  }, []);

  const availableCountries = data?.countries ?? [];
  const availableRegions = data
    ? data.regions
        .filter((r) => !value.country || r.country.toLowerCase() === value.country.toLowerCase())
        .map((r) => r.region)
    : [];
  const availableCities = data
    ? data.cities
        .filter((c) => {
          const countryMatch = !value.country || (c.country ?? '').toLowerCase() === value.country.toLowerCase();
          const regionMatch = !value.region || (c.region ?? '').toLowerCase() === value.region.toLowerCase();
          return countryMatch && regionMatch;
        })
        .map((c) => c.city)
    : [];

  const inputClass =
    'mt-1 w-full rounded-lg border border-black/20 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2.5 text-black dark:text-zinc-100 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors';
  const labelClass = 'block text-sm font-medium text-black dark:text-zinc-300';

  const set = (key: keyof LocationValue) => (val: string) => {
    const next = { ...value, [key]: val };
    // Clear dependent fields when parent changes
    if (key === 'country') { next.region = ''; next.city = ''; }
    if (key === 'region') { next.city = ''; }
    onChange(next);
  };

  return (
    <div className="rounded-xl border border-black/10 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Location Hierarchy
      </p>
      {loadError && (
        <p className="text-xs text-amber-600 dark:text-amber-400">
          Could not load existing locations (API may be down). You can still type values manually.
        </p>
      )}

      {/* Country */}
      <div>
        <label className={labelClass}>Country</label>
        {availableCountries.length > 0 ? (
          <div className="flex gap-2 mt-1">
            <select
              value={availableCountries.includes(value.country) ? value.country : '__other__'}
              onChange={(e) => {
                if (e.target.value !== '__other__') set('country')(e.target.value);
                else set('country')('');
              }}
              className={`flex-1 rounded-lg border border-black/20 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2.5 text-black dark:text-zinc-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors`}
            >
              <option value="">— Select country —</option>
              {availableCountries.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="__other__">+ Add new country…</option>
            </select>
            {(!availableCountries.includes(value.country)) && (
              <input
                type="text"
                value={value.country}
                onChange={(e) => set('country')(e.target.value)}
                placeholder="Type country name…"
                className="flex-1 rounded-lg border border-black/20 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2.5 text-black dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            )}
          </div>
        ) : (
          <input
            type="text"
            value={value.country}
            onChange={(e) => set('country')(e.target.value)}
            placeholder="e.g. Tanzania"
            className={inputClass}
          />
        )}
      </div>

      {/* Region / State / Province */}
      <div>
        <label className={labelClass}>Region / State / Province</label>
        {availableRegions.length > 0 ? (
          <div className="flex gap-2 mt-1">
            <select
              value={availableRegions.includes(value.region) ? value.region : '__other__'}
              onChange={(e) => {
                if (e.target.value !== '__other__') set('region')(e.target.value);
                else set('region')('');
              }}
              className="flex-1 rounded-lg border border-black/20 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2.5 text-black dark:text-zinc-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            >
              <option value="">— Select region —</option>
              {availableRegions.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
              <option value="__other__">+ Add new region…</option>
            </select>
            {(!availableRegions.includes(value.region)) && (
              <input
                type="text"
                value={value.region}
                onChange={(e) => set('region')(e.target.value)}
                placeholder="Type region name…"
                className="flex-1 rounded-lg border border-black/20 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2.5 text-black dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            )}
          </div>
        ) : (
          <input
            type="text"
            value={value.region}
            onChange={(e) => set('region')(e.target.value)}
            placeholder="e.g. Arusha Region"
            className={inputClass}
          />
        )}
      </div>

      {/* City */}
      <div>
        <label className={labelClass}>City</label>
        {availableCities.length > 0 ? (
          <div className="flex gap-2 mt-1">
            <select
              value={availableCities.includes(value.city) ? value.city : '__other__'}
              onChange={(e) => {
                if (e.target.value !== '__other__') set('city')(e.target.value);
                else set('city')('');
              }}
              className="flex-1 rounded-lg border border-black/20 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2.5 text-black dark:text-zinc-100 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            >
              <option value="">— Select city —</option>
              {availableCities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="__other__">+ Add new city…</option>
            </select>
            {(!availableCities.includes(value.city)) && (
              <input
                type="text"
                value={value.city}
                onChange={(e) => set('city')(e.target.value)}
                placeholder="Type city name…"
                className="flex-1 rounded-lg border border-black/20 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2.5 text-black dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            )}
          </div>
        ) : (
          <input
            type="text"
            value={value.city}
            onChange={(e) => set('city')(e.target.value)}
            placeholder="e.g. Arusha"
            className={inputClass}
          />
        )}
      </div>

      {/* Street / Neighbourhood detail */}
      <div>
        <label className={labelClass}>Street / Neighbourhood <span className="text-zinc-400 font-normal">(address detail)</span></label>
        <input
          type="text"
          value={value.location}
          onChange={(e) => set('location')(e.target.value)}
          placeholder="e.g. 123 Main Road, Near the Stadium"
          className={inputClass}
        />
      </div>

      {/* Preview */}
      {(value.country || value.region || value.city || value.location) && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 px-4 py-2.5 text-sm text-emerald-800 dark:text-emerald-300">
          <span className="font-medium">Preview: </span>
          {[value.location, value.city, value.region, value.country].filter(Boolean).join(', ')}
        </div>
      )}
    </div>
  );
}
