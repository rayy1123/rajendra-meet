'use client';

import { useRef, useState, useEffect } from 'react';

export type MapRef = {
  easeTo: (opts: Record<string, unknown>) => void;
  getMap: () => HTMLIFrameElement | null;
};

// Official Google Maps Embed PB for South Jakarta (Jakarta Selatan)
const SOUTH_JAKARTA_EMBED_SRC =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126915.40798150499!2d106.7380963556017!3d-6.284879133469854!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f1ec2422b0b3%3A0x39a0d0da47406648!2sJakarta%20Selatan%2C%20Kota%20Jakarta%20Selatan%2C%20Daerah%20Khusus%20Ibukota%20Jakarta!5e0!3m2!1sen!2sid!4v1710000000000!5m2!1sen!2sid';

export function Map({
  center,
  zoom = 11,
  className,
  query = 'South Jakarta',
  embedSrc,
}: {
  center?: [number, number];
  zoom?: number;
  className?: string;
  query?: string;
  embedSrc?: string;
  ref?: React.Ref<MapRef>;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Fallback timer: pastikan overlay loading hilang otomatis maksimal dalam 1.5 detik
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoaded(true);
    }, 1500);
    return () => clearTimeout(timer);
  }, []);

  const src =
    embedSrc ||
    (query === 'South Jakarta' || !query
      ? SOUTH_JAKARTA_EMBED_SRC
      : `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d126915.40798150499!2d106.7380963556017!3d-6.284879133469854!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f1ec2422b0b3%3A0x39a0d0da47406648!2sJakarta%20Selatan%2C%20Kota%20Jakarta%20Selatan%2C%20Daerah%20Khusus%20Ibukota%20Jakarta!5e0!3m2!1sen!2sid!4v1710000000000!5m2!1sen!2sid`);

  return (
    <div className="relative h-full w-full bg-slate-100 overflow-hidden">
      {!loaded && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-2 bg-slate-100/90 text-xs text-muted-foreground z-10 transition-opacity duration-300">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <span>Memuat peta lokasi...</span>
        </div>
      )}
      <iframe
        ref={iframeRef}
        title="Peta Lokasi South Jakarta"
        src={src}
        onLoad={() => setLoaded(true)}
        className={className ?? 'h-full w-full border-0'}
        allowFullScreen
        loading="eager"
        referrerPolicy="no-referrer-when-downgrade"
      />
    </div>
  );
}
