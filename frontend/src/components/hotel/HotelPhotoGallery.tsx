'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';

interface HotelPhotoGalleryProps {
  images: string[];
  hotelName: string;
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';

export default function HotelPhotoGallery({ images, hotelName }: HotelPhotoGalleryProps) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const list = images?.length ? images : [PLACEHOLDER];

  const goPrev = useCallback(() => {
    setIndex((i) => (i <= 0 ? list.length - 1 : i - 1));
  }, [list.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i >= list.length - 1 ? 0 : i + 1));
  }, [list.length]);

  // Keyboard in lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightboxOpen, goPrev, goNext]);

  const currentSrc = list[index] ?? list[0];

  return (
    <div className="space-y-3">
      {/* Single main image: slide area + arrows */}
      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-xl bg-white dark:bg-zinc-800">
        <button
          type="button"
          onClick={() => setLightboxOpen(true)}
          className="absolute inset-0 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:ring-inset"
        >
          <Image
            src={currentSrc}
            alt={`${hotelName} - Photo ${index + 1}`}
            fill
            className="object-cover transition-transform hover:scale-[1.02]"
            sizes="(max-width: 768px) 100vw, 80vw"
            unoptimized={!currentSrc.includes('images.unsplash.com')}
          />
        </button>

        {/* Left / Right slide arrows */}
        {list.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              className="absolute left-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Previous photo"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              className="absolute right-3 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/50 p-2 text-white hover:bg-black/70 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Next photo"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Hint: click to open large preview */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg bg-black/60 px-3 py-1.5 text-xs text-white">
          Click to view full size
        </div>

        {/* Photo counter */}
        {list.length > 1 && (
          <div className="absolute right-3 top-3 rounded-lg bg-black/50 px-2.5 py-1 text-sm text-white">
            {index + 1} / {list.length}
          </div>
        )}
      </div>

      {/* Dots for slide position */}
      {list.length > 1 && list.length <= 12 && (
        <div className="flex justify-center gap-1.5">
          {list.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index
                  ? 'w-6 bg-[var(--primary)]'
                  : 'w-2 bg-zinc-300 hover:bg-zinc-400 dark:bg-zinc-600 dark:hover:bg-zinc-500'
              }`}
              aria-label={`Go to photo ${i + 1}`}
            />
          ))}
        </div>
      )}

      {/* Large preview lightbox (opens on click) */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col bg-black/95"
          role="dialog"
          aria-modal="true"
          aria-label="Photo gallery"
        >
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm font-medium text-white">
              {index + 1} / {list.length}
            </span>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="rounded-full p-2 text-white hover:bg-white/10"
              aria-label="Close"
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="relative flex flex-1 items-center justify-center p-4">
            {list.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goPrev}
                  className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
                  aria-label="Previous"
                >
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
                  aria-label="Next"
                >
                  <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
            <Image
              src={list[index]}
              alt={`${hotelName} - Photo ${index + 1}`}
              width={1200}
              height={800}
              className="max-h-[calc(100vh-8rem)] w-auto max-w-full object-contain"
              unoptimized={!list[index].includes('images.unsplash.com')}
            />
          </div>

          {list.length > 1 && (
            <div className="flex gap-2 overflow-x-auto border-t border-white/10 px-4 py-3">
              {list.map((url, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`relative h-14 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                    i === index ? 'border-[var(--primary)]' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <Image
                    src={url}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="80px"
                    unoptimized={!url.includes('images.unsplash.com')}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
