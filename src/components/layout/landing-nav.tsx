'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ChevronDown } from 'lucide-react';
import { MobileNavDrawer } from '@/components/layout/mobile-nav-drawer';
import { Button } from '@/components/ui/button';

const NAV_LINKS = [
  { href: '/', label: 'Beranda' },
  { href: '/scoreboard', label: 'Live Scoreboard' },
  { href: '/daftar-lomba', label: 'Daftar Lomba' },
];

const MENU_LINKS = [
  { href: '/kontak', label: 'Kontak' },
  { href: '/program', label: 'Buku Acara' },
  { href: '/galeri', label: 'Galeri' },
  { href: '/medali', label: 'Medali' },
  { href: '/guide', label: 'Panduan' },
];

export function LandingNav({ onClose }: { onClose?: () => void }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuClick = () => {
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <>
      <nav className="flex flex-col p-3">
        {NAV_LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            onClick={onClose}
            className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--m-ink)] transition-colors hover:bg-[var(--m-soft)]"
          >
            {l.label}
          </Link>
        ))}

        <div>
          <button
            onClick={handleMenuClick}
            className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--m-ink)] transition-colors hover:bg-[var(--m-soft)]"
          >
            Menu
            <ChevronDown className={`h-4 w-4 transition-transform ${isMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {isMenuOpen && (
            <div className="mt-1 ml-3 flex flex-col gap-1 border-l-2 border-[var(--m-border)] pl-3">
              {MENU_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => {
                    onClose?.();
                    setIsMenuOpen(false);
                  }}
                  className="rounded-lg px-3 py-2 text-xs font-medium text-[var(--m-muted)] transition-colors hover:text-[var(--m-ink)] hover:bg-[var(--m-soft)]"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          )}
        </div>
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

export function MenuButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="ghost" size="sm" onClick={onClick} className="px-3">
      Menu
    </Button>
  );
}

export function LandingDrawer({ open, onClose, children }: { open: boolean; onClose: () => void; children: React.ReactNode }) {
  return (
    <MobileNavDrawer open={open} onClose={onClose} title="Menu">
      {children}
    </MobileNavDrawer>
  );
}
