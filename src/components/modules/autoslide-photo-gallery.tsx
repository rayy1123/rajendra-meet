'use client';

import { useState } from 'react';
import { Camera } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface GalleryPhotoItem {
  id: string;
  imageSrc: string;
  fallbackSrc: string;
  alt: string;
}

// ── ROW 1: 11 FOTO ASLI AKSI KOLAM DARI RAJENDRARENANG.COM ──
export const DEFAULT_ACTION_PHOTOS: GalleryPhotoItem[] = [
  { id: 'act-1', imageSrc: '/gallery/swiper1.jpg', fallbackSrc: '/slider/hero-1.jpg', alt: 'Aksi perlombaan renang Rajendra Meet 1' },
  { id: 'act-2', imageSrc: '/gallery/swiper2.jpg', fallbackSrc: '/slider/hero-2.jpg', alt: 'Aksi perlombaan renang Rajendra Meet 2' },
  { id: 'act-3', imageSrc: '/gallery/swiper3.jpg', fallbackSrc: '/slider/about-1.jpg', alt: 'Aksi perlombaan renang Rajendra Meet 3' },
  { id: 'act-4', imageSrc: '/gallery/swiper44.jpg', fallbackSrc: '/slider/about-3.jpg', alt: 'Aksi perlombaan renang Rajendra Meet 4' },
  { id: 'act-5', imageSrc: '/gallery/swiper5.jpg', fallbackSrc: '/slider/hero-3.jpg', alt: 'Aksi perlombaan renang Rajendra Meet 5' },
  { id: 'act-6', imageSrc: '/gallery/swiper6.jpg', fallbackSrc: '/slider/hero-4.jpg', alt: 'Aksi perlombaan renang Rajendra Meet 6' },
  { id: 'act-7', imageSrc: '/gallery/swiper7.jpg', fallbackSrc: '/slider/hero-1.jpg', alt: 'Aksi perlombaan renang Rajendra Meet 7' },
  { id: 'act-8', imageSrc: '/gallery/swiper8.jpg', fallbackSrc: '/slider/hero-2.jpg', alt: 'Aksi perlombaan renang Rajendra Meet 8' },
  { id: 'act-9', imageSrc: '/gallery/swiper9.jpg', fallbackSrc: '/slider/about-2.jpg', alt: 'Aksi perlombaan renang Rajendra Meet 9' },
  { id: 'act-10', imageSrc: '/gallery/swiper10.jpg', fallbackSrc: '/slider/hero-3.jpg', alt: 'Aksi perlombaan renang Rajendra Meet 10' },
  { id: 'act-11', imageSrc: '/gallery/swiper11.jpg', fallbackSrc: '/slider/hero-4.jpg', alt: 'Aksi perlombaan renang Rajendra Meet 11' },
];

// ── ROW 2: 11 FOTO ASLI JUARA & PODIUM DARI RAJENDRARENANG.COM ──
export const DEFAULT_PODIUM_PHOTOS: GalleryPhotoItem[] = [
  { id: 'pod-1', imageSrc: '/gallery/swiper17.jpg', fallbackSrc: '/slider/about-2.jpg', alt: 'Juara dan medalis kejuaraan renang 1' },
  { id: 'pod-2', imageSrc: '/gallery/swiper18.jpg', fallbackSrc: '/slider/about-4.jpg', alt: 'Juara dan medalis kejuaraan renang 2' },
  { id: 'pod-3', imageSrc: '/gallery/swiper19.jpg', fallbackSrc: '/slider/hero-2.jpg', alt: 'Juara dan medalis kejuaraan renang 3' },
  { id: 'pod-4', imageSrc: '/gallery/swiper20.jpg', fallbackSrc: '/slider/hero-1.jpg', alt: 'Juara dan medalis kejuaraan renang 4' },
  { id: 'pod-5', imageSrc: '/gallery/swiper21.jpg', fallbackSrc: '/slider/about-1.jpg', alt: 'Juara dan medalis kejuaraan renang 5' },
  { id: 'pod-6', imageSrc: '/gallery/swiper22.jpg', fallbackSrc: '/slider/hero-4.jpg', alt: 'Juara dan medalis kejuaraan renang 6' },
  { id: 'pod-7', imageSrc: '/gallery/swiper12.jpg', fallbackSrc: '/slider/about-3.jpg', alt: 'Juara dan medalis kejuaraan renang 7' },
  { id: 'pod-8', imageSrc: '/gallery/swiper13.jpg', fallbackSrc: '/slider/hero-1.jpg', alt: 'Juara dan medalis kejuaraan renang 8' },
  { id: 'pod-9', imageSrc: '/gallery/swiper14.jpg', fallbackSrc: '/slider/hero-2.jpg', alt: 'Juara dan medalis kejuaraan renang 9' },
  { id: 'pod-10', imageSrc: '/gallery/swiper15.jpg', fallbackSrc: '/slider/about-4.jpg', alt: 'Juara dan medalis kejuaraan renang 10' },
  { id: 'pod-11', imageSrc: '/gallery/swiper16.jpg', fallbackSrc: '/slider/hero-3.jpg', alt: 'Juara dan medalis kejuaraan renang 11' },
];

interface AutoslidePhotoGalleryProps {
  actionPhotos?: GalleryPhotoItem[];
  podiumPhotos?: GalleryPhotoItem[];
  className?: string;
}

export function AutoslidePhotoGallery({
  actionPhotos = DEFAULT_ACTION_PHOTOS,
  podiumPhotos = DEFAULT_PODIUM_PHOTOS,
  className = '',
}: AutoslidePhotoGalleryProps) {
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleImageError = (id: string) => {
    setFailedImages((prev) => ({ ...prev, [id]: true }));
  };

  // Duplikasi items untuk membuat looping infinite marquee mulus tanpa jeda
  const row1Items = [...actionPhotos, ...actionPhotos];
  const row2Items = [...podiumPhotos, ...podiumPhotos];

  return (
    <section className={cn('relative w-full overflow-hidden py-10 sm:py-14 space-y-6', className)}>
      {/* ── HEADER GALERI DENGAN CHIP ELEGAN ── */}
      <div className="pub-container text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)] border border-[var(--m-aqua)]/20 shadow-2xs">
            <Camera className="h-3 w-3 text-[var(--m-aqua)]" />
            GALERI MOMEN PERLOMBAAN
          </span>
        </div>
        <h2 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-950">
          Semangat &amp; Atmosfer Kompetisi Nyata
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Dari ketegangan di atas start block, kerja keras pelatih di tepi kolam, hingga senyum kebanggaan di atas podium juara.
        </p>
      </div>

      {/* ── GRADIENT FADE EDGES (KIRI & KANAN) UNTUK TRANSISI HALUS ── */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-12 sm:w-28 bg-gradient-to-r from-[var(--m-bg)] to-transparent z-10" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-12 sm:w-28 bg-gradient-to-l from-[var(--m-bg)] to-transparent z-10" />

      {/* ── ROW 1: AKSI LOMBA & TEPI KOLAM (AUTO-SLIDE KE KIRI) - FOTO BERSIH TANPA TEKS ── */}
      <div className="relative w-full overflow-hidden">
        <div className="animate-marquee flex items-center gap-4 sm:gap-5">
          {row1Items.map((item, idx) => {
            const uniqueKey = `${item.id}-r1-${idx}`;
            const src = failedImages[uniqueKey] ? item.fallbackSrc : item.imageSrc;

            return (
              <div
                key={uniqueKey}
                className="group/card relative shrink-0 w-64 sm:w-80 md:w-96 aspect-[16/10] overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-cyan-300 cursor-pointer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={item.alt}
                  onError={() => handleImageError(uniqueKey)}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                  loading="lazy"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ── ROW 2: PODIUM CEREMONY & JUARA (AUTO-SLIDE KE KANAN) - FOTO BERSIH TANPA TEKS ── */}
      <div className="relative w-full overflow-hidden">
        <div className="animate-marquee-reverse flex items-center gap-4 sm:gap-5">
          {row2Items.map((item, idx) => {
            const uniqueKey = `${item.id}-r2-${idx}`;
            const src = failedImages[uniqueKey] ? item.fallbackSrc : item.imageSrc;

            return (
              <div
                key={uniqueKey}
                className="group/card relative shrink-0 w-64 sm:w-80 md:w-96 aspect-[16/10] overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white shadow-md transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 hover:border-amber-300 cursor-pointer"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={src}
                  alt={item.alt}
                  onError={() => handleImageError(uniqueKey)}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover/card:scale-105"
                  loading="lazy"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
