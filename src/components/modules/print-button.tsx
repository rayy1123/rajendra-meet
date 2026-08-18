'use client';

import { Printer } from 'lucide-react';

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="ml-auto hidden items-center gap-2 rounded-lg border border-primary px-3 py-1.5 text-sm font-medium text-primary hover:bg-primary hover:text-primary-foreground sm:inline-flex"
    >
      <Printer className="h-4 w-4" /> Cetak
    </button>
  );
}
