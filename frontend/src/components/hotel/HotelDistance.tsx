'use client';

import { useEffect, useState } from 'react';

interface HotelDistanceProps {
  latitude: number;
  longitude: number;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function HotelDistance({ latitude, longitude }: HotelDistanceProps) {
  const [distance, setDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const km = haversine(pos.coords.latitude, pos.coords.longitude, latitude, longitude);
        setDistance(km);
        setLoading(false);
      },
      () => {
        setError(true);
        setLoading(false);
      }
    );
  }, [latitude, longitude]);

  if (loading) {
    return (
      <p className="text-sm text-zinc-600 dark:text-zinc-400">Getting distance...</p>
    );
  }
  if (error || distance === null) {
    return null;
  }
  const display = distance < 1 ? `${(distance * 1000).toFixed(0)} m away` : `${distance.toFixed(1)} km away`;
  return (
    <p className="flex items-center gap-1.5 text-sm text-zinc-600 dark:text-zinc-400">
      <svg className="h-4 w-4 text-zinc-500 dark:text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      {display}
    </p>
  );
}
