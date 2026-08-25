import { cn } from '@/lib/utils';

/**
 * Skeleton placeholder dengan efek shimmer halus (gaya Aqua Editorial).
 * Dipakai di file loading.tsx untuk menghindari layar kosong saat fetch data.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-shimmer rounded-md bg-[var(--m-soft)]', className)}
      {...props}
    />
  );
}

/** Baris tabel placeholder (untuk halaman data admin/viewer). */
export function TableSkeleton({ rows = 8, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="pub-card overflow-hidden">
      <div className="divide-y divide-[var(--m-border)]">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 px-4 py-3.5">
            {Array.from({ length: cols }).map((_, c) => (
              <Skeleton
                key={c}
                className={cn('h-4', c === 0 ? 'w-24' : 'flex-1', c === cols - 1 && 'w-16')}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Kartu statistik placeholder (untuk dashboard). */
export function StatCardSkeleton() {
  return (
    <div className="pub-card flex items-center gap-3 p-4">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-5 w-12" />
      </div>
    </div>
  );
}
