'use client';

import { useRef } from 'react';
import { Map, type MapRef } from '@/components/ui/map';

export function KontakMap() {
  const mapRef = useRef<MapRef>(null);

  return (
    <div className="relative h-[420px] w-full">
      <Map
        ref={mapRef}
        center={[106.775, -6.335]}
        zoom={15}
      />
    </div>
  );
}
