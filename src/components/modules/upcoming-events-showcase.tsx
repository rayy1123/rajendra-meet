'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Trophy,
  CalendarDays,
  MapPin,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Award,
  ZoomIn,
  X,
  Download,
} from 'lucide-react';
import { ShowcaseItem, getCachedShowcases, DEFAULT_POSTERS } from '@/lib/data/landing-showcases';
import { cn } from '@/lib/utils';

export interface UpcomingEventItem {
  id: string;
  name: string;
  location: string | null;
  organizer: string | null;
  start_date: string;
  end_date: string;
  logo_url: string | null;
}

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatTanggal(iso: string): { hari: string; bulan: string; tahun: string } {
  const d = new Date(iso + 'T00:00:00');
  return {
    hari: String(d.getDate()).padStart(2, '0'),
    bulan: BULAN[d.getMonth()],
    tahun: String(d.getFullYear()),
  };
}

function formatRentang(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

interface UpcomingEventsShowcaseProps {
  initialPosters: ShowcaseItem[];
  events: UpcomingEventItem[];
}

export function UpcomingEventsShowcase({ initialPosters, events }: UpcomingEventsShowcaseProps) {
  const [posters, setPosters] = useState<ShowcaseItem[]>(() => {
    const cached = getCachedShowcases('poster');
    if (cached && cached.length > 0) return cached;
    if (initialPosters && initialPosters.length > 0) return initialPosters;
    return DEFAULT_POSTERS;
  });
  const [previewPoster, setPreviewPoster] = useState<ShowcaseItem | null>(null);

  // Sinkronisasi realtime jika ada perubahan dari halaman Kelola Beranda
  useEffect(() => {
    const updateFromCache = () => {
      const cached = getCachedShowcases('poster');
      if (cached && cached.length > 0) {
        setPosters(cached);
      }
    };

    updateFromCache();

    const handleCustomEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ type: string; items: ShowcaseItem[] }>;
      if (customEvent.detail?.type === 'poster') {
        setPosters(customEvent.detail.items);
      }
    };

    window.addEventListener('storage', updateFromCache);
    window.addEventListener('scms_showcases_updated', handleCustomEvent);

    return () => {
      window.removeEventListener('storage', updateFromCache);
      window.removeEventListener('scms_showcases_updated', handleCustomEvent);
    };
  }, []);

  const activePosters = posters.filter((p) => p.isActive);
  const hasContent = activePosters.length > 0 || events.length > 0;

  if (!hasContent) {
    return (
      <div className="pub-card p-12 text-center">
        <Trophy className="mx-auto h-10 w-10 text-[var(--m-aqua)]" />
        <h3 className="mt-3 font-semibold text-[var(--m-ink)]">Belum ada lomba mendatang</h3>
        <p className="mt-1 text-sm text-[var(--m-muted)]">
          Pantau terus — kejuaraan berikutnya akan segera dibuka pendaftarannya.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 1. POSTER LOMBA RESMI DARI KELOLA BERANDA */}
      {activePosters.length > 0 && (
        <div className="space-y-6">
          {activePosters.map((poster) => (
            <div
              key={poster.id}
              className="pub-card overflow-hidden transition-all duration-300 hover:shadow-lg border border-[var(--m-border)]/80 bg-white"
            >
              <div className="flex flex-col lg:flex-row items-center gap-6 sm:gap-8 p-6 sm:p-8">
                {/* Gambar Poster Flyer */}
                <div
                  onClick={() => poster.imageUrl && setPreviewPoster(poster)}
                  className={cn(
                    'relative shrink-0 w-full sm:w-80 md:w-96 lg:w-[400px] group overflow-hidden rounded-2xl border border-slate-200 shadow-md bg-slate-900 aspect-[4/5] flex items-center justify-center transition-all duration-300 hover:shadow-xl',
                    poster.imageUrl && 'cursor-pointer',
                  )}
                  title={poster.imageUrl ? 'Klik untuk melihat poster resolusi penuh (HD)' : undefined}
                >
                  {poster.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={poster.imageUrl}
                      alt={poster.title}
                      className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-2 p-6 text-center text-slate-400">
                      <Trophy className="h-12 w-12 text-slate-300" />
                      <span className="text-xs font-semibold">Flyer Poster Kejuaraan</span>
                    </div>
                  )}
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-600/95 backdrop-blur-sm text-white text-[11px] font-bold shadow-sm uppercase tracking-wider">
                      <Sparkles className="h-3 w-3" /> Pendaftaran Dibuka
                    </span>
                  </div>

                  {poster.imageUrl && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-black/70 backdrop-blur-md text-xs font-bold border border-white/20 shadow-lg">
                        <ZoomIn className="h-4 w-4 text-blue-400" /> Lihat Ukuran Penuh (HD)
                      </span>
                    </div>
                  )}
                </div>

                {/* Konten & Deskripsi Poster */}
                <div className="flex-1 space-y-4 text-center lg:text-left">
                  <div className="space-y-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)] text-xs font-bold w-fit mx-auto lg:mx-0">
                      <Award className="h-4 w-4 text-[var(--m-aqua)]" /> Official Tournament Announcement
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-black text-[var(--m-ink)] tracking-tight leading-tight">
                      {poster.title}
                    </h3>
                    {poster.subtitle && (
                      <p className="text-base sm:text-lg text-[var(--m-muted)] font-medium leading-relaxed">
                        {poster.subtitle}
                      </p>
                    )}
                  </div>

                  <div className="pt-2 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                    <Link
                      href={poster.linkUrl || '/daftar-lomba'}
                      className="pub-btn-primary gap-2 text-sm font-bold px-6 py-3 shadow-md"
                    >
                      Daftar Lomba Sekarang <ArrowRight className="h-4 w-4" />
                    </Link>
                    {poster.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setPreviewPoster(poster)}
                        className="hidden"
                      >
                        Perbesar Poster HD
                      </button>
                    )}
                    <Link
                      href="/scoreboard"
                      className="pub-btn-ghost gap-2 text-sm font-semibold px-5 py-3 border border-slate-200"
                    >
                      Lihat Jadwal & Hasil
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 2. DAFTAR KEJUARAAN DARI DATABASE EVENTS */}
      {events.length > 0 && (
        <div className="space-y-4 pt-2">
          {activePosters.length > 0 && (
            <div className="border-t border-slate-200 pt-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">
                Daftar Kejuaraan Aktif Lainnya
              </h3>
            </div>
          )}

          <div className="space-y-4">
            {events.map((ev) => {
              const tgl = formatTanggal(ev.start_date);
              return (
                <div key={ev.id} className="pub-card overflow-hidden">
                  <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
                    {/* Tanggal */}
                    <div className="flex w-full shrink-0 items-center gap-3 sm:w-32 sm:flex-col sm:items-center sm:gap-0">
                      <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-[var(--m-aqua)] text-white sm:h-24 sm:w-24">
                        <span className="text-2xl font-black leading-none sm:text-3xl">{tgl.hari}</span>
                        <span className="text-xs font-semibold uppercase tracking-wide">{tgl.bulan.slice(0, 3)}</span>
                        <span className="text-[10px] font-medium opacity-90">{tgl.tahun}</span>
                      </div>
                    </div>

                    {/* Detail */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold leading-snug text-[var(--m-ink)]">{ev.name}</h3>
                      {ev.organizer && (
                        <p className="mt-0.5 text-xs font-medium text-[var(--m-aqua-ink)]">{ev.organizer}</p>
                      )}
                      {ev.location && (
                        <p className="mt-1.5 flex items-center gap-2 text-sm text-[var(--m-muted)]">
                          <MapPin className="h-4 w-4 text-[var(--m-aqua)]" /> {ev.location}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--m-muted)]">
                        <span className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-[var(--m-aqua)]" />
                          {formatRentang(ev.start_date)}
                          {ev.end_date !== ev.start_date && ` s/d ${formatRentang(ev.end_date)}`}
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="shrink-0 sm:w-44 flex flex-col sm:flex-row gap-2">
                      <Link
                        href={`/daftar-lomba/${ev.id}`}
                        className="pub-btn-primary w-full text-center text-xs"
                      >
                        Daftar Lomba
                      </Link>
                      <Link
                        href={`/scoreboard?event=${ev.id}`}
                        className="pub-btn-ghost w-full text-center text-xs"
                      >
                        Scoreboard
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox Modal untuk Melihat Poster Resolusi Penuh (Full HD) */}
      {previewPoster && previewPoster.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 animate-in fade-in"
          onClick={() => setPreviewPoster(null)}
        >
          <div
            className="relative max-w-5xl max-h-[94vh] w-full flex flex-col items-center bg-slate-950 rounded-2xl border border-white/15 overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Modal */}
            <div className="w-full flex items-center justify-between px-5 py-3 text-white border-b border-white/10 bg-slate-900/90">
              <div className="flex items-center gap-2.5">
                <span className="font-bold text-sm sm:text-base text-slate-100">{previewPoster.title}</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-500/30">
                  Resolusi Penuh HD
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewPoster.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Download className="h-3.5 w-3.5" /> Buka Tab Baru / Unduh
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewPoster(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Tutup"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Poster Body Full Screen Zoom */}
            <div className="overflow-auto max-h-[84vh] w-full p-3 sm:p-6 flex items-center justify-center bg-slate-950/60">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewPoster.imageUrl}
                alt={previewPoster.title}
                className="max-h-[80vh] w-auto object-contain rounded-lg shadow-2xl border border-white/10"
                style={{ imageRendering: 'auto' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
