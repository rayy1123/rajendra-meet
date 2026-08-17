import { Waves } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3 text-muted-foreground">
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
          <Waves className="h-6 w-6 animate-pulse" />
        </span>
        <p className="text-sm font-medium">Memuat dasbor…</p>
      </div>
    </div>
  );
}
