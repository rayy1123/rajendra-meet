import { Skeleton, TableSkeleton, StatCardSkeleton } from '@/components/ui/skeleton';

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 animate-fade-in">
      {/* Breadcrumb Skeleton */}
      <div className="flex items-center gap-2 mb-2">
        <Skeleton className="h-4 w-16" />
        <span className="text-slate-300">/</span>
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Header Skeleton */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[var(--m-border)]">
        <div className="space-y-2">
          <Skeleton className="h-7 w-64 md:w-80" />
          <Skeleton className="h-4 w-96 max-w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>

      {/* Quick Metric Cards Skeleton */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* Main Content Table / Panel Skeleton */}
      <div className="rounded-2xl border border-[var(--m-border)] bg-white p-5 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-44" />
          <Skeleton className="h-8 w-48 rounded-xl" />
        </div>
        <TableSkeleton rows={6} cols={5} />
      </div>
    </div>
  );
}
