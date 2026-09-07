'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X, Waves } from 'lucide-react';

const PUBLIC_LINKS = [
  { href: '/', label: 'Beranda' },
  { href: '/scoreboard', label: 'Jadwal Lomba' },
  { href: '/daftar-lomba', label: 'Daftar Lomba' },
  { href: '/guide', label: 'Panduan' },
  { href: '/kontak', label: 'Kontak' },
  { href: '/program', label: 'Buku Acara' },
  { href: '/galeri', label: 'Galeri' },
  { href: '/medali', label: 'Medali' },
];

/**
 * Navigasi beranda (publik, belum login).
 * Di layar kecil hanya logo + Masuk/Daftar yang tampil, sehingga tombol
 * hamburger ini memberi akses ke seluruh menu publik tanpa memenuhi header.
 * Menggunakan drawer manual (useState) agar tidak bergantung pada
 * komponen Sheet/radix yang bermasalah di beberapa setup.
 */
export function LandingNav() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        aria-label="Buka menu"
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="pub-btn-ghost flex items-center gap-2 px-3"
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only sm:not-sr-only sm:inline">Menu</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true">
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          {/* Panel */}
          <div className="relative flex h-full w-72 max-w-[85vw] flex-col bg-[var(--m-surface)] shadow-xl">
            <div className="flex flex-row items-center gap-2 border-b border-[var(--m-border)] px-6 py-4">
              <Waves className="h-6 w-6 text-[var(--m-aqua)]" />
              <span className="font-bold text-lg tracking-tight text-[var(--m-ink)]">
                Rajendra Meet
              </span>
              <button
                type="button"
                aria-label="Tutup"
                onClick={() => setOpen(false)}
                className="ml-auto rounded-lg p-1.5 text-[var(--m-muted)] hover:bg-[var(--m-soft)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex flex-col p-3">
              {PUBLIC_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--m-ink)] transition-colors hover:bg-[var(--m-soft)]"
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="mt-auto flex flex-col gap-2 border-t border-[var(--m-border)] p-4">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="pub-btn-ghost w-full justify-center"
              >
                Masuk
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="pub-btn-primary w-full justify-center"
              >
                Daftar
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
