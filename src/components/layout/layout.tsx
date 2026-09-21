'use client';

import { useState, useEffect } from 'react';
import { SidebarNav, MobileSidebar } from '@/components/layout/sidebar';
import { PanelLeft, PanelLeftClose } from 'lucide-react';
import Link from 'next/link';
import { ProfileMenu } from '@/components/layout/logout-button';

import { createClient } from '@/lib/supabase/client';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Dasbor Panitia',
  event_admin: 'Dasbor Panitia',
  operator: 'Dasbor Operator',
  admin: 'Dasbor Panitia',
  admin_kejuaraan: 'Dasbor Panitia',
  admin_keuangan: 'Dasbor Keuangan',
  viewer: 'Dasbor Peserta',
};

export default function DashboardLayout({
  children,
  role,
}: {
  children: React.ReactNode;
  role?: string;
}) {
  const [activeRole, setActiveRole] = useState<string>(role || '');

  useEffect(() => {
    if (role) {
      setActiveRole(role);
      return;
    }
    const supabase = createClient();
    supabase.auth.getUser().then((res: { data: { user: any } }) => {
      const user = res?.data?.user;
      if (user) {
        supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()
          .then(({ data: profile }: { data: any }) => {
            const resolved =
              profile?.role ||
              (user.user_metadata?.role as string) ||
              (user.app_metadata?.role as string) ||
              'viewer';
            setActiveRole(resolved);
          });
      }
    });
  }, [role]);

  const roleLabel = ROLE_LABELS[activeRole] ?? 'Dasbor';

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('scms-sidebar-collapsed') === '1';
  });

  useEffect(() => {
    localStorage.setItem('scms-sidebar-collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,_var(--m-aqua-soft),transparent_28rem)] md:flex-row">
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar/95 transition-[width] duration-200 md:flex print:hidden ${
          collapsed ? 'w-[76px]' : 'w-72'
        }`}
      >
        <div
          className={`flex h-16 items-center gap-2.5 border-b border-border ${
            collapsed ? 'justify-center px-2' : 'px-6'
          }`}
        >
          {!collapsed && (
            <img
              src="/brand/logo.png"
              alt="Rajendra Meet"
              className="h-8 w-auto"
            />
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="ml-auto rounded-lg p-1.5 text-[var(--m-muted)] transition-colors hover:bg-[var(--m-soft)] hover:text-[var(--m-ink)]"
            aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
            title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
          >
            {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav collapsed={collapsed} role={activeRole} />
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/90 px-4 backdrop-blur-xl sm:px-6 print:hidden">
          <div className="flex items-center gap-2">
            <MobileSidebar role={activeRole} />
            <span className="text-sm font-bold tracking-tight text-foreground">Rajendra Meet</span>
            <span className="text-xs text-muted-foreground">/</span>
            <span className="text-xs font-medium text-muted-foreground">{roleLabel}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/scoreboard" className="rounded-full bg-[var(--m-aqua-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--m-aqua-ink)] transition-colors hover:bg-[var(--m-aqua)] hover:text-white">
              Live Score
            </Link>
            <Link href="/" className="text-xs font-semibold text-primary hover:underline">
              Beranda
            </Link>
            <ProfileMenu />
          </div>
        </header>

        <main className="flex-1 print:p-0 print:m-0">{children}</main>

        <footer className="border-t border-border bg-background print:hidden">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
            <p>© {new Date().getFullYear()} Rajendra Meet — Sistem Manajemen Kejuaraan Renang</p>
            <div className="flex items-center gap-4">
              <Link href="/" className="hover:text-foreground">Beranda</Link>
              <Link href="/scoreboard" className="hover:text-foreground">Live Scoreboard</Link>
              <Link href="/kontak" className="hover:text-foreground">Kontak</Link>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
