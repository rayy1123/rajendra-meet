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
  School,
  Layers,
  Trophy,
  Timer,
  Medal,
  Award,
  FileSpreadsheet,
  Printer,
  CreditCard,
  Wrench,
  ShieldCheck,
  Settings,
  BookOpen,
  Image,
  Building2,
  BookmarkCheck,
  Menu,
  Receipt,
  TrendingDown,
  BarChart3,
  ListOrdered,
  CalendarCheck,
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

interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const ADMIN_ROLE_LIST = [
  'super_admin',
  'event_admin',
  'operator',
  'admin',
  'admin_kejuaraan',
  'admin_keuangan',
];

// Menu khusus Panitia / Admin
const adminNavGroups: NavGroup[] = [
  {
    label: 'Utama',
    items: [
      { title: 'Dasbor Panitia', href: '/dashboard', icon: LayoutDashboard, description: 'Statistik dan akses cepat' },
    ],
  },
  {
    label: 'Kejuaraan & Dokumen',
    items: [
      { title: 'Kejuaraan / Events', href: '/events', icon: CalendarDays, description: 'Kelola daftar kejuaraan' },
      { title: 'Daftar Perlombaan', href: '/perlombaan', icon: CalendarCheck, description: 'Kartu kejuaraan & import Excel' },
      { title: 'Data Atlet', href: '/athletes', icon: Users, description: 'Master seluruh data atlet' },
      { title: 'Sekolah & Klub', href: '/schools', icon: School, description: 'Master data kontingen' },
      { title: 'Buku Acara', href: '/buku-acara', icon: BookOpen, description: 'Susunan acara dan start list' },
      { title: 'Juknis Handbook', href: '/juknis', icon: BookmarkCheck, description: 'Official Technical Handbook' },
      { title: 'Kartu Peserta', href: '/kartu-peserta', icon: ClipboardList, description: 'Cetak ID Card atlet' },
      { title: 'Kelola Beranda CMS', href: '/kelola-beranda', icon: Image, description: 'Banner, testimoni, gallery' },
      { title: 'Mitra & Sponsor', href: '/sponsors', icon: Building2, description: 'Kelola sponsorship' },
    ],
  },
  {
    label: 'Acara & Hasil Lomba',
    items: [
      { title: 'Nomor Lomba', href: '/nomor-lomba', icon: ListOrdered, description: 'Manajemen nomor perlombaan' },
      { title: 'Heat & Lintasan', href: '/heats', icon: Layers, description: 'Seeding seri dan lintasan' },
      { title: 'Input Hasil Lomba', href: '/results', icon: Trophy, description: 'Catat waktu dan diskualifikasi' },
      { title: 'Perangkingan', href: '/rankings', icon: Timer, description: 'Hasil peringkat resmi' },
      { title: 'Klasemen Medali', href: '/medals', icon: Medal, description: 'Perolehan medali kontingen' },
      { title: 'Penghargaan', href: '/awards', icon: Award, description: 'Perenang terbaik & point' },
      { title: 'Sertifikat Juara', href: '/sertifikat', icon: Award, description: 'Cetak piagam penghargaan' },
      { title: 'Rajendra Record', href: '/rajendra-record', icon: FileSpreadsheet, description: 'Rekor waktu kejuaraan' },
      { title: 'Cetak & Ekspor', href: '/export', icon: Printer, description: 'Export PDF, Excel, & cetak' },
    ],
  },
  {
    label: 'Keuangan & Sistem',
    items: [
      { title: 'Tagihan Klub', href: '/tagihan', icon: Receipt, description: 'Tagihan per klub & cetak rekap' },
      { title: 'Pengeluaran (Expenses)', href: '/expenses', icon: TrendingDown, description: 'Catat pengeluaran operasional' },
      { title: 'Laporan Keuangan (Report)', href: '/report', icon: BarChart3, description: 'Laporan kas & ekspor Excel' },
      { title: 'Verifikasi Pembayaran', href: '/verifikasi-pembayaran', icon: CreditCard, description: 'Cek bukti transfer pendaftaran' },
      { title: 'Peralatan Arena', href: '/equipment', icon: Wrench, description: 'Logistik & fasilitas kolam' },
      { title: 'Log Audit', href: '/audit', icon: ShieldCheck, description: 'Riwayat aktivitas sistem' },
      { title: 'Pengaturan Sistem', href: '/settings', icon: Settings, description: 'Konfigurasi poin & database' },
      { title: 'Panduan Operasional', href: '/panduan', icon: BookOpen, description: 'Buku panduan operasional panitia' },
    ],
  },
];

// Menu khusus Peserta / Wali / Atlet
const viewerNavGroups: NavGroup[] = [
  {
    label: 'Akun Peserta',
    items: [
      { title: 'Dasbor Peserta', href: '/dashboard-viewer', icon: LayoutDashboard, description: 'Ringkasan akun dan akses cepat' },
      { title: 'Daftar Lomba', href: '/daftar-lomba', icon: CalendarDays, description: 'Pilih kejuaraan untuk mendaftar' },
      { title: 'Atlet Saya', href: '/atlet-saya', icon: Users, description: 'Kelola data atlet Anda' },
      { title: 'Pendaftaran Saya', href: '/pendaftaran-saya', icon: ClipboardList, description: 'Pantau status pembayaran & invoice' },
      { title: 'Profil Akun', href: '/profile', icon: UserCircle, description: 'Kelola data akun Anda' },
    ],
  },
];

export function SidebarNav({
  onItemClick,
  collapsed = false,
  role,
}: {
  onItemClick?: () => void;
  collapsed?: boolean;
  role?: string;
}) {
  const pathname = usePathname();
  const [activeRole, setActiveRole] = useState<string>(role || 'viewer');
  const supabase = createClient();

  useEffect(() => {
    if (role) {
      setActiveRole(role);
      return;
    }

    // Fallback: deteksi role dari sesi jika props role belum tersedia
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        const userRole = (profile as { role?: string } | null)?.role ||
          (user.user_metadata?.role as string) ||
          'viewer';
        setActiveRole(userRole);
      }
    };
    fetchUserRole();
  }, [role, supabase]);

  const isAdmin = ADMIN_ROLE_LIST.includes(activeRole);
  const currentGroups = isAdmin ? adminNavGroups : viewerNavGroups;

  return (
    <div className="flex h-full flex-col justify-between py-2">
      <nav className="space-y-4 px-3">
        {currentGroups.map((group) => (
          <div key={group.label} className="space-y-1">
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard' || item.href === '/dashboard-viewer'
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onItemClick}
                  title={item.title}
                  className={cn(
                    'relative flex items-center gap-3 rounded-lg px-3 py-2 text-xs sm:text-sm font-medium transition-ui',
                    collapsed && 'justify-center px-0',
                    isActive
                      ? 'bg-primary/10 text-primary font-bold'
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
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>
    </div>
  );
}

export function MobileSidebar({ role }: { role?: string }) {
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
          <SidebarNav onItemClick={() => setOpen(false)} role={role} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
