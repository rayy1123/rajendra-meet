'use client';

import { useEffect } from 'react';
import { Waves, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Waves className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-xl font-bold tracking-tight text-foreground">
          Terjadi kesalahan
        </h1>
        <p className="mt-2 flex items-start justify-center gap-2 text-sm text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
          Halaman tidak dapat dimuat. Silakan coba kembali.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs text-muted-foreground/70">Kode: {error.digest}</p>
        )}
        <Button onClick={reset} className="mt-6 w-full">
          Coba Lagi
        </Button>
      </div>
    </div>
  );
}
