'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Waves } from 'lucide-react';
import { BreadcrumbMenuButton, LandingSidebarDrawer } from '@/components/layout/landing-nav';
import { createClient } from '@/lib/supabase/client';
import { ProfileMenu } from '@/components/layout/logout-button';
import { Breadcrumb, type BreadcrumbItem } from '@/components/ui/breadcrumb';
import { PublicFooter } from '@/components/layout/public-footer';

export function PublicShell({
  children,
  title,
  subtitle,
  breadcrumbItems,
}: {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbItems?: BreadcrumbItem[];
}) {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    supabase.auth.getUser().then((result: { data: { user: any } }) => {
      if (!active) return;
      const currentUser = result.data.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        supabase
          .from('profiles')
          .select('role')
          .eq('id', currentUser.id)
          .maybeSingle()
          .then(({ data: profile }: { data: any }) => {
            if (active) {
              setRole(
                profile?.role ||
                currentUser.user_metadata?.role ||
                currentUser.app_metadata?.role ||
                'viewer'
              );
            }
          });
      }
      setReady(true);
    });
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
      {/* HEADER UTAMA DENGAN BREADCRUMB MENU */}
      <header className="pub-header">
        <div className="pub-container flex h-16 items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <Link href="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-90">
              <img src="/brand/logo.png" alt="Rajendra Meet" className="h-8 sm:h-9 w-auto object-contain" />
              <span className="hidden lg:inline-block text-xs italic font-medium text-[var(--m-muted)] border-l border-[var(--m-border)] pl-2.5">
                &ldquo;We Organize, You Achieve&rdquo;
              </span>
            </Link>

            {/* Breadcrumb Menu Trigger Button - sekarang aktif di semua halaman! */}
            <BreadcrumbMenuButton onClick={() => setOpen(true)} />
          </div>

          {authActions}
        </div>
      </header>

      {/* SIDEBAR DRAWER DENGAN SEMUA OPSI MENU */}
      <LandingSidebarDrawer
        open={open}
        onClose={() => setOpen(false)}
        user={user}
        ready={ready}
        role={role}
      />

      <main className="flex-1">
        {breadcrumbItems && breadcrumbItems.length > 0 && (
          <div className="pub-container pt-4">
            <Breadcrumb items={breadcrumbItems} />
          </div>
        )}
        {title && (
          <div className="pub-container pt-4 pb-6">
            <p className="pub-eyebrow">Rajendra Meet · Kejuaraan Renang</p>
            <h1 className="font-heading mt-2 text-3xl font-extrabold tracking-tight text-[var(--m-ink)] sm:text-4xl">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 max-w-2xl text-sm sm:text-base text-[var(--m-muted)] leading-relaxed">{subtitle}</p>
            )}
          </div>
        )}
        {children}
      </main>

      <PublicFooter />
    </div>
  );
}
