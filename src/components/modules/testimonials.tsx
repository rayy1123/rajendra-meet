'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { ChevronLeft, ChevronRight, Quote } from 'lucide-react';

export interface Testimonial {
  text: string;
  name: string;
  role: string;
}

/**
 * Carousel testimoni (adaptasi dari slider OwlCarousel di landing page
 * referensi). Auto-play + navigasi prev/next + dot indicator. Tema Marine,
 * ringan, tanpa dependensi eksternal.
 */
export function Testimonials({ items }: { items: Testimonial[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = items.length;
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const go = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (paused || count <= 1) return;
    timer.current = setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, 5000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, count]);

  if (count === 0) return null;

  return (
    <div
      className="relative mx-auto max-w-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative overflow-hidden rounded-3xl border border-[var(--m-border)] bg-[var(--m-surface)] p-8 shadow-sm sm:p-12">
        <Quote className="absolute right-6 top-6 h-8 w-8 text-[var(--m-aqua-soft)]" />

        {/* Track */}
        <div
          className="flex transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {items.map((t, i) => (
            <figure
              key={i}
              className="w-full shrink-0 px-2 text-center"
              aria-hidden={i !== index}
            >
              <blockquote className="text-base leading-relaxed text-[var(--m-ink)] sm:text-lg">
                “{t.text}”
              </blockquote>
              <figcaption className="mt-5">
                <div className="text-sm font-bold text-[var(--m-ink)]">{t.name}</div>
                <div className="text-xs font-medium text-[var(--m-muted)]">{t.role}</div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>

      {count > 1 && (
        <>
          <button
            type="button"
            aria-label="Testimoni sebelumnya"
            onClick={() => go(index - 1)}
            className="absolute -left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--m-border)] bg-[var(--m-surface)] text-[var(--m-ink)] shadow-sm transition-colors hover:bg-[var(--m-aqua-soft)] sm:-left-5"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            aria-label="Testimoni berikutnya"
            onClick={() => go(index + 1)}
            className="absolute -right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-[var(--m-border)] bg-[var(--m-surface)] text-[var(--m-ink)] shadow-sm transition-colors hover:bg-[var(--m-aqua-soft)] sm:-right-5"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="mt-6 flex justify-center gap-2">
            {items.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Pergi ke testimoni ${i + 1}`}
                onClick={() => go(i)}
                className={`h-2 rounded-full transition-all ${
                  i === index
                    ? 'w-6 bg-[var(--m-aqua)]'
                    : 'w-2 bg-[var(--m-border)] hover:bg-[var(--m-aqua-soft)]'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
