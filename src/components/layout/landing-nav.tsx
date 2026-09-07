'use client';

import Link from 'next/link';

const PUBLIC_LINKS = [
  { href: '/', label: 'Beranda' },
  { href: '/scoreboard', label: 'Live Scoreboard' },
  { href: '/daftar-lomba', label: 'Daftar Lomba' },
  { href: '/kontak', label: 'Kontak' },
  { href: '/program', label: 'Buku Acara' },
  { href: '/galeri', label: 'Galeri' },
  { href: '/medali', label: 'Medali' },
  { href: '/guide', label: 'Panduan' },
];

/**
 * Navigasi publik statis tanpa tombol menu/drawer.
 */
export function LandingNav() {
  return (
    <nav className="flex items-center gap-2 sm:gap-3">
      {PUBLIC_LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-[var(--m-muted)] transition-colors hover:bg-[var(--m-soft)] hover:text-[var(--m-ink)]"
        >
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
