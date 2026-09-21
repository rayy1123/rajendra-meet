'use client';

import { useState } from 'react';
import type { SponsorItem } from '@/lib/data/sponsors';

export function SponsorLogosStrip({
  sponsors,
  title = 'OFFICIAL PARTNERS & SPONSORS',
  className = '',
  size = 'md',
  grayscale = false,
}: {
  sponsors: SponsorItem[];
  title?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  grayscale?: boolean;
}) {
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  const handleImageError = (id: string) => {
    setFailedImages((prev) => new Set(prev).add(id));
  };

  const activeSponsors = sponsors.filter((s) => s.isActive);
  if (activeSponsors.length === 0) return null;

  const heightClass = size === 'sm' ? 'h-4 sm:h-4.5 max-h-4.5' : size === 'lg' ? 'h-9' : 'h-7';
  const maxWidthClass = size === 'sm' ? 'max-w-[65px] sm:max-w-[78px]' : 'max-w-[85px] sm:max-w-[100px]';
  const gapClass = size === 'sm' ? 'gap-2 sm:gap-3.5 px-1' : 'gap-3 sm:gap-5 px-2';
  const itemPadding = size === 'sm' ? 'py-0.5 px-1' : 'p-1';
  const spaceClass = size === 'sm' ? 'space-y-0.5' : 'space-y-1.5';

  return (
    <div className={`sponsor-strip text-center ${spaceClass} ${className}`}>
      {title && (
        <p className="text-[8px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-slate-500">
          {title}
        </p>
      )}

      <div className={`flex flex-wrap items-center justify-center ${gapClass}`}>
        {activeSponsors.map((s) => {
          const hasFailed = failedImages.has(s.id);

          return (
            <div
              key={s.id}
              className={`flex shrink-0 items-center justify-center ${itemPadding} rounded transition-opacity`}
              title={`${s.name} (${s.tier.toUpperCase()})`}
            >
              {!hasFailed && s.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={s.logoUrl}
                  alt={s.name}
                  onError={() => handleImageError(s.id)}
                  className={`${maxWidthClass} ${heightClass} object-contain ${grayscale ? 'filter grayscale contrast-125 hover:grayscale-0' : ''} transition-all opacity-95 hover:opacity-100`}
                />
              ) : (
                <span className="inline-block px-1.5 py-0.5 rounded-sm bg-slate-100 border border-slate-300 text-[8px] sm:text-[9px] font-black font-mono uppercase text-slate-700">
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
