'use client';

import Image from 'next/image';

export function BrandedSpinner({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center justify-center ${className}`}>
      <Image src="/brand/logo.png" alt="Rajendra Meet" width={24} height={24} priority className="h-full w-auto" />
    </span>
  );
}
