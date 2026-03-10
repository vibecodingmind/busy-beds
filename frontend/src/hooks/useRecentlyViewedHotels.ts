'use client';

import { useState, useEffect } from 'react';
import type { Hotel } from '@/lib/api';
import { hotels } from '@/lib/api';

const STORAGE_KEY = 'busybeds_recently_viewed';
const MAX_ITEMS = 6;

export function addRecentlyViewed(hotelId: number) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const ids: number[] = raw ? JSON.parse(raw) : [];
    const filtered = ids.filter((id) => id !== hotelId);
    filtered.unshift(hotelId);
    const trimmed = filtered.slice(0, MAX_ITEMS);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch {
    // ignore
  }
}

export function useRecentlyViewedHotels(): Hotel[] {
  const [list, setList] = useState<Hotel[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const ids: number[] = raw ? JSON.parse(raw) : [];
      if (ids.length === 0) {
        setList([]);
        return;
      }
      Promise.all(ids.map((id) => hotels.get(id)))
        .then((results) => results.filter((h): h is Hotel => h != null))
        .then(setList)
        .catch(() => setList([]));
    } catch {
      setList([]);
    }
  }, []);

  return list;
}
