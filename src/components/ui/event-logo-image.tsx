'use client';

import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';

interface EventLogoImageProps {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackIconClassName?: string;
}

/**
 * Komponen gambar logo kejuaraan yang aman:
 * Jika gambar belum ada, gagal dimuat (404/network error), atau URL tidak valid,
 * secara otomatis menampilkan fallback ikon Trofi resmi tanpa menampilkan ikon gambar rusak (broken image).
 */
export function EventLogoImage({
  src,
  alt,
  className = 'h-full w-full object-contain p-1',
  fallbackIconClassName = 'h-6 w-6 text-blue-600',
}: EventLogoImageProps) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (!src || hasError) {
    return <Trophy className={fallbackIconClassName} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  );
}
