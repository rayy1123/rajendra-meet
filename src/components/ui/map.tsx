'use client';

import { useRef } from 'react';

export type MapRef = {
  easeTo: (opts: Record<string, unknown>) => void;
  getMap: () => HTMLIFrameElement | null;
};

export function Map({
  center,
  zoom,
  className,
  ref,
}: {
  center?: [number, number];
  zoom?: number;
  className?: string;
  ref?: React.Ref<MapRef>;
}) {
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const resolvedRef = useRef<MapRef | null>(null);

  const lng = center?.[0] ?? 106.775;
  const lat = center?.[1] ?? -6.335;
  const z = zoom ?? 15;

  resolvedRef.current = {
    easeTo: () => {},
    getMap: () => iframeRef.current,
  };

  if (typeof ref === 'function') ref(resolvedRef.current);
  else if (ref) (ref as React.MutableRefObject<MapRef | null>).current = resolvedRef.current;

  const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01},${lat - 0.01},${lng + 0.01},${lat + 0.01}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <iframe
      ref={iframeRef}
      title="map"
      src={src}
      className={className ?? 'h-[420px] w-full border-0'}
      allowFullScreen
      loading="lazy"
    />
  );
}
