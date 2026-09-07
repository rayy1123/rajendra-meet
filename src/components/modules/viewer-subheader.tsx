'use client';

import { Info } from 'lucide-react';
import { ReactNode } from 'react';

interface ViewerSubHeaderProps {
  title: string;
  description?: string;
  badge?: ReactNode;
}

export function ViewerSubHeader({ title, description, badge }: ViewerSubHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#d0dff0] bg-white">
      <div className="absolute inset-0 opacity-70">
        <div className="absolute -top-16 -left-10 h-40 w-40 rounded-full bg-[#cfe8ff] blur-2xl" />
        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-[#d9f0d9] blur-2xl" />
      </div>
      <div className="relative px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)]">
              <img src="/brand/logo.png" alt="Rajendra Meet" className="h-6 w-auto" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-[#0b1220] sm:text-xl">{title}</h1>
                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--m-soft)] text-[var(--m-muted)]" title={description}>
                  <Info className="h-3.5 w-3.5" />
                </span>
              </div>
              {description && (
                <p className="mt-1 text-xs text-[#334155] sm:text-sm">{description}</p>
              )}
            </div>
          </div>
          {badge && <div>{badge}</div>}
        </div>
      </div>
    </div>
  );
}
