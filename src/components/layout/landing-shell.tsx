'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { BreadcrumbMenuButton, LandingSidebarDrawer } from '@/components/layout/landing-nav';
import { ProfileMenu } from '@/components/layout/logout-button';
import { createClient } from '@/lib/supabase/client';
import { PublicFooter } from '@/components/layout/public-footer';

export function LandingShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const init = async () => {
      const supabase = createClient();
      const result = await supabase.auth.getUser();
      if (!active) return;
      const currentUser = result.data.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .maybeSingle();
        if (active) {
          setRole(
            profile?.role ||
            currentUser.user_metadata?.role ||
            currentUser.app_metadata?.role ||
            'viewer'
          );
        }
      }
      setReady(true);
    };
    init();
    return () => {
      active = false;
    };
  }, []);

  const authActions = (
    <div className="flex items-center gap-2 sm:gap-3">
      {ready && user ? (
        <div className="flex items-center gap-2">
          <Link
            href={
              role &&
              ['super_admin', 'event_admin', 'operator', 'admin', 'admin_kejuaraan', 'admin_keuangan'].includes(
                role
              )
                ? '/dashboard'
                : '/dashboard-viewer'
            }
            className="pub-btn-ghost text-xs hidden sm:inline-flex"
          >
            Dashboard
          </Link>
          <ProfileMenu />
        </div>
      ) : ready && !user ? (
        <>
          <Link href="/login" className="pub-btn-ghost text-xs sm:text-sm font-semibold">
            Masuk
          </Link>
          <Link href="/register" className="pub-btn-primary text-xs sm:text-sm font-semibold">
            Daftar
          </Link>
        </>
      ) : (
        <span className="h-8 w-24 animate-pulse rounded-full bg-[var(--m-soft)]" />
      )}
    </div>
  );

  return (
    <div className="pub-shell">
      {/* ===== HEADER / NAVBAR UTAMA ===== */}
      <header className="pub-header">
        <div className="pub-container flex h-16 items-center justify-between gap-3">
          {/* Sisi Kiri: Logo + Slogan + Breadcrumb Menu Button */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
              <img src="/brand/logo.png" alt="Rajendra Meet" className="h-8 sm:h-9 w-auto object-contain" />
              <span className="hidden lg:inline-block text-xs italic font-medium text-[var(--m-muted)] border-l border-[var(--m-border)] pl-2.5">
                &ldquo;We Organize, You Achieve&rdquo;
              </span>
            </Link>

            {/* Breadcrumb Menu Trigger Button */}
            <BreadcrumbMenuButton onClick={() => setOpen(true)} />
          </div>

          {/* Sisi Kanan: Hanya Masuk & Daftar */}
          {authActions}
        </div>
      </header>

      {/* ===== SIDEBAR DRAWER (Memuat Tentang Kami, Layanan, Galeri, Kontak, Livescore, & Auth di Bawah) ===== */}
      <LandingSidebarDrawer
        open={open}
        onClose={() => setOpen(false)}
        user={user}
        ready={ready}
        role={role}
      />

      <main className="flex-1">{children}</main>

      <PublicFooter />
    </div>
  );
}
