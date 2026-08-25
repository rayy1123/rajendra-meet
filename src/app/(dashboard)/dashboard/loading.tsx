import { Skeleton, StatCardSkeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function Loading() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard' }]} className="mb-1" />
      <PageHeader title="Dashboard Panitia" description="Memuat ringkasan kejuaraan…" />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <div className="pub-card p-5 space-y-3">
        <Skeleton className="h-5 w-44" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
