import Link from 'next/link';
import { Waves } from 'lucide-react';

/**
 * Kerangka halaman publik yang konsisten untuk scoreboard, live board, dan
 * panduan. Tema "Marine" (lihat globals.css). Header memuat logo dan tautan
 * masuk/daftar; footer ringkas. Konten disisipkan via children.
 */
export function PublicShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  return (
    <div className="pub-shell">
      <header className="pub-header">
        <div className="pub-container flex h-16 items-center justify-between">
          <Link href="/scoreboard" className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--m-aqua)] text-white">
              <Waves className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-sm font-bold tracking-tight text-[var(--m-ink)]">
                Rajendra Meet
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--m-muted)]">
                Swimming Results
              </span>
            </span>
          </Link>

          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/daftar-lomba" className="pub-link hidden sm:inline">
              Daftar Lomba
            </Link>
            <Link href="/guide" className="pub-link hidden sm:inline">
              Panduan
            </Link>
            <Link href="/pendaftaran-saya" className="pub-link hidden sm:inline">
              Pendaftaran Saya
            </Link>
            <Link href="/login" className="pub-btn-ghost">
              Masuk
            </Link>
            <Link href="/register" className="pub-btn-primary">
              Daftar
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {title && (
          <div className="pub-container pt-10 pb-6">
            <p className="pub-eyebrow">Rajendra Meet · Hasil Langsung</p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-[var(--m-ink)] sm:text-4xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 max-w-2xl text-[var(--m-muted)]">{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </main>

      <footer className="border-t border-[var(--m-border)] py-6">
        <div className="pub-container flex flex-col items-center justify-between gap-2 text-xs text-[var(--m-muted)] sm:flex-row">
          <p>© {new Date().getFullYear()} Rajendra Meet — Sistem Manajemen Kejuaraan Renang</p>
          <p className="flex items-center gap-1.5">
            <Waves className="h-3.5 w-3.5 text-[var(--m-aqua)]" />
            Hasil Lomba Real-time
          </p>
        </div>
      </footer>
    </div>
  );
}
