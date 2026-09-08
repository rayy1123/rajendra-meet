'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

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
 * Navigasi publik drawer untuk mobile.
 * Gunakan di dalam shell yang sudah mengelola state auth sendiri.
 */
export function LandingNav({ onClose }: { onClose?: () => void }) {
  return (
    <>
      <nav className="flex flex-col p-3">
        {PUBLIC_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={onClose}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--m-ink)] transition-colors hover:bg-[var(--m-soft)]"
          >
            {l.label}
          </Link>
        ))}
      </nav>

      <div className="mt-auto border-t border-[var(--m-border)] p-3">
        <Link href="/login" onClick={onClose} className="pub-btn-ghost w-full justify-center">
          Masuk
        </Link>
        <Link href="/register" onClick={onClose} className="pub-btn-primary w-full justify-center">
          Daftar
        </Link>
      </div>
    </>
  );
}

/**
 * Tombol menu untuk mobile.
 */
export function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      aria-label="Buka menu"
      aria-expanded={false}
      onClick={onClick}
      className="pub-btn-ghost flex items-center gap-2 px-3"
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only sm:not-sr-only sm:inline">Menu</span>
    </button>
  );
}

/**
 * Drawer manual untuk navigasi publik.
 */
export function LandingDrawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className={`fixed inset-0 z-50 flex justify-end md:hidden ${open ? '' : 'pointer-events-none'}`} role="dialog" aria-modal="true">
      {open && (
        <>
          <button type="button" aria-label="Tutup menu" onClick={onClose} className="absolute inset-0 bg-black/30" />
          <div className="relative flex h-full w-72 max-w-[85vw] flex-col bg-[var(--m-surface)] shadow-xl">
            <div className="flex flex-row items-center gap-2 border-b border-[var(--m-border)] px-6 py-4">
              <img src="/brand/logo.png" alt="Rajendra Meet" className="h-7 w-auto" />
              <span className="text-sm font-bold tracking-tight text-[var(--m-ink)]">Rajendra Meet</span>
              <button type="button" aria-label="Tutup" onClick={onClose} className="ml-auto rounded-lg p-1.5 text-[var(--m-muted)] hover:bg-[var(--m-soft)]">
                <X className="h-5 w-5" />
              </button>
            </div>
            {children}
          </div>
        </>
      )}
    </div>
  );
}
