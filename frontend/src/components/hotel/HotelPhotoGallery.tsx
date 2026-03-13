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
  const list = images?.length > 0 ? images : [PLACEHOLDER];

  const goPrev = useCallback(() => {
    setIndex((i) => (i <= 0 ? list.length - 1 : i - 1));
  }, [list.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i >= list.length - 1 ? 0 : i + 1));
  }, [list.length]);

  // Keyboard and scroll lock for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setLightboxOpen(false);
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden'; // Prevent scrolling behind lightbox
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = ''; // Restore scroll
    };
  }, [lightboxOpen, goPrev, goNext]);

  const openLightbox = (idx: number) => {
    setIndex(idx);
    setLightboxOpen(true);
  };

  const displayImages = list.slice(0, 5);
  const rightCount = displayImages.length - 1;

  return (
    <div className="w-full relative">
      {/* MOBILE VIEW: Single image slider */}
      <div className="md:hidden relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={list[index]}
          alt={`${hotelName} - Photo ${index + 1}`}
          fill
          className="object-cover cursor-pointer"
          sizes="(max-width: 768px) 100vw, 100vw"
          unoptimized={!list[index].includes('images.unsplash.com')}
          onClick={() => openLightbox(index)}
        />
        
        {list.length > 1 && (
          <>
            <div className="absolute bottom-4 right-4 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-md">
              {index + 1} / {list.length}
            </div>
            
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-black shadow-sm backdrop-blur-sm hover:bg-white transition"
              aria-label="Previous"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-black shadow-sm backdrop-blur-sm hover:bg-white transition"
              aria-label="Next"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </>
        )}
      </div>

      {/* DESKTOP VIEW: Professional Grid (Airbnb style) */}
      <div className="hidden md:grid h-[400px] lg:h-[460px] w-full grid-cols-4 gap-2 overflow-hidden rounded-xl">
        {/* Main large image (left half) */}
        <div 
          className={`relative cursor-pointer group ${list.length === 1 ? 'col-span-4' : 'col-span-2 row-span-2'}`}
          onClick={() => openLightbox(0)}
        >
          <Image
            src={list[0]}
            alt={hotelName}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 1200px) 50vw, 800px"
            unoptimized={!list[0].includes('images.unsplash.com')}
          />
          <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
        </div>

        {/* Remaining images grid (right half) */}
        {rightCount > 0 && (
          <div className={`grid gap-2 col-span-2 row-span-2 ${
            rightCount === 1 ? 'grid-cols-1 grid-rows-1' :
            rightCount === 2 ? 'grid-cols-1 grid-rows-2' :
            'grid-cols-2 grid-rows-2'
          }`}>
            {displayImages.slice(1).map((src, i) => {
              const globalIdx = i + 1;
              const isLastBox = globalIdx === 4 || globalIdx === displayImages.length - 1;
              const isThirdPhotoInFour = rightCount === 3 && i === 0;
              
              return (
                <div 
                  key={globalIdx} 
                  className={`relative cursor-pointer group overflow-hidden ${
                    isThirdPhotoInFour ? 'col-span-2' : ''
                  }`}
                  onClick={() => openLightbox(globalIdx)}
                >
                  <Image
                    src={src}
                    alt={`${hotelName} - ${globalIdx + 1}`}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="(max-width: 1200px) 25vw, 400px"
                    unoptimized={!src.includes('images.unsplash.com')}
                  />
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
                  
                  {/* Show All Photos overlay on the very last box if there are more than 5 photos total */}
                  {isLastBox && list.length > 5 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/60 transition-colors">
                      <span className="text-white font-semibold text-lg">+{list.length - 5} photos</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Show All Photos floating button (bottom right on desktop) */}
      {list.length > 1 && (
        <button
          onClick={() => openLightbox(0)}
          className="hidden md:flex absolute bottom-4 right-4 z-10 items-center gap-2 rounded-lg border border-black/20 bg-white px-4 py-2.5 text-sm font-semibold text-black shadow-md transition hover:bg-zinc-50 dark:border-white/20 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>
          Show all photos
        </button>
      )}

      {/* Fullscreen Lightbox / Gallery Viewer */}
      {lightboxOpen && (
        <div className="fixed inset-0 z-[100] flex flex-col bg-black/98 backdrop-blur-2xl" role="dialog" aria-modal="true">
          {/* Top Bar */}
          <div className="flex items-center justify-between p-4 md:p-6 z-20">
            <div className="text-sm font-medium text-zinc-400">
              {index + 1} / {list.length}
            </div>
            <button
              type="button"
              onClick={() => setLightboxOpen(false)}
              className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors backdrop-blur-md"
              aria-label="Close gallery"
            >
              Close
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Main Photo Area */}
          <div className="relative flex flex-1 items-center justify-center overflow-hidden">
            {/* Previous Button */}
            {list.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goPrev(); }}
                className="absolute left-4 md:left-8 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-3 md:p-4 text-white hover:bg-white/20 hover:scale-110 transition-all backdrop-blur-md"
                aria-label="Previous photo"
              >
                <svg className="h-6 w-6 md:h-8 md:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}

            {/* Photo Wrapper */}
            <div className="relative w-full h-full max-w-7xl max-h-[75vh] px-16 md:px-28">
              <Image
                src={list[index]}
                alt={`${hotelName} - Photo ${index + 1}`}
                fill
                className="object-contain"
                sizes="100vw"
                priority
                unoptimized={!list[index].includes('images.unsplash.com')}
              />
            </div>

            {/* Next Button */}
            {list.length > 1 && (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); goNext(); }}
                className="absolute right-4 md:right-8 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/10 p-3 md:p-4 text-white hover:bg-white/20 hover:scale-110 transition-all backdrop-blur-md"
                aria-label="Next photo"
              >
                <svg className="h-6 w-6 md:h-8 md:w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>

          {/* Thumbnails Strip */}
          {list.length > 1 && (
            <div className="h-28 md:h-32 bg-transparent px-4 flex items-center justify-center pb-4 md:pb-8">
              <div className="flex items-center gap-2 overflow-x-auto max-w-full px-4 scrollbar-hide py-2">
                {list.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndex(i)}
                    className={`relative h-16 w-24 md:h-20 md:w-32 flex-shrink-0 overflow-hidden rounded-lg transition-all duration-300 ${
                      i === index 
                        ? 'ring-2 ring-white opacity-100 scale-105 shadow-xl' 
                        : 'opacity-40 hover:opacity-100'
                    }`}
                  >
                    <Image
                      src={url}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="128px"
                      unoptimized={!url.includes('images.unsplash.com')}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}