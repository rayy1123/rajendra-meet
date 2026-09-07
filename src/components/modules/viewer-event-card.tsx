'use client';

import Link from 'next/link';
import { Waves, CalendarDays, MapPin, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ViewerEventCardProps {
  id: string;
  name: string;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  lane_count?: number | null;
  pool_type?: string | null;
  href?: string;
}

export function ViewerEventCard({
  id,
  name,
  location,
  start_date,
  end_date,
  lane_count,
  pool_type,
  href = `/daftar-lomba/${id}`,
}: ViewerEventCardProps) {
  return (
    <Link href={href} className="group relative overflow-hidden rounded-2xl border border-[var(--m-border)] bg-white shadow-sm transition-ui hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative h-32 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#d9f0d9] via-[#cfe8ff] to-[#eef6ff]" />
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/40 blur-2xl" />
        <div className="absolute -left-4 -bottom-6 h-24 w-24 rounded-full bg-[var(--m-aqua)]/10 blur-2xl" />
        <div className="absolute inset-0">
          <img
            src="/brand/logo.png"
            alt="Rajendra Meet"
            className="h-full w-full object-contain p-4 opacity-80"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-2 left-3 right-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/90">Swimming Event</p>
          <p className="text-xs font-medium text-white/80 line-clamp-1">{name}</p>
        </div>
      </div>

      <div className="space-y-2 p-4">
        <h3 className="text-sm font-bold text-[var(--m-ink)] line-clamp-2">{name}</h3>
        <div className="space-y-1.5 text-xs text-[var(--m-muted)]">
          {location && (
            <p className="flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5 text-[var(--m-aqua)]" /> {location}
            </p>
          )}
          {(start_date || end_date) && (
            <p className="flex items-center gap-2">
              <CalendarDays className="h-3.5 w-3.5 text-[var(--m-aqua)]" />
              {start_date ?? ''}{start_date && end_date ? ' s/d ' : ''}{end_date ?? ''}
            </p>
          )}
          <p className="flex items-center gap-2">
            <Waves className="h-3.5 w-3.5 text-[var(--m-aqua)]" /> {pool_type || 'Kolam Renang'} • {lane_count || 8} lintasan
          </p>
        </div>
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[var(--m-aqua-ink)]">
          Daftar <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}
