'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  CalendarDays,
  Calendar,
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
  ClipboardCheck,
  Menu,
  X,
  Receipt,
  TrendingDown,
  BarChart3,
  ListOrdered,
  CalendarCheck,
  IdCard,
  User,
  Search,
  KeyRound,
  Megaphone,
  type LucideIcon,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
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
  'admin_technical',
  'admin-technical',
];

// Menu khusus Panitia / Admin
const adminNavGroups: NavGroup[] = [
  {
    label: 'Dasbor & Operasional',
    items: [
      { title: 'Dasbor Panitia', href: '/dashboard', icon: LayoutDashboard, description: 'Statistik dan akses cepat' },
      { title: 'Checklist Teknis (TD)', href: '/checklist-teknis', icon: ClipboardCheck, description: 'Rekognisi kolam, TM, & kalibrasi arena' },
      { title: 'Call Room (Meja Panggil)', href: '/call-room', icon: Megaphone, description: 'Check-in fisik atlet, scratch board & antrean heat' },
      { title: 'Jadwal & Agenda', href: '/jadwal', icon: Calendar, description: 'Rundown acara & timeline lomba' },
      { title: 'Antrean Kode OTP', href: '/antrean-otp', icon: KeyRound, description: 'Bypass kode verifikasi limitasi Brevo' },
    ],
  },
  {
    label: 'Kejuaraan & Kontingen',
    items: [
      { title: 'Kejuaraan / Events', href: '/events', icon: CalendarDays, description: 'Kelola master kejuaraan' },
      { title: 'Buku Acara & Seeding', href: '/buku-acara', icon: BookOpen, description: 'Susunan acara, start list & edit lintasan' },
      { title: 'Data Atlet', href: '/athletes', icon: Users, description: 'Master seluruh data atlet' },
      { title: 'Sekolah & Klub', href: '/schools', icon: School, description: 'Master data kontingen tim' },
      { title: 'Kartu Peserta (ID Pass)', href: '/kartu-peserta', icon: IdCard, description: 'Cetak ID Card barcode atlet' },
      { title: 'Juknis Handbook', href: '/juknis', icon: BookmarkCheck, description: 'Official Technical Handbook' },
    ],
  },
  {
    label: 'Nomor Lomba & Hasil',
    items: [
      { title: 'Nomor Lomba', href: '/nomor-lomba', icon: ListOrdered, description: 'Manajemen nomor perlombaan & KU' },
      { title: 'Heat & Lintasan', href: '/heats', icon: Layers, description: 'Visualisasi heat seri & lintasan' },
      { title: 'Input Hasil Lomba', href: '/results', icon: Trophy, description: 'Catat waktu & diskualifikasi juri' },
      { title: 'Perangkingan', href: '/rankings', icon: Timer, description: 'Hasil peringkat resmi catatan waktu' },
      { title: 'Klasemen Medali', href: '/medals', icon: Medal, description: 'Perolehan medali per kontingen' },
      { title: 'Penghargaan & Poin', href: '/awards', icon: Award, description: 'Perenang terbaik & poin kejuaraan' },
      { title: 'Sertifikat Juara', href: '/sertifikat', icon: Award, description: 'Cetak & terbitkan piagam penghargaan' },
      { title: 'Rajendra Record', href: '/rajendra-record', icon: FileSpreadsheet, description: 'Rekor waktu kejuaraan terverifikasi' },
      { title: 'Cetak & Ekspor', href: '/export', icon: Printer, description: 'Export PDF, Excel, & cetak massal' },
    ],
  },
  {
    label: 'Keuangan & Tata Kelola',
    items: [
      { title: 'Tagihan & Verifikasi Klub', href: '/tagihan', icon: Receipt, description: 'Tagihan per klub & verifikasi pembayaran' },
      { title: 'Pengeluaran (Expenses)', href: '/expenses', icon: TrendingDown, description: 'Catat pengeluaran operasional' },
      { title: 'Laporan Kas (Report)', href: '/report', icon: BarChart3, description: 'Laporan laba bersih & mutasi kas' },
      { title: 'Peralatan & Telemetri', href: '/equipment', icon: Wrench, description: 'Telemetri timing & logistik arena' },
      { title: 'Mitra & Sponsor', href: '/sponsors', icon: Building2, description: 'Kelola sponsorship kejuaraan' },
      { title: 'Kelola Beranda CMS', href: '/kelola-beranda', icon: Image, description: 'Banner, testimoni & galeri publik' },
      { title: 'Log Audit & Sistem', href: '/audit', icon: ShieldCheck, description: 'Riwayat aktivitas & audit trail' },
      { title: 'Pengaturan Sistem', href: '/settings', icon: Settings, description: 'Konfigurasi poin & database' },
      { title: 'Panduan Operasional', href: '/panduan', icon: BookOpen, description: 'Buku panduan operasional panitia' },
    ],
  },
];

// Menu terpadu Peserta / Wali / Klub Atlet
const viewerNavGroups: NavGroup[] = [
  {
    label: 'Alur Pendaftaran',
    items: [
      { title: 'Dasbor Peserta', href: '/dashboard-viewer', icon: LayoutDashboard, description: 'Ringkasan persiapan lomba & status' },
      { title: 'Data Saya', href: '/data-saya', icon: User, description: 'Profil data diri perenang pribadi (Mandiri)' },
      { title: 'Data Atlet Tim', href: '/atlet-saya', icon: Users, description: 'Kelola atlet binaan kontingen (Pelatih)' },
      { title: 'Daftar Nomor Lomba', href: '/daftar-lomba', icon: CalendarDays, description: 'Pilih kejuaraan & nomor lomba' },
      { title: 'Pendaftaran & Tagihan', href: '/pendaftaran-saya', icon: ClipboardList, description: 'Cek bukti transfer & invoice resmi' },
      { title: 'Kartu Peserta (ID Pass)', href: '/kartu-peserta', icon: IdCard, description: 'Cetak ID Pass Call Room atlet' },
    ],
  },
  {
    label: 'Arena & Prestasi',
    items: [
      { title: 'Live Scoreboard', href: '/scoreboard', icon: Timer, description: 'Pantauan live timing arena kolam' },
      { title: 'Hasil Lomba', href: '/rankings', icon: Trophy, description: 'Catatan waktu resmi per nomor lomba' },
      { title: 'Rajendra Record', href: '/rajendra-record', icon: Trophy, description: 'Rekor resmi kejuaraan renang' },
      { title: 'Sertifikat Juara', href: '/sertifikat', icon: Award, description: 'Unduh piagam & sertifikat penghargaan' },
    ],
  },
  {
    label: 'Akun & Profil',
    items: [
      { title: 'Profil Pengguna', href: '/profile', icon: UserCircle, description: 'Ubah profil, kontak, & kata sandi' },
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
  const [menuSearchQuery, setMenuSearchQuery] = useState('');
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

  const filteredGroups = useMemo(() => {
    if (!menuSearchQuery.trim()) return currentGroups;
    const q = menuSearchQuery.toLowerCase();
    return currentGroups
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (it) =>
            it.title.toLowerCase().includes(q) ||
            (it.description || '').toLowerCase().includes(q)
        ),
      }))
      .filter((g) => g.items.length > 0);
  }, [currentGroups, menuSearchQuery]);

  return (
    <div className="flex h-full flex-col justify-between py-2">
      <nav className="space-y-4 px-3">
        {/* Search Bar Mobilisasi Menu Sidebar (Poin Item #8) */}
        {!collapsed && (
          <div className="relative px-1 pb-1">
            <Search className="absolute left-3.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari menu sidebar..."
              value={menuSearchQuery}
              onChange={(e) => setMenuSearchQuery(e.target.value)}
              className="h-8 rounded-xl bg-slate-100/80 border-slate-200 pl-8 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-primary/20 shadow-2xs"
            />
          </div>
        )}

        {filteredGroups.map((group: NavGroup) => (
          <div key={group.label} className="space-y-1">
            {!collapsed && (
              <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/70">
                {group.label}
              </p>
            )}
            {group.items.map((item: NavItem) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/dashboard' || item.href === '/dashboard-viewer'
                  ? pathname === item.href
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={true}
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
  const isAdmin = ADMIN_ROLE_LIST.includes(role || '');

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-5 w-5" />
          <span className="sr-only">Buka navigasi</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" showCloseButton={false} className="w-72 p-0 flex flex-col">
        <SheetHeader className="border-b px-5 py-3.5 text-left space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <img
                src="/brand/logo.png"
                alt="Rajendra Swim System"
                className="h-7 w-auto object-contain"
              />
              <span className="font-heading font-black text-sm text-[var(--m-ink)]">
                Rajendra <span className="text-[var(--m-aqua)]">Swim System</span>
              </span>
            </div>
            <SheetTitle className="sr-only">Navigasi Rajendra Swim System</SheetTitle>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-slate-400 hover:text-slate-900 transition-colors"
              aria-label="Tutup navigasi"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-1.5 pt-0.5">
            <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
              DESIGN BY
            </span>
            <img
              src="/brand/rajendra-organizer-logo.png"
              alt="Rajendra Project"
              className="h-4.5 w-auto object-contain"
            />
          </div>

          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200">
              {isAdmin ? 'Rajendra Swim System Admin v4.8' : 'Portal Peserta v4.8'}
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Sync
            </span>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto">
          <SidebarNav onItemClick={() => setOpen(false)} role={role} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
