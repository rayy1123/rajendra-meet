'use client';

import { useRef, useState } from 'react';

export type MapRef = {
  easeTo: (opts: Record<string, unknown>) => void;
  getMap: () => HTMLIFrameElement | null;
};

export function Map({
  center,
  zoom,
  className,
  query,
}: {
  center?: [number, number];
  zoom?: number;
  className?: string;
  query?: string;
  ref?: React.Ref<MapRef>;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  const q = query ? encodeURIComponent(query) : 'Jl. Setu Babakan No. 14A, Jagakarsa, Jakarta Selatan';
  // Gunakan Google Maps iframe embed yang paling handal dan tanpa API key restriction
  const src = `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3965.234567!2d106.8273!3d-6.3426!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zNsKwMjAnMzMuNCJTIDEwNsKwNDknMzguMiJF!5e0!3m2!1sid!2sid!4v1600000000000!5m2!1sid!2sid`;
  // Alternatif dengan query text search standard
  const srcSearch = `https://maps.google.com/maps?q=${q}&output=embed`;

  return (
    <div className="relative h-full w-full bg-slate-100 overflow-hidden">
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100 text-xs text-muted-foreground z-10">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Memuat peta lokasi...</span>
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="Peta Kantor Rajendra Meet"
        src={srcSearch}
        onLoad={() => setLoaded(true)}
        className={className ?? 'h-full w-full border-0'}
        allowFullScreen
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
