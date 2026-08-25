import { Skeleton, TableSkeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default function Loading() {
  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Atlet' }]} className="mb-1" />
      <PageHeader title="Master Data Atlet" description="Memuat daftar atlet…" />
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>
      <TableSkeleton rows={10} cols={6} />
    </div>
  );
}
