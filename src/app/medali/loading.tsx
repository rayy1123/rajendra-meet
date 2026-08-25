import { Skeleton } from '@/components/ui/skeleton';
import { PublicShell } from '@/components/layout/public-shell';

export default function Loading() {
  return (
    <PublicShell title="Klasemen Medali" subtitle="Memuat klasemen…">
      <div className="pub-container pb-16 space-y-6">
        <Skeleton className="h-10 w-64 rounded-xl" />
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-44 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </PublicShell>
  );
}
