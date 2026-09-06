'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  ClipboardList,
  UserCircle,
  Waves,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Menu } from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
}

const navItems: NavItem[] = [
  { title: 'Dashboard', href: '/dashboard-viewer', icon: LayoutDashboard, description: 'Ringkasan akun dan akses cepat' },
  { title: 'Daftar Lomba', href: '/daftar-lomba', icon: CalendarDays, description: 'Pilih kejuaraan untuk mendaftar' },
  { title: 'Atlet Saya', href: '/atlet-saya', icon: Users, description: 'Kelola data atlat Anda' },
  { title: 'Pendaftaran', href: '/pendaftaran-saya', icon: ClipboardList, description: 'Pantau status pembayaran & verifikasi' },
  { title: 'Profil', href: '/profile', icon: UserCircle, description: 'Kelola data akun Anda' },
];

export function SidebarNav({ onItemClick, collapsed = false }: { onItemClick?: () => void; collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col justify-between py-4">
      <nav className="space-y-1.5 px-3">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">Akun Saya</p>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              title={item.title}
              className={cn(
                'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-ui',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              {isActive && !collapsed && (
                <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <Icon
                className={cn(
                  'h-4 w-4 shrink-0',
                  isActive ? 'text-primary' : 'text-[var(--m-muted)]'
                )}
              />
              {!collapsed && item.title}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function MobileSidebar() {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Buka navigasi</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0 flex flex-col">
        <SheetHeader className="flex flex-row items-center gap-2 border-b px-6 py-4 text-left space-y-0">
          <img
            src="/brand/logo.png"
            alt="Rajendra Meet"
            className="h-7 w-auto"
          />
          <SheetTitle className="font-bold text-lg tracking-tight">
            Rajendra Meet
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav onItemClick={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
