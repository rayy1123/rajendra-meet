'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Phone, Mail } from 'lucide-react';
import { MenuButton, LandingDrawer, LandingNav } from '@/components/layout/landing-nav';
import { ProfileMenu } from '@/components/layout/logout-button';
import { createClient } from '@/lib/supabase/client';

export function LandingShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const init = async () => {
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

  const authActions = (
    <>
      {ready && user ? (
        <ProfileMenu />
      ) : ready && !user ? (
        <>
          <Link href="/login" className="pub-btn-ghost">Masuk</Link>
          <Link href="/register" className="pub-btn-primary">Daftar</Link>
        </>
      ) : (
        <span className="h-8 w-24 animate-pulse rounded-full bg-[var(--m-soft)]" />
      )}
    </>
  );

  return (
    <div className="pub-shell">
      <header className="pub-header">
        <div className="pub-container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/brand/logo.png" alt="Rajendra Meet" className="h-9 w-auto" />
          </Link>

          <div className="flex items-center gap-1 sm:gap-2 md:hidden">
            <MenuButton onClick={() => setOpen(true)} />
            {authActions}
          </div>

          <nav className="hidden items-center gap-2 sm:gap-3 md:flex">
            <LandingNav onClose={() => setOpen(false)} />
            {authActions}
          </nav>
        </div>
      </header>

      <LandingDrawer open={open} onClose={() => setOpen(false)}>
        <LandingNav onClose={() => setOpen(false)} />
        <div className="mt-auto border-t border-[var(--m-border)] p-3">
          <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">Akun</p>
          {ready && user ? (
            <ProfileMenu />
          ) : ready && !user ? (
            <>
              <Link href="/login" onClick={() => setOpen(false)} className="pub-btn-ghost w-full justify-center">Masuk</Link>
              <Link href="/register" onClick={() => setOpen(false)} className="pub-btn-primary w-full justify-center">Daftar</Link>
            </>
          ) : (
            <span className="h-8 w-full animate-pulse rounded-full bg-[var(--m-soft)]" />
          )}
        </div>
      </LandingDrawer>

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
                <a href="https://wa.me/628877151189" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 transition-colors hover:text-[var(--m-aqua-ink)]">
                  <Phone className="h-4 w-4 text-emerald-600" /> 0887-7151-189
                </a>
              </li>
              <li>
                <a href="mailto:rajendra.project25@gmail.com" className="inline-flex items-center gap-2 transition-colors hover:text-[var(--m-aqua-ink)]">
                  <Mail className="h-4 w-4 text-[var(--m-aqua-ink)]" /> rajendra.project25@gmail.com
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
