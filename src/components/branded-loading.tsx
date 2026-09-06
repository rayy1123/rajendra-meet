'use client';

import Image from 'next/image';

export function BrandedLoading({ text = 'Memuat...' }: { text?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3">
      <Image src="/brand/logo.png" alt="Rajendra Meet" width={220} height={48} priority className="h-12 w-auto" />
      {text ? <p className="text-sm text-[var(--m-muted)]">{text}</p> : null}
    </div>
  );
}
