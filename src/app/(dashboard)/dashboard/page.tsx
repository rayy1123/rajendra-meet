import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { CalendarDays, Users, School, Layers, Trophy, Medal, LayoutDashboard } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export const dynamic = 'force-dynamic';

/** Menghitung baris tanpa menarik datanya. */
async function countRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  table: string
): Promise<number> {
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true });
  if (error) return 0;
  return count ?? 0;
}

export default async function DashboardPage() {
  const supabase = await createClient();

  const [events, athletes, schools, competitionEvents, heats, results] =
    await Promise.all([
      countRows(supabase, 'events'),
      countRows(supabase, 'athletes'),
      countRows(supabase, 'schools'),
      countRows(supabase, 'competition_events'),
      countRows(supabase, 'heats'),
      countRows(supabase, 'results'),
    ]);

  const { data: activeEvent } = await supabase
    .from('events')
    .select('id, name, location, start_date, end_date, lane_count')
    .order('start_date', { ascending: false })
    .limit(1)
    .maybeSingle();

  const stats = [
    { label: 'Total Event', value: events, icon: CalendarDays, href: '/events' },
    { label: 'Total Atlet', value: athletes, icon: Users, href: '/athletes' },
    { label: 'Sekolah / Klub', value: schools, icon: School, href: '/schools' },
    { label: 'Nomor Lomba', value: competitionEvents, icon: Trophy, href: '/events' },
    { label: 'Total Acara', value: heats, icon: Layers, href: '/heats' },
    { label: 'Hasil Masuk', value: results, icon: Medal, href: '/results' },
  ];

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard' }]} className="mb-2" />
      <PageHeader
        title="Ringkasan Dashboard"
        description="Data langsung dari database kejuaraan."
        icon={<LayoutDashboard className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <Card className="group h-full transition-all duration-200 hover:-translate-y-1 hover:shadow-soft">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {s.label}
                  </CardTitle>
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary-ink text-primary-foreground shadow-sm">
                    <Icon className="h-4 w-4" />
                  </span>
                </CardHeader>
                <CardContent className="text-3xl font-bold tracking-tight text-foreground">
                  {s.value}
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {activeEvent ? (
        <Card className="border-primary/15 bg-gradient-to-br from-primary-soft/40 to-card">
          <CardHeader>
            <CardTitle className="text-base">Event Terkini</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="text-lg font-semibold text-foreground">{activeEvent.name}</p>
            <p className="text-muted-foreground">{activeEvent.location}</p>
            <p className="text-muted-foreground">
              {activeEvent.start_date} s/d {activeEvent.end_date} ·{' '}
              <span className="inline-flex items-center rounded-lg bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary-ink">
                {activeEvent.lane_count} lintasan
              </span>
            </p>
            <div className="pt-3">
              <Link
                href={`/public-live/${activeEvent.id}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-ink"
              >
                Buka halaman live publik →
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground text-sm">
            Belum ada event. Buat event pertama di menu Kejuaraan / Events.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
