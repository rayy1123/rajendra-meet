'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BrandedLoadingProps extends React.HTMLAttributes<HTMLDivElement> {
  text?: string;
  fullScreen?: boolean;
}

/**
 * Route / Page Loading resmi SCMS sesuai DESIGN.md:
 * Menampilkan logo tajam `/brand/logo.png` tanpa backdrop-blur yang mengaburkan logo.
 */
export function BrandedLoading({
  text = 'Memuat...',
  fullScreen = true,
  className,
  ...props
}: BrandedLoadingProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-4 bg-white/95 text-foreground transition-all duration-300',
        fullScreen ? 'fixed inset-0 z-[9999]' : 'py-16 w-full',
        className
      )}
      {...props}
    >
      <div className="relative flex items-center justify-center">
        {/* Soft aquatic pulse ring */}
        <div className="absolute h-16 w-16 animate-ping rounded-full bg-[var(--m-aqua-soft)] opacity-80" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--m-border)] bg-white p-2.5 shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.png"
            alt="Rajendra Meet"
            className="h-full w-full object-contain"
          />
        </div>
      </div>
      {text && (
        <p className="font-heading text-xs font-bold uppercase tracking-wider text-[var(--m-muted)] animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

/**
 * Button / Inline Loading resmi SCMS sesuai DESIGN.md:
 * Spinner mikro elegan berlogo akuatik tajam, tanpa teks "Memuat..." berulang di dalam tombol.
 */
export function BrandedSpinner({ className }: { className?: string }) {
  return (
    <div className={cn('relative inline-flex items-center justify-center shrink-0', className || 'h-4 w-4')}>
      <svg
        className="h-full w-full animate-spin text-[var(--m-aqua)]"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25 text-slate-300"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}
