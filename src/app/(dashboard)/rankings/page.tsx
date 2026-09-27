import { createClient } from '@/lib/supabase/server';
import { LeaderboardView, type CompEvent } from '@/components/modules/leaderboard-view';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { EmptyState } from '@/components/ui/empty-state';
import { Trophy, Lock, Timer, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { EventResultsToggle } from '@/components/modules/event-results-toggle';
import { getEventLiveConfig } from '@/lib/data/live-scoreboard-server';
import { checkEventResultsVisibility } from '@/lib/data/live-scoreboard-settings';

export const dynamic = 'force-dynamic';

export default async function RankingsPage() {
  const supabase = await createClient();

  // 1. Cek wewenang akun pengguna
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let userRole = 'viewer';
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();

    userRole =
      (profile as { role?: string } | null)?.role ||
      (user.user_metadata?.role as string) ||
      'viewer';
  }

  const ADMIN_ROLES = [
    'super_admin',
    'event_admin',
    'operator',
    'admin',
    'admin_kejuaraan',
    'admin_keuangan',
  ];
  const isAdmin = ADMIN_ROLES.includes(userRole);

  // 2. Ambil data kejuaraan
  const { data: events } = await supabase
    .from('events')
    .select('id, name, start_date, end_date')
    .order('start_date', { ascending: false });

  // 3. Ambil data nomor perlombaan
  const { data: compEvents } = await supabase
    .from('competition_events')
    .select('id, name, stroke, distance_meters, gender, grade_level, class_name, event_id')
    .order('distance_meters', { ascending: true });

  const byEvent = (events || []).map((ev) => {
    const liveConfig = getEventLiveConfig(ev.id);
    const resultsVisibility = checkEventResultsVisibility(ev, liveConfig);

    return {
      ...ev,
      liveConfig,
      resultsVisibility,
      compEvents: (compEvents || []).filter((c) => c.event_id === ev.id),
    };
  });

  const breadcrumbHref = isAdmin ? '/dashboard' : '/dashboard-viewer';
  const breadcrumbLabel = isAdmin ? 'Dasbor' : 'Dasbor Peserta';

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumb
        items={[
          { label: breadcrumbLabel, href: breadcrumbHref },
          { label: 'Hasil Lomba & Perangkingan' },
        ]}
        className="mb-2"
      />
      <PageHeader
        title="Hasil Lomba & Perangkingan"
        description="Peringkat resmi per nomor lomba dihitung otomatis lintas seri berdasarkan waktu tempuh tercepat."
        icon={<Trophy className="h-6 w-6" />}
      />

      {byEvent.length === 0 ? (
        <EmptyState
          icon={<Trophy className="h-6 w-6" />}
          title="Belum ada kejuaraan"
          description="Belum ada kejuaraan aktif untuk menampilkan hasil lomba per nomor perlombaan."
        />
      ) : (
        <div className="space-y-6">
          {byEvent.map((ev) => {
            const isVisible = isAdmin || ev.resultsVisibility.isVisible;

            return (
              <Card key={ev.id} className="overflow-hidden border border-slate-200/90 shadow-xs">
                <CardContent className="space-y-4 p-5 sm:p-6">
                  {/* Event Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--m-border)] pb-4">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shadow-2xs">
                        <Trophy className="h-5 w-5" />
                      </div>
                      <div>
                        <h2 className="font-heading font-black text-base sm:text-lg text-slate-950 uppercase">
                          {ev.name}
                        </h2>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {ev.compEvents.length} Nomor Perlombaan Terjadwal
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Admin Toggle Otoritas Publikasi Hasil Lomba */}
                      {isAdmin && (
                        <EventResultsToggle
                          eventId={ev.id}
                          initialMode={ev.liveConfig.resultsMode}
                          event={ev}
                        />
                      )}

                      <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-0.5">
                        {ev.compEvents.length} Nomor Lomba
                      </Badge>
                    </div>
                  </div>

                  {/* Status Notice jika Admin melihat Hasil yang Sedang Ditutup untuk Publik */}
                  {isAdmin && !ev.resultsVisibility.isVisible && (
                    <div className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50/90 text-amber-900 text-xs font-medium flex items-center justify-between gap-2">
                      <span className="flex items-center gap-2">
                        <Lock className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                        <span>
                          Hasil lomba ini sedang <b>DITUTUP</b> untuk peserta &amp; publik (sedang verifikasi wasit).
                        </span>
                      </span>
                      <span className="text-[10px] text-amber-800 font-mono shrink-0">
                        Pratinjau Khusus Admin
                      </span>
                    </div>
                  )}

                  {/* Body Content */}
                  {!isVisible ? (
                    /* Tampilan jika Peserta / Publik membuka Hasil yang Sedang Ditutup oleh Panitia */
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-8 text-center space-y-3 my-2">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 mx-auto shadow-2xs">
                        <Lock className="h-6 w-6 text-amber-700" />
                      </div>
                      <h3 className="font-heading font-black text-base text-slate-900">
                        Hasil Perlombaan Belum Dipublikasikan
                      </h3>
                      <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                        {ev.resultsVisibility.description ||
                          'Panitia Pelaksana & Dewan Wasit sedang melakukan verifikasi dan rekapitulasi catatan waktu resmi untuk kejuaraan ini. Hasil nomor lomba akan otomatis ditampilkan setelah disahkan.'}
                      </p>
                      <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
                        <Link href="/scoreboard" target="_blank">
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-1.5 text-xs font-bold border-amber-300 text-amber-900 hover:bg-amber-100"
                          >
                            <Timer className="h-3.5 w-3.5 text-blue-600" /> Pantau Scoreboard Arena Live
                          </Button>
                        </Link>
                        <Link href="/dashboard-viewer">
                          <Button size="sm" className="text-xs font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white">
                            Kembali ke Dasbor
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : ev.compEvents.length === 0 ? (
                    <p className="py-6 text-center text-sm text-[var(--m-muted)]">
                      Belum ada nomor lomba untuk kejuaraan ini.
                    </p>
                  ) : (
                    <LeaderboardView
                      eventId={ev.id}
                      compEvents={ev.compEvents as CompEvent[]}
                      embedded
                      showHeatTab={false}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
