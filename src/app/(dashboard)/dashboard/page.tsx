import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/server';
import { CalendarDays, Users, School, Layers, Trophy, Medal, LayoutDashboard } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

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
      <PageHeader
        title="Ringkasan Dashboard"
        description="Data langsung dari database kejuaraan."
        icon={<LayoutDashboard className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Link key={s.label} href={s.href}>
              <Card className="hover:border-primary/50 transition-colors h-full">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {s.label}
                  </CardTitle>
                  <Icon className="h-4 w-4 text-primary" />
                </CardHeader>
                <CardContent className="text-3xl font-bold">{s.value}</CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {activeEvent ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Event Terkini</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="text-lg font-semibold">{activeEvent.name}</p>
            <p className="text-muted-foreground">{activeEvent.location}</p>
            <p className="text-muted-foreground">
              {activeEvent.start_date} s/d {activeEvent.end_date} ·{' '}
              {activeEvent.lane_count} lintasan
            </p>
            <div className="pt-3">
              <Link
                href={`/public-live/${activeEvent.id}`}
                className="text-primary hover:underline font-medium"
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
