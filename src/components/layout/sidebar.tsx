'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import {
  CalendarDays,
  FileSpreadsheet,
  Tv,
  Layers,
  Trophy,
  Award,
  Waves,
  Menu,
  Printer,
  LogOut,
  User,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

const navItems = [
  {
    title: 'Kejuaraan / Events',
    href: '/events',
    icon: CalendarDays,
  },
  {
    title: 'Import Buku Acara',
    href: '/import',
    icon: FileSpreadsheet,
  },
  {
    title: 'Auto-Heat Generator',
    href: '/heats',
    icon: Layers,
  },
  {
    title: 'Live Scoreboard',
    href: '/scoreboard',
    icon: Tv,
  },
  {
    title: 'Input Hasil Lomba',
    href: '/results',
    icon: Trophy,
  },
  {
    title: 'Klasemen Medali',
    href: '/medals',
    icon: Award,
  },
  {
    title: 'Cetak & Ekspor PDF/Excel',
    href: '/export',
    icon: Printer,
  },
];

interface SidebarNavProps {
  onItemClick?: () => void;
}

export function SidebarNav({ onItemClick }: SidebarNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        setUserEmail(user.email);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  return (
    <div className="flex flex-col h-full justify-between py-4">
      <nav className="space-y-1 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onItemClick}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-muted-foreground')} />
              {item.title}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout Button */}
      <div className="px-2 pt-4 border-t space-y-2">
        {userEmail && (
          <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground rounded-lg bg-muted/50">
            <User className="h-4 w-4 shrink-0 text-blue-600" />
            <span className="truncate font-medium">{userEmail}</span>
          </div>
        )}

        <Button
          variant="ghost"
          onClick={handleLogout}
          className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 px-3"
        >
          <LogOut className="h-4 w-4" />
          <span>Keluar</span>
        </Button>
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
          <span className="sr-only">Toggle Navigation Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64 p-0">
        <div className="flex items-center gap-2 border-b px-6 py-4">
          <Waves className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-lg tracking-tight">Rajendra Meet</span>
        </div>
        <SidebarNav onItemClick={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}