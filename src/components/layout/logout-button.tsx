'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { UserCircle, ChevronDown, Home, LogOut, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

export function ProfileMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [profile, setProfile] = useState<{ full_name?: string; username?: string; avatar_url?: string; role?: string } | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user?.id) {
          const { data } = await supabase
            .from('profiles')
            .select('full_name, username, avatar_url, role')
            .eq('id', user.id)
            .maybeSingle();
          setProfile(data as any);
        }
      } catch {}
    };
    fetchProfile();
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } finally {
      setOpen(false);
      router.push('/login');
      router.refresh();
    }
  };

  const displayName = profile?.full_name || profile?.username || 'Pengguna';

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full pl-1 pr-2"
      >
        <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-[var(--m-aqua-soft)]">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt={displayName} className="h-full w-full object-cover" />
          ) : (
            <UserCircle className="h-4 w-4 text-[var(--m-aqua-ink)]" />
          )}
        </div>
        <span className="hidden text-sm font-medium text-[var(--m-ink)] md:inline">{displayName}</span>
        <ChevronDown className="h-3.5 w-3.5 text-[var(--m-muted)]" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-56 rounded-xl border border-[var(--m-border)] bg-white p-1 shadow-lg">
            <div className="px-3 py-2">
              <p className="text-sm font-semibold text-[var(--m-ink)]">{profile?.full_name || 'Pengguna'}</p>
              <p className="text-xs text-[var(--m-muted)]">{profile?.username || ''}</p>
            </div>
            <div className="my-1 h-px bg-[var(--m-border)]" />
            {(() => {
              const ADMIN_ROLES = [
                'super_admin',
                'event_admin',
                'operator',
                'admin',
                'admin_kejuaraan',
                'admin_keuangan',
              ];
              const isAdmin = profile?.role && ADMIN_ROLES.includes(profile.role);
              const dashboardHref = isAdmin ? '/dashboard' : '/dashboard-viewer';
              const dashboardLabel = isAdmin ? 'Dasbor Panitia' : 'Dasbor Peserta';

              return (
                <Link
                  href={dashboardHref}
                  onClick={() => setOpen(false)}
                  className={cn(
                    'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-ui',
                    pathname === dashboardHref
                      ? 'bg-[var(--m-soft)] text-[var(--m-aqua-ink)] font-semibold'
                      : 'text-[var(--m-ink)] hover:bg-[var(--m-soft)]'
                  )}
                >
                  <LayoutDashboard className="h-4 w-4 text-[var(--m-aqua)]" />
                  {dashboardLabel}
                </Link>
              );
            })()}
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-ui',
                pathname === '/' ? 'bg-[var(--m-soft)] text-[var(--m-aqua-ink)]' : 'text-[var(--m-ink)] hover:bg-[var(--m-soft)]'
              )}
            >
              <Home className="h-4 w-4" />
              Beranda
            </Link>
            <Link
              href="/profile"
              onClick={() => setOpen(false)}
              className={cn(
                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-ui',
                pathname === '/profile' ? 'bg-[var(--m-soft)] text-[var(--m-aqua-ink)]' : 'text-[var(--m-ink)] hover:bg-[var(--m-soft)]'
              )}
            >
              <UserCircle className="h-4 w-4" />
              Profil Akun
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition-ui hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </div>
        </>
      )}
    </div>
  );
}
