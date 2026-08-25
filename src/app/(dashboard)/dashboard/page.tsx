import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { LayoutDashboard, CalendarDays, Users, ClipboardList, School, Trophy, Timer, Award } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Admin (can_operate) boleh membaca semua data via RLS.
  const [
    { count: eventCount },
    { count: athleteCount },
    { count: regCount },
    { count: schoolCount },
  ] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('athletes').select('*', { count: 'exact', head: true }),
    supabase.from('registrations').select('*', { count: 'exact', head: true }),
    supabase.from('schools').select('*', { count: 'exact', head: true }),
  ]);

  const stats = [
    { label: 'Kejuaraan', value: eventCount ?? 0, href: '/events', icon: CalendarDays },
    { label: 'Atlet', value: athleteCount ?? 0, href: '/athletes', icon: Users },
    { label: 'Pendaftaran', value: regCount ?? 0, href: '/verifikasi-pembayaran', icon: ClipboardList },
    { label: 'Sekolah / Klub', value: schoolCount ?? 0, href: '/schools', icon: School },
  ];

  const quickLinks = [
    { label: 'Acara & Heat', href: '/heats', icon: Timer },
    { label: 'Input Hasil', href: '/results', icon: Trophy },
    { label: 'Perangkingan', href: '/rankings', icon: Award },
    { label: 'Klasemen Medali', href: '/medals', icon: Award },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard' }]} className="mb-2" />
      <PageHeader
        title="Dashboard Panitia"
        description="Kelola seluruh rangkaian kejuaraan renang dari satu panel."
        icon={<LayoutDashboard className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => {
          const Icon = s.icon;
          return (
            <Link
              key={s.label}
              href={s.href}
              className={`reveal`}
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <Card className="elevated transition-ui hover:-translate-y-0.5 hover:shadow-pop">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold tabular-nums text-[var(--m-ink)]">{s.value}</div>
                    <div className="text-xs font-medium text-[var(--m-muted)]">{s.label}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <div>
        <h2 className="h-section mb-3">Modul Cepat</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickLinks.map((q, i) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.href}
                href={q.href}
                className={`pub-card elevated flex items-center gap-3 p-4 transition-ui hover:-translate-y-0.5 hover:border-primary/40 reveal`}
                style={{ animationDelay: `${(i + 4) * 80}ms` }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-[var(--m-ink)]">{q.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
