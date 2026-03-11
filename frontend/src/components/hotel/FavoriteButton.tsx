'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { favorites } from '@/lib/api';

interface Props {
  hotelId: number;
  className?: string;
  size?: 'sm' | 'md';
  onRemove?: () => void; // Called when removed from favorites (e.g. to update parent list)
  onImage?: boolean; // Use white/red for visibility on image overlays
}

export default function FavoriteButton({ hotelId, className = '', size = 'md', onRemove, onImage }: Props) {
  const { user } = useAuth();
  const [favorited, setFavorited] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    favorites.check(hotelId).then((r) => setFavorited(r.favorited)).catch(() => {});
  }, [user, hotelId]);

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user || loading) return;
    setLoading(true);
    try {
      if (favorited) {
        await favorites.remove(hotelId);
        setFavorited(false);
        onRemove?.();
      } else {
        await favorites.add(hotelId);
        setFavorited(true);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  const sz = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading}
      className={`rounded-full p-2 transition ${
        onImage
          ? favorited
            ? 'text-red-400 hover:text-red-300 hover:bg-white/20'
            : 'text-white hover:bg-white/20 hover:text-white'
          : favorited
            ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30'
            : 'text-black hover:bg-black/5 dark:hover:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300'
      } ${sz} ${className}`}
      aria-label={favorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <svg className="h-full w-full" fill={favorited ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    </button>
  );
}
