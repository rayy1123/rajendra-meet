'use client';

import { useState } from 'react';
import { Download, Images } from 'lucide-react';

interface Photo {
  src: string;
  name: string;
  group: string;
}

const FILTERS = ['All Photos', 'Action Shots', 'Award Ceremonies', 'Behind the Scenes'];

export function GalleryGrid({ photos }: { photos: Photo[] }) {
  const [active, setActive] = useState('All Photos');

  const shown =
    active === 'All Photos' ? photos : photos.filter((p) => p.group === active);

  if (photos.length === 0) {
    return (
      <div className="pub-card p-12 text-center">
        <Images className="mx-auto h-10 w-10 text-[var(--m-aqua)]" />
        <h3 className="mt-3 font-semibold text-[var(--m-ink)]">Galeri masih kosong</h3>
        <p className="mt-1 text-sm text-[var(--m-muted)]">
          Dokumentasi foto kejuaraan akan tampil di sini setelah panitia
          mengunggahnya.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActive(f)}
            className={
              active === f
                ? 'inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground'
                : 'inline-flex items-center gap-1.5 rounded-full border border-border px-4 py-1.5 text-sm text-[var(--m-muted)] hover:bg-[var(--m-soft)]'
            }
          >
            {f === 'Award Ceremonies' ? '🏅' : f === 'Behind the Scenes' ? '👥' : '🌊'} {f}
          </button>
        ))}
        <span className="ml-auto text-xs text-[var(--m-muted)]">{shown.length} foto</span>
      </div>

      <div className="columns-1 gap-6 sm:columns-2 lg:columns-3 [&>*]:mb-6">
        {shown.map((p) => (
          <figure
            key={p.src}
            className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-sm break-inside-avoid"
          >
            <img
              src={p.src}
              alt={p.name}
              className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              loading="lazy"
            />
            <div className="absolute inset-0 flex flex-col justify-between bg-gradient-to-t from-black/50 to-transparent p-3 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="flex justify-end">
                <a
                  href={p.src}
                  download
                  className="rounded-full bg-white/90 p-1.5 text-[var(--m-ink)] hover:bg-white"
                  title="Unduh"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>
              <figcaption className="self-start rounded bg-white/90 px-2 py-1 text-xs font-medium text-[var(--m-ink)]">
                {p.name}
              </figcaption>
            </div>
          </figure>
        ))}
      </div>
    </>
  );
}
