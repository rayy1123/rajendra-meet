import Link from 'next/link';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
        <ShieldAlert className="h-7 w-7" />
      </div>
      <h1 className="mt-5 text-2xl font-bold tracking-tight text-foreground">
        Akses Ditolak
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        Anda tidak memiliki izin untuk membuka halaman ini. Halaman tersebut
        hanya dapat diakses oleh peran tertentu (panitia / administrator).
      </p>
      <div className="mt-6 flex items-center gap-3">
        <Button asChild variant="default">
          <Link href="/dashboard">Kembali ke Dashboard</Link>
        </Button>
        <Button asChild variant="ghost">
          <Link href="/">Ke Beranda</Link>
        </Button>
      </div>
    </div>
  );
}
