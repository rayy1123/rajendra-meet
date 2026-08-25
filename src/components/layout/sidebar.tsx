'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import {
  CalendarDays,
  LayoutDashboard,
  Users,
  School,
  FileSpreadsheet,
  Layers,
  Trophy,
  Award,
  Medal,
  Menu,
  Printer,
  User,
  UserCircle,
  Settings,
  Timer,
  BookOpen,
  CreditCard,
  Wrench,
  ShieldCheck,
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
import { Badge } from '@/components/ui/badge';

/**
 * Struktur navigasi, dikelompokkan agar alur kerja panitia mudah diikuti.
 * Setiap href WAJIB punya halaman nyata di src/app/(dashboard).
 */
interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
}
interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: 'Ikhtisar',
    items: [
      { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
      { title: 'Kejuaraan / Events', href: '/events', icon: CalendarDays },
    ],
  },
  {
    label: 'Akun Saya',
    items: [
      { title: 'Dashboard', href: '/dashboard-viewer', icon: LayoutDashboard },
      { title: 'Daftar Lomba', href: '/daftar-lomba', icon: CalendarDays },
      { title: 'Atlet Saya', href: '/atlet-saya', icon: User },
      { title: 'Pendaftaran Saya', href: '/pendaftaran-saya', icon: CreditCard },
      { title: 'Profil', href: '/profile', icon: UserCircle },
    ],
  },
  {
    label: 'Data Peserta',
    items: [
      { title: 'Atlet', href: '/athletes', icon: Users },
      { title: 'Sekolah / Klub', href: '/schools', icon: School },
    ],
  },
  {
    label: 'Operasional Lomba',
    items: [
      { title: 'Acara & Heat', href: '/heats', icon: Layers },
      { title: 'Heat & Lane', href: '/heat-lane', icon: Layers },
      { title: 'Input Hasil', href: '/results', icon: Trophy },
      { title: 'Perangkingan', href: '/rankings', icon: Timer },
      { title: 'Klasemen Medali', href: '/medals', icon: Medal },
    ],
  },
  {
    label: 'Hasil & Penghargaan',
    items: [
      { title: 'Penghargaan', href: '/awards', icon: Award },
      { title: 'Sertifikat', href: '/sertifikat', icon: Award },
      { title: 'Rajendra Record', href: '/rajendra-record', icon: FileSpreadsheet },
      { title: 'Cetak & Ekspor', href: '/export', icon: Printer },
    ],
  },
  {
    label: 'Sistem',
    items: [
      { title: 'Verifikasi Pembayaran', href: '/verifikasi-pembayaran', icon: CreditCard },
      { title: 'Peralatan', href: '/equipment', icon: Wrench },
      { title: 'Log Audit', href: '/audit', icon: ShieldCheck },
      { title: 'Pengaturan', href: '/settings', icon: Settings },
      { title: 'Panduan', href: '/panduan', icon: BookOpen },
    ],
  },
];

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  event_admin: 'Event Admin',
  operator: 'Operator',
  viewer: 'Viewer',
};

interface SidebarNavProps {
  onItemClick?: () => void;
  collapsed?: boolean;
}

export function SidebarNav({ onItemClick, collapsed = false }: SidebarNavProps) {
  const pathname = usePathname();
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user?.email) setUserEmail(user.email);
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        if (profile?.role) setRole(profile.role);
      }
    };
    fetchUser();
  }, [supabase]);

  const isAdmin =
    role && ['super_admin', 'event_admin', 'operator'].includes(role);
  // Viewer hanya melihat grup "Akun Saya"; panitia/admin melihat semua menu.
  const visibleGroups = isAdmin
    ? navGroups
    : navGroups.filter((g) => g.label === 'Akun Saya');

  return (
    <div className="flex h-full flex-col justify-between py-4">
      <nav className="space-y-5 px-3">
        {visibleGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  title={collapsed ? item.title : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <Icon
                    className={cn(
                      'h-4 w-4 shrink-0',
                      isActive ? 'text-white' : 'text-primary'
                    )}
                  />
                  {!collapsed && item.title}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Info & Logout */}
      <div className="space-y-2 px-3 pt-4 border-t border-border">
        {userEmail && (
          <div className={cn('flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2', collapsed && 'justify-center px-0')}>
            <User className="h-4 w-4 shrink-0 text-primary" />
            {!collapsed && (
              <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">
                {userEmail}
              </span>
            )}
            {!collapsed && role && (
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                {ROLE_LABELS[role] ?? role}
              </Badge>
            )}
          </div>
        )}
      </div>
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
            className="h-7 w-auto rounded-md"
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
