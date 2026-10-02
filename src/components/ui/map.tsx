'use client';

import { useRef, useState } from 'react';

export type MapRef = {
  easeTo: (opts: Record<string, unknown>) => void;
  getMap: () => HTMLIFrameElement | null;
};

export function Map({
  center,
  zoom = 11,
  className,
  query = 'South Jakarta',
}: {
  center?: [number, number];
  zoom?: number;
  className?: string;
  query?: string;
  ref?: React.Ref<MapRef>;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  const q = encodeURIComponent(query || 'South Jakarta');
  const z = zoom ?? 11;
  const srcSearch = `https://maps.google.com/maps?q=${q}&t=&z=${z}&ie=UTF8&iwloc=&output=embed`;

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
        title={`Peta Lokasi - ${query}`}
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
