'use client';

import { useState, useEffect } from 'react';
import { SidebarNav, MobileSidebar } from '@/components/layout/sidebar';
import { Waves, PanelLeft, PanelLeftClose } from 'lucide-react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/modules/theme-toggle';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('scms-sidebar-collapsed') === '1';
  });

  // Persist preferensi di localStorage.
  useEffect(() => {
    localStorage.setItem('scms-sidebar-collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      {/* Sidebar Desktop — collapsible */}
      <aside
        className={`sticky top-0 hidden h-screen shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 md:flex ${
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
              className="h-8 w-auto rounded-md"
            />
          )}
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            className="ml-auto rounded-lg p-1.5 text-[var(--m-muted)] transition-colors hover:bg-[var(--m-soft)] hover:text-[var(--m-ink)]"
            aria-label={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
            title={collapsed ? 'Buka sidebar' : 'Tutup sidebar'}
          >
            {collapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav collapsed={collapsed} />
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Mobile Header Bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:hidden">
          <div className="flex items-center gap-2">
            <MobileSidebar />
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Waves className="h-4 w-4" />
            </span>
            <span className="font-bold text-sm tracking-tight text-foreground">
              Rajendra Meet
            </span>
          </div>
          <Link
            href="/scoreboard"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Live
          </Link>
          <ThemeToggle />
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
