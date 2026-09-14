'use client';

import { useState } from 'react';
import type { SponsorItem } from '@/lib/data/sponsors';

export function SponsorLogosStrip({
  sponsors,
  title = 'OFFICIAL PARTNERS & SPONSORS',
  className = '',
  size = 'md',
}: {
  sponsors: SponsorItem[];
  title?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageError = (id: string) => {
    setFailedImages((prev) => new Set(prev).add(id));
  };

  const activeSponsors = sponsors.filter((s) => s.isActive);
  if (activeSponsors.length === 0) return null;

  const heightClass = size === 'sm' ? 'h-5' : size === 'lg' ? 'h-9' : 'h-7';

  return (
    <div className={`sponsor-strip text-center space-y-1.5 ${className}`}>
      {title && (
        <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
          {title}
        </p>
      )}

      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5 px-2">
        {activeSponsors.map((s) => {
          const hasFailed = failedImages.has(s.id);

          return (
            <div
              key={s.id}
              className="flex items-center justify-center p-1 rounded transition-opacity"
              title={`${s.name} (${s.tier.toUpperCase()})`}
            >
              {!hasFailed && s.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.logoUrl}
                  alt={s.name}
                  onError={() => handleImageError(s.id)}
                  className={`max-w-[85px] sm:max-w-[100px] ${heightClass} object-contain filter grayscale contrast-125 hover:grayscale-0 transition-all opacity-85 hover:opacity-100`}
                />
              ) : (
                <span className="inline-block px-2 py-0.5 rounded-sm bg-slate-100 border border-slate-300 text-[9px] font-black font-mono uppercase text-slate-700">
                  {s.name}
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
