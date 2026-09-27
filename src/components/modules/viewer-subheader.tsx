'use client';

import { ReactNode } from 'react';

interface ViewerSubHeaderProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  icon?: ReactNode;
}

export function ViewerSubHeader({ title, description, badge, icon }: ViewerSubHeaderProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--m-border)] bg-[var(--m-surface)] shadow-2xs">
      <div className="absolute inset-0 opacity-60 pointer-events-none">
        <div className="absolute -top-16 -left-10 h-40 w-40 rounded-full bg-[var(--m-aqua-soft)] blur-2xl" />
        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-[var(--m-aqua-soft)] blur-2xl" />
      </div>
      <div className="relative px-5 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3.5">
            {icon && (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)] shadow-2xs">
                {icon}
              </div>
            )}
            <div className="space-y-0.5">
              <h1 className="font-heading text-lg font-black tracking-tight text-[var(--m-ink)] sm:text-2xl">
                {title}
              </h1>
              {description && (
                <p className="text-xs text-[var(--m-muted)] sm:text-sm leading-relaxed">{description}</p>
              )}
            </div>
          </div>
          {badge && <div>{badge}</div>}
        </div>
      </div>
    </div>
  );
}
