'use client';

import { MapPin, Navigation, ExternalLink, Clock } from 'lucide-react';
import { Map } from '@/components/ui/map';

const ADDRESS_LABEL = 'Jl. Setu Babakan No. 14A, Srengseng Sawah, Jagakarsa, Jakarta Selatan';
const GOOGLE_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  ADDRESS_LABEL
)}`;

export function KontakMap() {
  return (
    <div className="relative h-[440px] sm:h-[480px] w-full overflow-hidden rounded-3xl border border-[var(--m-border)] shadow-md">
      {/* Peta Interaktif Otomatis Tampil */}
      <Map
        query={ADDRESS_LABEL}
        center={[106.8273, -6.3426]}
        zoom={16}
        className="h-full w-full border-0"
      />

      {/* Kartu Informasi Mengambang */}
      <div className="absolute top-4 left-4 z-10 max-w-xs sm:max-w-sm rounded-2xl border border-[var(--m-border)] bg-white/95 p-4 shadow-lg backdrop-blur-md transition-all sm:top-5 sm:left-5">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--m-aqua)] to-[var(--m-aqua-deep)] text-white shadow-xs">
            <MapPin className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-[var(--m-ink)]">
              Kantor Rajendra Meet
            </h4>
            <p className="mt-1 text-xs leading-relaxed text-[var(--m-muted)]">
              Jl. Setu Babakan No. 14A, Srengseng Sawah, Jagakarsa, Jakarta Selatan
            </p>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-emerald-600">
              <Clock className="h-3.5 w-3.5" />
              <span>Buka Setiap Hari · 08.00 - 21.00 WIB</span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--m-aqua)] px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-colors hover:bg-[var(--m-aqua-ink)]"
              >
                <Navigation className="h-3.5 w-3.5" />
                Petunjuk Arah
              </a>
              <a
                href={GOOGLE_MAPS_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 rounded-lg border border-[var(--m-border)] bg-white px-2.5 py-1.5 text-xs font-medium text-[var(--m-ink)] hover:bg-[var(--m-soft)]"
              >
                <ExternalLink className="h-3 w-3 text-[var(--m-muted)]" />
                Google Maps
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
