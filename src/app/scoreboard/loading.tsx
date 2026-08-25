import { Skeleton } from '@/components/ui/skeleton';
import { PublicShell } from '@/components/layout/public-shell';

export default function Loading() {
  return (
    <PublicShell title="Scoreboard Kejuaraan" subtitle="Memuat hasil perlombaan…">
      <div className="pub-container pb-16 space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-10 w-64 rounded-xl" />
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
        <div className="live-card overflow-hidden p-6 space-y-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-9 w-9 rounded-xl" />
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-24" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </div>
      </div>
    </PublicShell>
  );
}
