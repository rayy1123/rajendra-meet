import * as React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

/**
 * Breadcrumb konsisten untuk halaman operasional dashboard.
 * Memberi konteks posisi user dan jalur navigasi mundur yang jelas,
 * mencegah "tersesat" saat berpindah antar modul (event -> heat -> hasil -> ranking).
 */
export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1 text-sm text-muted-foreground', className)}
    >
      {items.map((item, i) => {
        const isLast = i === items.length - 1;
        return (
          <React.Fragment key={`${item.label}-${i}`}>
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="rounded px-1 py-0.5 transition-colors hover:text-foreground hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'rounded px-1 py-0.5',
                  isLast && 'font-medium text-foreground'
                )}
                aria-current={isLast ? 'page' : undefined}
              >
                {item.label}
              </span>
            )}
            {!isLast && (
              <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/60" />
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
