'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  X,
  ChevronRight,
  Info,
  Sparkles,
  Image as ImageIcon,
  Phone,
  Radio,
  BookOpen,
  Trophy,
  CalendarDays,
  LogIn,
  UserPlus,
  LayoutDashboard,
  HelpCircle,
  Home,
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export interface LandingMenuItem {
  href: string;
  label: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  isLive?: boolean;
}

export const MAIN_MENU_ITEMS: LandingMenuItem[] = [
  {
    href: '/',
    label: 'Beranda',
    description: 'Halaman utama Rajendra Meet',
    icon: Home,
  },
  {
    href: '/#tentang',
    label: 'Tentang Kami',
    description: 'Profil & visi kejuaraan renang kami',
    icon: Info,
  },
  {
    href: '/#layanan',
    label: 'Layanan Kami',
    description: 'Event organizer & sistem SCMS',
    icon: Sparkles,
  },
  {
    href: '/scoreboard',
    label: 'Livescore',
    description: 'Papan skor pertandingan real-time',
    icon: Radio,
    badge: 'LIVE',
    isLive: true,
  },
  {
    href: '/galeri',
    label: 'Galeri',
    description: 'Dokumentasi foto dan video turnamen',
    icon: ImageIcon,
  },
  {
    href: '/program',
    label: 'Buku Acara',
    description: 'Susunan acara & jadwal nomor lomba',
    icon: BookOpen,
  },
  {
    href: '/medali',
    label: 'Klasemen Medali',
    description: 'Rekap perolehan medali per kontingen',
    icon: Trophy,
  },
  {
    href: '/kontak',
    label: 'Kontak',
    description: 'Konsultasi & layanan emergency desk',
    icon: Phone,
  },
  {
    href: '/guide',
    label: 'Panduan',
    description: 'Tata cara pendaftaran & regulasi',
    icon: HelpCircle,
  },
];

export function BreadcrumbMenuButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group inline-flex items-center gap-2 rounded-full border border-[var(--m-border)] bg-white/90 px-3.5 py-1.5 text-xs font-semibold text-[var(--m-ink)] shadow-xs backdrop-blur-md transition-all hover:border-[var(--m-aqua)] hover:bg-[var(--m-soft)] hover:text-[var(--m-aqua-ink)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--m-aqua)] cursor-pointer"
      aria-label="Buka Menu Navigasi"
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)] transition-transform group-hover:scale-110">
        <Menu className="h-3.5 w-3.5" />
      </span>
      <span className="font-semibold text-[var(--m-ink)]">Menu</span>
      <span className="text-[var(--m-muted)]/50">/</span>
      <span className="text-[11px] font-medium text-[var(--m-muted)] group-hover:text-[var(--m-aqua-ink)]">
        Navigasi
      </span>
    </button>
  );
}

export function LandingSidebarDrawer({
  open,
  onClose,
  user,
  ready,
  role,
}: {
  open: boolean;
  onClose: () => void;
  user: any;
  ready: boolean;
  role?: string | null;
}) {
  const pathname = usePathname();

  const ADMIN_ROLES = [
    'super_admin',
    'event_admin',
    'operator',
    'admin',
    'admin_kejuaraan',
    'admin_keuangan',
  ];
  const isAdmin = role && ADMIN_ROLES.includes(role);
  const dashboardHref = isAdmin ? '/dashboard' : '/dashboard-viewer';

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="flex w-80 max-w-[85vw] flex-col p-0 border-r border-[var(--m-border)] bg-[var(--m-surface)] z-50"
      >
        {/* Header Drawer */}
        <SheetHeader className="flex flex-row items-center justify-between border-b border-[var(--m-border)] px-5 py-4 space-y-0">
          <div className="flex items-center gap-3">
            <img
              src="/brand/logo.png"
              alt="Rajendra Meet"
              className="h-8 w-auto object-contain"
            />
            <div className="border-l border-[var(--m-border)] pl-2.5">
              <SheetTitle className="text-xs font-semibold italic text-primary leading-tight">
                &ldquo;We Organize, You Achieve&rdquo;
              </SheetTitle>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--m-muted)] transition-colors hover:bg-[var(--m-soft)] hover:text-[var(--m-ink)]"
            aria-label="Tutup menu"
          >
            <X className="h-4 w-4" />
          </button>
        </SheetHeader>

        {/* Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
          <div>
            <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--m-muted)]">
              Menu Utama
            </p>
            <div className="space-y-1">
              {MAIN_MENU_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      'group flex items-center justify-between rounded-xl px-3 py-2.5 transition-all',
                      isActive
                        ? 'bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)] font-semibold'
                        : 'text-[var(--m-ink)] hover:bg-[var(--m-soft)] hover:text-[var(--m-aqua-ink)]'
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors',
                          isActive
                            ? 'bg-[var(--m-aqua)] text-white'
                            : 'bg-[var(--m-soft)] text-[var(--m-muted)] group-hover:bg-[var(--m-aqua-soft)] group-hover:text-[var(--m-aqua-ink)]'
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold">{item.label}</span>
                          {item.badge && (
                            <span
                              className={cn(
                                'rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider',
                                item.isLive
                                  ? 'bg-rose-500 text-white animate-pulse'
                                  : 'bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)]'
                              )}
                            >
                              {item.badge}
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-[10px] text-[var(--m-muted)] line-clamp-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <ChevronRight className="h-3.5 w-3.5 text-[var(--m-muted)]/50 transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--m-aqua-ink)]" />
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Quick Registration Shortcut */}
          <div className="rounded-2xl border border-[var(--m-border)] bg-[var(--m-soft)]/50 p-3">
            <div className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--m-aqua)] text-white">
                <CalendarDays className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <h4 className="text-xs font-bold text-[var(--m-ink)]">Ikuti Kejuaraan</h4>
                <p className="mt-0.5 text-[10px] text-[var(--m-muted)]">
                  Pendaftaran nomor lomba terbuka untuk umum, klub, & sekolah.
                </p>
                <Link
                  href="/daftar-lomba"
                  onClick={onClose}
                  className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-[var(--m-aqua-ink)] hover:underline"
                >
                  Daftar Lomba Sekarang <ChevronRight className="h-3 w-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Drawer: DAFTAR & MASUK DITARO DI PALING BAWAH */}
        <div className="border-t border-[var(--m-border)] bg-[var(--m-soft)]/60 p-4">
          {ready && user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-xl border border-[var(--m-border)] bg-white p-2.5 shadow-xs">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[var(--m-aqua-soft)] text-xs font-bold text-[var(--m-aqua-ink)]">
                  {user.user_metadata?.full_name?.slice(0, 2).toUpperCase() ||
                    user.email?.slice(0, 2).toUpperCase() ||
                    'RM'}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[var(--m-ink)]">
                    {user.user_metadata?.full_name || user.email}
                  </p>
                  <p className="text-[10px] font-medium text-[var(--m-muted)] capitalize">
                    {isAdmin ? 'Panitia SCMS' : 'Akun Peserta'}
                  </p>
                </div>
              </div>
              <Link
                href={dashboardHref}
                onClick={onClose}
                className="pub-btn-primary w-full justify-center text-xs font-semibold gap-2 py-2"
              >
                <LayoutDashboard className="h-4 w-4" /> Buka Dashboard
              </Link>
            </div>
          ) : (
            <div className="space-y-2.5">
              <p className="px-1 text-[11px] font-medium text-[var(--m-muted)]">
                Akses pendaftaran & riwayat atlet:
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/login"
                  onClick={onClose}
                  className="pub-btn-ghost w-full justify-center text-xs font-semibold gap-1.5 py-2"
                >
                  <LogIn className="h-3.5 w-3.5" /> Masuk
                </Link>
                <Link
                  href="/register"
                  onClick={onClose}
                  className="pub-btn-primary w-full justify-center text-xs font-semibold gap-1.5 py-2"
                >
                  <UserPlus className="h-3.5 w-3.5" /> Daftar
                </Link>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

// Backward-compatible exports
export function MenuButton({ onClick }: { onClick: () => void }) {
  return <BreadcrumbMenuButton onClick={onClick} />;
}

export function LandingNav({ onClose }: { onClose?: () => void }) {
  return null;
}

export function LandingDrawer({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children?: React.ReactNode;
}) {
  return null;
}
