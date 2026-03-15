'use client';

import { tanzaniaRegions } from '@/data/tanzania-wards';

interface LocationValue {
  region: string;
  location: string;
}

interface LocationFieldsProps {
  value: LocationValue;
  onChange: (v: LocationValue) => void;
}

export default function LocationFields({ value, onChange }: LocationFieldsProps) {
  const availableRegions = tanzaniaRegions.map(r => r.region);

  const inputClass =
    'mt-1 w-full rounded-lg border border-black/20 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2.5 text-black dark:text-zinc-100 placeholder:text-zinc-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-colors';
  const labelClass = 'block text-sm font-medium text-black dark:text-zinc-300';

  const set = (key: keyof LocationValue) => (val: string) => {
    const next: LocationValue = { ...value, [key]: val };
    onChange(next);
  };

  return (
    <div className="rounded-xl border border-black/10 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        Location (Tanzania)
      </p>

      <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-300">
        Country: <span className="font-semibold">Tanzania</span>
      </div>

      <div>
        <label className={labelClass}>Region</label>
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
          {(!availableRegions.includes(value.region)) && value.region && (
            <input
              type="text"
              value={value.region}
              onChange={(e) => set('region')(e.target.value)}
              placeholder="Type region name…"
              className="flex-1 rounded-lg border border-black/20 dark:border-zinc-600 bg-white dark:bg-zinc-800 px-4 py-2.5 text-black dark:text-zinc-100 placeholder:text-zinc-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          )}
        </div>
      </div>

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

      {(value.region || value.location) && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 px-4 py-2.5 text-sm text-emerald-800 dark:text-emerald-300">
          <span className="font-medium">Preview: </span>
          {[value.location, value.region, 'Tanzania'].filter(Boolean).join(', ')}
        </div>
      )}
    </div>
  );
}
