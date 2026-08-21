"use client";

import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Photo {
  src: string;
  alt: string;
}

const DEFAULT_PHOTOS: Photo[] = [
  { src: "/slider/hero-1.jpg", alt: "Atlet renang di start block" },
  { src: "/slider/hero-2.jpg", alt: "Atlet gaya bebas mid-stroke" },
  { src: "/slider/hero-3.jpg", alt: "Atlet gaya dada menyentuh dinding" },
  { src: "/slider/hero-4.jpg", alt: "Anak-anak berenang ceria" },
];

export const ABOUT_PHOTOS: Photo[] = [
  { src: "/slider/about-1.jpg", alt: "Pelatih & atlet di tepi kolam" },
  { src: "/slider/about-2.jpg", alt: "Start gaya punggung" },
  { src: "/slider/about-3.jpg", alt: "Sentuhan finish dengan timer" },
  { src: "/slider/about-4.jpg", alt: "Latihan di beberapa lane" },
];

export function PhotoSlider({
  photos = DEFAULT_PHOTOS,
  interval = 4500,
  className = "",
}: {
  photos?: Photo[];
  interval?: number;
  className?: string;
}) {
  const [index, setIndex] = useState(0);
  const count = photos.length;

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count]
  );
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  useEffect(() => {
    if (count <= 1) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % count), interval);
    return () => clearInterval(t);
  }, [count, interval]);

  if (count === 0) return null;

  return (
    <div className={`group relative overflow-hidden rounded-3xl soft-shadow-lg ${className}`}>
      <div
        className="slider-track h-full"
        style={{ transform: `translateX(-${index * 100}%)` }}
      >
        {photos.map((p, i) => (
          <div key={i} className="relative h-full w-full shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={p.src}
              alt={p.alt}
              className="h-full w-full object-cover"
              loading={i === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
          </div>
        ))}
      </div>

      {/* Panah */}
      <button
        type="button"
        aria-label="Foto sebelumnya"
        onClick={prev}
        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-[var(--m-ink)] opacity-0 shadow transition-opacity hover:bg-white group-hover:opacity-100"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        type="button"
        aria-label="Foto berikutnya"
        onClick={next}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 text-[var(--m-ink)] opacity-0 shadow transition-opacity hover:bg-white group-hover:opacity-100"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
        {photos.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Ke foto ${i + 1}`}
            onClick={() => go(i)}
            className={`h-2 rounded-full transition-all ${
              i === index ? "w-6 bg-white" : "w-2 bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
