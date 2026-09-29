'use client';

import { useState, useEffect } from 'react';
import { SidebarNav, MobileSidebar } from '@/components/layout/sidebar';
import { PanelLeft, PanelLeftClose, Trophy, CheckCircle2, Waves, Radio } from 'lucide-react';
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

  const ADMIN_ROLES = [
    'super_admin',
    'event_admin',
    'operator',
    'admin',
    'admin_kejuaraan',
    'admin_keuangan',
  ];
  const isAdmin = ADMIN_ROLES.includes(activeRole);
  const roleLabel = ROLE_LABELS[activeRole] ?? (isAdmin ? 'Dasbor' : 'Dasbor Peserta');

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('scms-sidebar-collapsed') === '1';
  });

  useEffect(() => {
    localStorage.setItem('scms-sidebar-collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <div className="flex min-h-screen flex-col bg-[radial-gradient(circle_at_top_left,_var(--m-aqua-soft),transparent_28rem)] md:flex-row print:bg-white print:min-h-0 print:block print:p-0 print:m-0">
      {/* ── SIDEBAR UTAMA ── */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar/95 transition-[width] duration-200 md:flex print:hidden ${
          collapsed ? 'w-[76px]' : 'w-72'
        }`}
      >
        {/* Header Sidebar dengan Logo Rajendra Swim System + Design by Rajendra Project */}
        <div
          className={`border-b border-border transition-all ${
            collapsed ? 'flex h-16 items-center justify-center px-2' : 'px-5 py-3 space-y-2'
          }`}
        >
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo.png"
                alt="Rajendra Swim System"
                className="h-7 w-auto object-contain"
              />
              {!collapsed && (
                <span className="font-heading font-black text-sm text-[var(--m-ink)]">
                  Rajendra <span className="text-[var(--m-aqua)]">Swim System</span>
                </span>
              )}
            </Link>

            <button
              type="button"
              onClick={() => setCollapsed((c) => !c)}
              className="rounded-lg p-1.5 text-[var(--m-muted)] transition-colors hover:bg-[var(--m-soft)] hover:text-[var(--m-ink)] cursor-pointer"
              aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
              title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
            >
              {collapsed ? <PanelLeft className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
            </button>
          </div>

          {!collapsed && (
            <div className="space-y-2 pt-0.5">
              {/* Design by Rajendra Project Logo (Persis Image #14) */}
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  DESIGN BY
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/rajendra-organizer-logo.png"
                  alt="Rajendra Project"
                  className="h-4.5 w-auto object-contain"
                />
              </div>

              {/* Status Badges */}
              <div className="flex items-center gap-1.5">
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200">
                  {isAdmin ? 'Rajendra Swim System Admin v4.8' : 'Portal Peserta v4.8'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live Sync
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto py-3">
          <SidebarNav collapsed={collapsed} role={activeRole} />
        </div>

        {!collapsed && (
          <div className="p-3 border-t border-border/80 text-[10px] text-slate-400 font-mono text-center">
            © {new Date().getFullYear()} Rajendra Sports System
          </div>
        )}
      </aside>

      {/* ── KONTEN UTAMA DENGAN HEADER ── */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col print:min-h-0 print:block print:p-0 print:m-0">
        {/* Top Navbar Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-xl sm:px-6 print:hidden">
          <div className="flex items-center gap-2.5 flex-wrap">
            <MobileSidebar role={activeRole} />
            <Link href="/" className="text-xs font-semibold text-slate-500 hover:text-slate-900">
              Beranda
            </Link>
            <span className="text-xs text-slate-300">/</span>
            <span className="text-xs font-bold text-slate-800">{roleLabel}</span>

            {/* Design by Rajendra Project logo in header next to breadcrumb (Persis Image #14) */}
            <div className="hidden lg:flex items-center gap-1.5 pl-2.5 border-l border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Design by
              </span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/rajendra-organizer-logo.png"
                alt="Rajendra Project"
                className="h-4.5 w-auto object-contain"
                title="Design by Rajendra Project"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Swiss Timing Omega Status Badge — Hanya tampil untuk admin */}
            {isAdmin && (
              <div className="hidden xl:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                Swiss Timing Omega: Online
              </div>
            )}

            <Link
              href="/scoreboard"
              className="rounded-full bg-[var(--m-aqua-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--m-aqua-ink)] transition-colors hover:bg-[var(--m-aqua)] hover:text-white"
            >
              Live Score
            </Link>
            <Link href="/" className="text-xs font-semibold text-primary hover:underline">
              Beranda
            </Link>
            <ProfileMenu />
          </div>
        </header>

        {/* Status Bar Kejuaraan — Hanya tampil untuk admin */}
        {isAdmin && (
          <div className="hidden md:flex items-center gap-2 px-6 py-2 border-b border-slate-200/80 bg-slate-50/70 text-xs overflow-x-auto print:hidden">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-blue-900 bg-blue-100/70 border border-blue-200 shrink-0">
              <Trophy className="h-3 w-3 text-amber-500" /> KEJURNAS SERI I 2026
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-slate-700 bg-white border border-slate-200 shrink-0">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" /> WORLD AQUATICS (FINA) RULE SW 3.1
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium text-slate-700 bg-white border border-slate-200 shrink-0">
              <Waves className="h-3 w-3 text-primary" /> KOLAM 50M (8 LINTASAN)
            </span>
            <span className="text-slate-300">•</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-cyan-900 bg-cyan-100/70 border border-cyan-200 shrink-0">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-600 animate-pulse" /> TIMING LINK: READY
            </span>
          </div>
        )}

        <main className="flex-1 print:p-0 print:m-0 print:block print:w-full">{children}</main>

        <footer className="border-t border-border bg-background print:hidden">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
            <p>© {new Date().getFullYear()} Rajendra Swim System — Sistem Manajemen Kejuaraan Renang</p>
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
