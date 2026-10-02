'use client';

import { MapPin, Navigation, ExternalLink, Clock } from 'lucide-react';
import { Map } from '@/components/ui/map';

const ADDRESS_LABEL = 'South Jakarta';
const FULL_ADDRESS = 'Jl. Setu Babakan No. 14A, Srengseng Sawah, Jagakarsa, Jakarta Selatan';
const GOOGLE_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  FULL_ADDRESS
)}`;

export function KontakMap() {
  return (
    <div className="rounded-3xl border border-slate-200/90 bg-white p-3 sm:p-5 shadow-sm space-y-3">
      {/* Container Peta Google Maps Rounded Sesuai Screenshot */}
      <div className="relative h-[380px] sm:h-[460px] md:h-[500px] w-full overflow-hidden rounded-2xl border border-slate-200 shadow-2xs">
        <Map
          query="South Jakarta"
          zoom={11}
          className="h-full w-full border-0"
        />
      </div>

      {/* Info Bar Lokasi & Petunjuk Arah */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 px-2 pt-1 text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
          <span>{FULL_ADDRESS}</span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={GOOGLE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors"
          >
            <Navigation className="h-3.5 w-3.5" />
            Petunjuk Arah
          </a>
          <a
            href={GOOGLE_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors"
          >
            <ExternalLink className="h-3 w-3 text-slate-500" />
            Buka Google Maps
          </a>
        </div>
      </div>
    </div>
  );
}
