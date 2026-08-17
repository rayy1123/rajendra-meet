import Link from 'next/link';
import { Waves, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-sm">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Compass className="h-6 w-6" />
        </span>
        <h1 className="mt-4 text-2xl font-bold tracking-tight text-foreground">404</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Halaman yang Anda cari tidak ditemukan. Mungkin telah dipindahkan atau belum dibuat.
        </p>
        <Link href="/" className="mt-6 block">
          <Button className="w-full gap-2">
            <Waves className="h-4 w-4" /> Kembali ke Beranda
          </Button>
        </Link>
      </div>
    </div>
  );
}
