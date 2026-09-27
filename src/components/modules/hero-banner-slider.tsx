'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BannerSlide {
  id: string;
  title: string;
  imageSrc: string;
  fallbackSrc: string;
  alt: string;
}

export const DEFAULT_BANNER_SLIDES: BannerSlide[] = [
  {
    id: 'slide-1',
    title: 'Saatnya Jadi Juara',
    imageSrc: '/slider/Saatnya Jadi Juara.png',
    fallbackSrc: '/slider/banner-1.jpg',
    alt: 'Saatnya Jadi Juara',
  },
  {
    id: 'slide-2',
    title: 'Temukan Semangat\nJuara Sejak Dini',
    imageSrc: '/slider/Temukan Semangat.png',
    fallbackSrc: '/slider/banner-3.jpg',
    alt: 'Temukan Semangat Juara Sejak Dini',
  },
  {
    id: 'slide-3',
    title: 'Bangun Semangatmu\nRaih Prestasi',
    imageSrc: '/slider/Bangun Semangatmu.png',
    fallbackSrc: '/slider/banner-2.jpg',
    alt: 'Bangun Semangatmu Raih Prestasi',
  },
];

interface HeroBannerSliderProps {
  slides?: BannerSlide[];
  autoSlideInterval?: number;
  className?: string;
}

export function HeroBannerSlider({
  slides = DEFAULT_BANNER_SLIDES,
  autoSlideInterval = 5000,
  className = '',
}: HeroBannerSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});
  const touchStartX = useRef<number | null>(null);

  const count = slides.length;

  const goTo = useCallback(
    (index: number) => {
      setCurrentIndex(((index % count) + count) % count);
    },
    [count]
  );

  const nextSlide = useCallback(() => goTo(currentIndex + 1), [goTo, currentIndex]);
  const prevSlide = useCallback(() => goTo(currentIndex - 1), [goTo, currentIndex]);

  // Autoslide timer
  useEffect(() => {
    if (count <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % count);
    }, autoSlideInterval);
    return () => clearInterval(timer);
  }, [count, autoSlideInterval, isPaused]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevSlide();
      if (e.key === 'ArrowRight') nextSlide();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 50) nextSlide();
    if (diff < -50) prevSlide();
    touchStartX.current = null;
  };

  const handleImageError = (slideId: string) => {
    setFailedImages((prev) => ({ ...prev, [slideId]: true }));
  };

  if (count === 0) return null;

  return (
    <div
      className={cn(
        'group relative w-full overflow-hidden bg-slate-950 text-white select-none',
        'h-[340px] sm:h-[440px] md:h-[520px] lg:h-[600px] xl:h-[660px]',
        className
      )}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      aria-label="Carousel Utama Kejuaraan Renang"
    >
      {/* ── SLIDES CONTAINER ── */}
      <div className="relative h-full w-full">
        {slides.map((slide, idx) => {
          const isActive = idx === currentIndex;
          const imgSrc = failedImages[slide.id] ? slide.fallbackSrc : slide.imageSrc;

          return (
            <div
              key={slide.id}
              className={cn(
                'absolute inset-0 h-full w-full transition-opacity duration-1000 ease-in-out',
                isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
              )}
            >
              {/* Background Image with Fallback */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgSrc}
                alt={slide.alt}
                onError={() => handleImageError(slide.id)}
                className="h-full w-full object-cover object-center"
              />

              {/* Dark Overlay for Clean White Text Contrast (Matching rajendrarenang.com) */}
              <div className="absolute inset-0 bg-black/35" />

              {/* Centered Title ONLY (Matching rajendrarenang.com Image #16, #17, #18) */}
              <div className="relative z-10 flex h-full items-center justify-center px-6 sm:px-12 text-center max-w-4xl mx-auto">
                <h1 className="font-heading text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white drop-shadow-[0_2px_12px_rgba(0,0,0,0.65)] whitespace-pre-line leading-tight">
                  {slide.title}
                </h1>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── NAVIGATION ARROWS (< and >) (Matching rajendrarenang.com) ── */}
      <button
        type="button"
        onClick={prevSlide}
        aria-label="Slide Sebelumnya"
        className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center text-white/80 hover:text-white transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer drop-shadow-md"
      >
        <ChevronLeft className="h-8 w-8 sm:h-12 sm:w-12 stroke-[1.75]" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        aria-label="Slide Berikutnya"
        className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 flex h-12 w-12 sm:h-16 sm:w-16 items-center justify-center text-white/80 hover:text-white transition-all duration-200 hover:scale-110 active:scale-95 cursor-pointer drop-shadow-md"
      >
        <ChevronRight className="h-8 w-8 sm:h-12 sm:w-12 stroke-[1.75]" />
      </button>

      {/* ── BOTTOM DOT INDICATOR (Matching rajendrarenang.com) ── */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Buka slide ${i + 1}`}
            onClick={() => goTo(i)}
            className={cn(
              'rounded-full transition-all duration-300 cursor-pointer',
              i === currentIndex
                ? 'w-2 h-2 sm:w-2.5 sm:h-2.5 bg-white shadow-md'
                : 'w-1.5 h-1.5 sm:w-2 sm:h-2 bg-white/40 hover:bg-white/70'
            )}
          />
        ))}
      </div>
    </div>
  );
}
