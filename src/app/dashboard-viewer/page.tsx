import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Card, CardContent } from '@/components/ui/card';
import DashboardLayout from '@/components/layout/layout';
import { User, UserCircle, ClipboardList, CalendarDays, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardViewerPage() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single();
  const displayName = profile?.full_name || user.email || 'Pengguna';

  // Ringkasan data milik viewer
  const [{ count: athleteCount }, { count: eventCount }] = await Promise.all([
    supabase.from('athletes').select('id', { count: 'exact', head: true }).eq('owner_id', user.id),
    supabase.from('events').select('id', { count: 'exact', head: true }).eq('is_published', true),
  ]);

  // Ambil id atlet milik viewer untuk menghitung pendaftaran
  const { data: myAthletes } = await supabase
    .from('athletes')
    .select('id')
    .eq('owner_id', user.id);
  const myIds = (myAthletes ?? []).map((a) => a.id);

  const { count: regCount } = await supabase
    .from('registrations')
    .select('id', { count: 'exact', head: true })
    .in('athlete_id', myIds.length ? myIds : ['00000000-0000-0000-0000-000000000000']);

  // Pendaftaran terbaru milik viewer
  const { data: recent } = await supabase
    .from('registrations')
    .select(
      'id, created_at, competition_events(name, stroke, distance_meters), events(name), athletes(full_name)'
    )
    .in('athlete_id', myIds.length ? myIds : ['00000000-0000-0000-0000-000000000000'])
    .order('created_at', { ascending: false })
    .limit(5);

  interface RegRow {
    id: string;
    created_at: string;
    athletes: { full_name: string }[] | null;
    competition_events: { name: string; stroke: string; distance_meters: number }[] | null;
    events: { name: string }[] | null;
  }

  const stats = [
    { label: 'Atlet Saya', value: athleteCount ?? 0, href: '/atlet-saya', icon: User },
    { label: 'Pendaftaran', value: regCount ?? 0, href: '/pendaftaran-saya', icon: ClipboardList },
    { label: 'Event Aktif', value: eventCount ?? 0, href: '/daftar-lomba', icon: CalendarDays },
  ];

  const quickLinks = [
    { label: 'Atlet Saya', href: '/atlet-saya', icon: User },
    { label: 'Daftar Lomba', href: '/daftar-lomba', icon: CalendarDays },
    { label: 'Pendaftaran', href: '/pendaftaran-saya', icon: ClipboardList },
    { label: 'Profil', href: '/profile', icon: UserCircle },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb items={[{ label: 'Dashboard' }]} className="mb-2" />
        <PageHeader
          title={`Selamat datang, ${displayName}`}
          description="Selamat datang di panel Anda. Kelola atlet dan pantau pendaftaran lomba renang."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {stats.map((s, i) => {
            const Icon = s.icon;
            return (
              <Link key={s.label} href={s.href} className={`reveal`} style={{ animationDelay: `${i * 80}ms` }}>
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

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {quickLinks.map((q, i) => {
            const Icon = q.icon;
            return (
              <Link
                key={q.href}
                href={q.href}
                className={`pub-card elevated flex items-center gap-3 p-4 transition-ui hover:-translate-y-0.5 hover:border-primary/40 reveal`}
                style={{ animationDelay: `${(i + 3) * 80}ms` }}
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-semibold text-[var(--m-ink)]">{q.label}</span>
              </Link>
            );
          })}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="h-section">Pendaftaran Terbaru</h2>
            <Link
              href="/pendaftaran-saya"
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Lihat semua <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {recent && recent.length > 0 ? (
            <div className="space-y-2">
              {recent.map((r: RegRow) => (
                <Card key={r.id}>
                  <CardContent className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-semibold text-[var(--m-ink)]">
                        {r.athletes?.[0]?.full_name ?? 'Atlet'}
                      </div>
                      <div className="text-xs text-[var(--m-muted)]">
                        {r.competition_events?.[0]?.name ?? 'Nomor lomba'} · {r.events?.[0]?.name ?? 'Event'}
                      </div>
                    </div>
                    <div className="text-xs text-[var(--m-muted)]">
                      {new Date(r.created_at).toLocaleDateString('id-ID')}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-10 text-center text-sm text-[var(--m-muted)]">
                Belum ada pendaftaran. Tambahkan atlet di{' '}
                <Link href="/atlet-saya" className="font-semibold text-primary hover:underline">
                  Atlet Saya
                </Link>
                , lalu daftarkan lewat{' '}
                <Link href="/daftar-lomba" className="font-semibold text-primary hover:underline">
                  Daftar Lomba
                </Link>
                .
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
