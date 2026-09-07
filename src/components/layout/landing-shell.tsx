'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, Mail, Menu, X } from 'lucide-react';
import { ProfileMenu } from '@/components/layout/logout-button';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

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

export function LandingShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const init = async () => {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const result = await supabase.auth.getUser();
      if (!active) return;
      setUser(result.data.user ?? null);
      setReady(true);
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div className="pub-shell">
      <header className="pub-header">
        <div className="pub-container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/brand/logo.png"
              alt="Rajendra Meet"
              className="h-9 w-auto"
            />
          </Link>

          <nav className="hidden items-center gap-1 sm:gap-2 md:flex">
            {PUBLIC_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--m-ink)] transition-colors hover:bg-[var(--m-soft)]"
              >
                {l.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2 md:hidden">
            <button
              type="button"
              aria-label="Buka menu"
              aria-expanded={open}
              onClick={() => setOpen(true)}
              className="pub-btn-ghost flex items-center gap-2 px-3"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Menu</span>
            </button>
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {ready && user ? (
              <ProfileMenu />
            ) : ready && !user ? (
              <>
                <Link href="/login" className="pub-btn-ghost">
                  Masuk
                </Link>
                <Link href="/register" className="pub-btn-primary">
                  Daftar
                </Link>
              </>
            ) : (
              <span className="h-8 w-24 animate-pulse rounded-full bg-[var(--m-soft)]" />
            )}
          </div>
        </div>
      </header>

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end md:hidden" role="dialog" aria-modal="true">
          <button
            type="button"
            aria-label="Tutup menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/30"
          />
          <div className="relative flex h-full w-72 max-w-[85vw] flex-col bg-[var(--m-surface)] shadow-xl">
            <div className="flex flex-row items-center gap-2 border-b border-[var(--m-border)] px-6 py-4">
              <img
                src="/brand/logo.png"
                alt="Rajendra Meet"
                className="h-7 w-auto"
              />
              <span className="text-sm font-bold tracking-tight text-[var(--m-ink)]">Rajendra Meet</span>
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
              {ready && user ? (
                <ProfileMenu />
              ) : ready && !user ? (
                <>
                  <Link href="/login" onClick={() => setOpen(false)} className="pub-btn-ghost w-full justify-center">
                    Masuk
                  </Link>
                  <Link href="/register" onClick={() => setOpen(false)} className="pub-btn-primary w-full justify-center">
                    Daftar
                  </Link>
                </>
              ) : (
                <span className="h-8 w-full animate-pulse rounded-full bg-[var(--m-soft)]" />
              )}
            </div>
          </div>
        </div>
      )}

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[var(--m-border)] bg-[var(--m-surface)]">
        <div className="pub-container grid grid-cols-1 gap-8 py-10 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="mt-3 max-w-md text-sm text-[var(--m-muted)]">
              Event organizer olahraga, MICE, dan sistem manajemen kejuaraan renang — profesional, terukur, dan mudah.
            </p>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold text-[var(--m-ink)]">Layanan & Platform</h4>
            <ul className="space-y-2 text-sm text-[var(--m-muted)]">
              <li><Link href="/kontak" className="transition-colors hover:text-[var(--m-aqua-ink)]">Event Organizer</Link></li>
              <li><Link href="/kontak" className="transition-colors hover:text-[var(--m-aqua-ink)]">SCMS Rajendra Meet</Link></li>
              <li><Link href="/kontak" className="transition-colors hover:text-[var(--m-aqua-ink)]">Karate & Combat Sports</Link></li>
              <li><Link href="/kontak" className="transition-colors hover:text-[var(--m-aqua-ink)]">Medical & Safety</Link></li>
              <li><Link href="/kontak" className="transition-colors hover:text-[var(--m-aqua-ink)]">Equipment Rental</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-3 text-sm font-bold text-[var(--m-ink)]">Emergency & Live Desk</h4>
            <ul className="space-y-2.5 text-sm text-[var(--m-muted)]">
              <li>
                <a
                  href="https://wa.me/628877151189"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-[var(--m-aqua-ink)]"
                >
                  <Phone className="h-4 w-4 text-emerald-600" /> 0887-7151-189
                </a>
              </li>
              <li>
                <a
                  href="mailto:rajendra.project25@gmail.com"
                  className="inline-flex items-center gap-2 transition-colors hover:text-[var(--m-aqua-ink)]"
                >
                  <Mail className="h-4 w-4 text-[var(--m-aqua-ink)]" /> rajendra.project25@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/rajendraproject25"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-[var(--m-aqua-ink)]"
                >
                  <InstagramIcon className="h-4 w-4 text-pink-600" /> @rajendraproject25
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[var(--m-border)]">
          <div className="pub-container flex flex-col items-center justify-between gap-2 py-4 text-xs text-[var(--m-muted)] sm:flex-row">
            <p>© 2014 - 2026 Rajendra Project. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/kontak" className="transition-colors hover:text-[var(--m-aqua-ink)]">Privacy Policy</Link>
              <Link href="/kontak" className="transition-colors hover:text-[var(--m-aqua-ink)]">Terms of Service</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
