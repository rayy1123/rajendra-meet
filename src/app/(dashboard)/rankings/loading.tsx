import { Skeleton, TableSkeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function Loading() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Perangkingan' }]} className="mb-1" />
      <PageHeader title="Perangkingan" description="Memuat peringkat…" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-6 w-56" />
          <TableSkeleton rows={5} cols={6} />
        </div>
      ))}
    </div>
  );
}
