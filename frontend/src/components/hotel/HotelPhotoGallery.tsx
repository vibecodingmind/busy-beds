'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';

interface MediaItem {
  url: string;
  type?: 'image' | 'video';
  thumbnail?: string;
  category?: string;
  caption?: string;
}

interface HotelPhotoGalleryProps {
  images: string[] | MediaItem[];
  hotelName: string;
}

const PLACEHOLDER = 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80';

function isMediaItem(item: string | MediaItem): item is MediaItem {
  return typeof item === 'object' && item !== null && 'url' in item;
}

function getMediaItems(images: string[] | MediaItem[]): MediaItem[] {
  if (!images || images.length === 0) {
    return [{ url: PLACEHOLDER, type: 'image', category: 'Room' }];
  }

  return images.map((item) => {
    if (isMediaItem(item)) {
      return {
        url: item.url,
        type: item.type || detectMediaType(item.url),
        thumbnail: item.thumbnail,
        category: item.category || 'Room',
        caption: item.caption,
      };
    }
    return {
      url: item,
      type: detectMediaType(item),
      category: 'Room',
    };
  });
}

function detectMediaType(url: string): 'image' | 'video' {
  const videoExtensions = ['.mp4', '.webm', '.mov', '.avi'];
  return videoExtensions.some((ext) => url.toLowerCase().includes(ext)) ? 'video' : 'image';
}

function BlurImage({
  src,
  alt,
  fill,
  sizes,
  className,
  priority,
}: {
  src: string;
  alt: string;
  fill?: boolean;
  sizes?: string;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      sizes={sizes}
      className={`object-cover bg-zinc-200 dark:bg-zinc-800 ${className || ''}`}
      priority={priority}
      unoptimized={src.startsWith('http')}
    />
  );
}

function VideoThumbnail({ src, thumbnail, onClick }: { src: string; thumbnail?: string; onClick: () => void }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const thumbUrl = thumbnail || src.replace(/\.(mp4|webm|mov)$/, '-thumb.jpg');

  return (
    <div className="relative w-full h-full" onClick={onClick}>
      <BlurImage
        src={thumbUrl}
        alt="Video thumbnail"
        fill
        sizes="(max-width: 768px) 100vw, 100vw"
        className="rounded-lg"
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-lg">
        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
          <svg className="w-8 h-8 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function HotelPhotoGallery({ images, hotelName }: HotelPhotoGalleryProps) {
  const [index, setIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const list = getMediaItems(images);
  const categories = ['All', ...new Set(list.map((item) => item.category || 'Room'))];
  const filteredList = selectedCategory === 'All' ? list : list.filter((item) => item.category === selectedCategory);

  const currentIndex = filteredList[index];
  const goPrev = useCallback(() => {
    setIndex((i) => (i <= 0 ? filteredList.length - 1 : i - 1));
    setIsZoomed(false);
  }, [filteredList.length]);

  const goNext = useCallback(() => {
    setIndex((i) => (i >= filteredList.length - 1 ? 0 : i + 1));
    setIsZoomed(false);
  }, [filteredList.length]);

  // Auto-play slideshow
  useEffect(() => {
    if (!isPlaying || !lightboxOpen) return;
    const interval = setInterval(goNext, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, lightboxOpen, goNext]);

  // Keyboard and scroll lock for lightbox
  useEffect(() => {
    if (!lightboxOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isZoomed) {
          setIsZoomed(false);
        } else {
          setLightboxOpen(false);
        }
      }
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [lightboxOpen, goPrev, goNext, isZoomed]);

  const openLightbox = (idx: number) => {
    setIndex(idx);
    setLightboxOpen(true);
    setIsPlaying(false);
    setIsZoomed(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart) return;
    const deltaX = e.changedTouches[0].clientX - touchStart.x;
    const deltaY = e.changedTouches[0].clientY - touchStart.y;

    if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX > 0) goPrev();
      else goNext();
    }
    setTouchStart(null);
  };

  const handleDoubleTap = () => {
    setIsZoomed((z) => !z);
  };

  const displayImages = filteredList.slice(0, 5);
  const rightCount = displayImages.length - 1;

  return (
    <div className="w-full relative">
      {/* Category Tabs */}
      {categories.length > 1 && (
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setIndex(0);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat
                  ? 'bg-black text-white dark:bg-white dark:text-black'
                  : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* MOBILE VIEW: Single image slider with swipe */}
      <div
        className="md:hidden relative aspect-[4/3] w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {currentIndex?.type === 'video' ? (
          <VideoThumbnail
            src={currentIndex.url}
            thumbnail={currentIndex.thumbnail}
            onClick={() => openLightbox(index)}
          />
        ) : (
          <div
            className={`relative w-full h-full ${isZoomed ? '' : 'cursor-pointer'}`}
            onClick={handleDoubleTap}
          >
            <BlurImage
              src={currentIndex?.url || PLACEHOLDER}
              alt={`${hotelName} - Photo ${index + 1}`}
              fill
              sizes="(max-width: 768px) 100vw, 100vw"
              priority
              className={isZoomed ? 'scale-150 cursor-zoom-out' : ''}
            />
          </div>
        )}

        {filteredList.length > 1 && (
          <>
            <div className="absolute bottom-4 right-4 rounded-md bg-black/60 px-2 py-1 text-xs font-medium text-white backdrop-blur-md">
              {index + 1} / {filteredList.length}
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
        <div
          className={`relative cursor-pointer group ${filteredList.length === 1 ? 'col-span-4' : 'col-span-2 row-span-2'}`}
          onClick={() => openLightbox(0)}
        >
          {displayImages[0]?.type === 'video' ? (
            <VideoThumbnail
              src={displayImages[0].url}
              thumbnail={displayImages[0].thumbnail}
              onClick={() => openLightbox(0)}
            />
          ) : (
            <BlurImage
              src={displayImages[0]?.url || PLACEHOLDER}
              alt={hotelName}
              fill
              sizes="(max-width: 1200px) 50vw, 800px"
              priority
              className="transition-transform duration-500 group-hover:scale-105"
            />
          )}
          <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
        </div>

        {rightCount > 0 && (
          <div className={`grid gap-2 col-span-2 row-span-2 ${rightCount === 1 ? 'grid-cols-1 grid-rows-1' :
              rightCount === 2 ? 'grid-cols-1 grid-rows-2' :
                'grid-cols-2 grid-rows-2'
            }`}>
            {displayImages.slice(1).map((item, i) => {
              const globalIdx = i + 1;
              const isLastBox = globalIdx === 4 || globalIdx === displayImages.length - 1;
              const isThirdPhotoInFour = rightCount === 3 && i === 0;

              return (
                <div
                  key={globalIdx}
                  className={`relative cursor-pointer group overflow-hidden ${isThirdPhotoInFour ? 'col-span-2' : ''
                    }`}
                  onClick={() => openLightbox(globalIdx)}
                >
                  {item.type === 'video' ? (
                    <VideoThumbnail
                      src={item.url}
                      thumbnail={item.thumbnail}
                      onClick={() => openLightbox(globalIdx)}
                    />
                  ) : (
                    <BlurImage
                      src={item.url}
                      alt={`${hotelName} - ${globalIdx + 1}`}
                      fill
                      sizes="(max-width: 1200px) 25vw, 400px"
                      className="transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />

                  {isLastBox && filteredList.length > 5 && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 hover:bg-black/60 transition-colors">
                      <span className="text-white font-semibold text-lg">+{filteredList.length - 5} photos</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Show All Photos floating button (bottom right on desktop) */}
      {filteredList.length > 1 && (
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
              {index + 1} / {filteredList.length}
            </div>
            <div className="flex items-center gap-2">
              {/* Slideshow Controls */}
              {filteredList.length > 1 && (
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/20 transition-colors backdrop-blur-md ${isPlaying ? 'bg-white/30' : ''
                    }`}
                  aria-label={isPlaying ? 'Pause slideshow' : 'Play slideshow'}
                >
                  {isPlaying ? (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                  <span className="hidden sm:inline">{isPlaying ? 'Pause' : 'Slideshow'}</span>
                </button>
              )}
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
          </div>

          {/* Main Photo Area */}
          <div
            className="relative flex flex-1 items-center justify-center overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {filteredList.length > 1 && (
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

            <div
              className={`relative w-full h-full max-w-7xl max-h-[75vh] px-16 md:px-28 ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
              onClick={() => setIsZoomed(!isZoomed)}
            >
              {currentIndex?.type === 'video' ? (
                <video
                  src={currentIndex.url}
                  controls
                  className="w-full h-full object-contain"
                  autoPlay
                />
              ) : (
                <BlurImage
                  src={currentIndex?.url || PLACEHOLDER}
                  alt={`${hotelName} - Photo ${index + 1}`}
                  fill
                  sizes="100vw"
                  priority
                  className={`object-contain transition-transform duration-300 ${isZoomed ? 'scale-150' : ''}`}
                />
              )}
            </div>

            {filteredList.length > 1 && (
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
          {filteredList.length > 1 && (
            <div className="h-28 md:h-32 bg-transparent px-4 flex items-center justify-center pb-4 md:pb-8">
              <div className="flex items-center gap-2 overflow-x-auto max-w-full px-4 scrollbar-hide py-2">
                {filteredList.map((item, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      setIndex(i);
                      setIsZoomed(false);
                    }}
                    className={`relative h-16 w-24 md:h-20 md:w-32 flex-shrink-0 overflow-hidden rounded-lg transition-all duration-300 ${i === index
                        ? 'ring-2 ring-white opacity-100 scale-105 shadow-xl'
                        : 'opacity-40 hover:opacity-100'
                      }`}
                  >
                    {item.type === 'video' ? (
                      <BlurImage
                        src={item.thumbnail || item.url.replace(/\.(mp4|webm|mov)$/, '-thumb.jpg')}
                        alt=""
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                    ) : (
                      <BlurImage
                        src={item.url}
                        alt=""
                        fill
                        sizes="128px"
                        className="object-cover"
                      />
                    )}
                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-6 h-6 text-white drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    )}
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
