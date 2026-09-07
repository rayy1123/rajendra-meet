'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Waves } from 'lucide-react';
import { LandingNav } from '@/components/layout/landing-nav';
import { createClient } from '@/lib/supabase/client';
import { ProfileMenu } from '@/components/layout/logout-button';

export function PublicShell({
  children,
  title,
  subtitle,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
}) {
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase.auth.getUser().then((result: { data: { user: any } }) => {
      if (!active) return;
      setUser(result.data.user ?? null);
      setReady(true);
    });
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

          <nav className="flex items-center gap-2 sm:gap-3">
            <LandingNav />
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
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {title && (
          <div className="pub-container pt-10 pb-6">
            <p className="pub-eyebrow">Rajendra Meet · Hasil Langsung</p>
            <h1 className="h-display mt-2">{title}</h1>
            {subtitle && (
              <p className="mt-2 max-w-2xl text-[var(--m-muted)]">{subtitle}</p>
            )}
          </div>
        )}
        <div className="pub-container pb-16">
          {children}
        </div>
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
