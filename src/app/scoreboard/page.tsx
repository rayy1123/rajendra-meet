import { createClient } from '@/lib/supabase/server';
import { PublicShell } from '@/components/layout/public-shell';
import { LeaderboardView, type CompEvent } from '@/components/modules/leaderboard-view';
import { RouteEventSelect } from '@/components/modules/route-event-select';
import { LiveClosedCard } from '@/components/modules/live-closed-card';
import { getEventLiveConfig } from '@/lib/data/live-scoreboard-server';
import { checkEventLiveStatus } from '@/lib/data/live-scoreboard-settings';
import { Waves, Radio, Lock } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/ui/empty-state';

export const dynamic = 'force-dynamic';

export default async function ScoreboardPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event: eventId } = await searchParams;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    isAdmin = profile?.role === 'admin' || profile?.role === 'operator';
  }

  const { data: events } = await supabase
    .from('events')
    .select('id, name, location, start_date, end_date, lane_count, pool_type')
    .order('start_date', { ascending: false });

  const current = events?.find((e) => e.id === eventId) ?? events?.[0] ?? null;

  const liveConfig = current ? getEventLiveConfig(current.id) : null;
  const liveStatus = current ? checkEventLiveStatus(current, liveConfig) : null;

  let compEvents: CompEvent[] = [];
  if (current) {
    const { data: ce } = await supabase
      .from('competition_events')
      .select('id, name, stroke, distance_meters, gender, grade_level, class_name')
      .eq('event_id', current.id)
      .order('distance_meters', { ascending: true });
    compEvents = (ce ?? []) as CompEvent[];
  }

  return (
    <PublicShell
      title="Scoreboard Kejuaraan"
      subtitle="Pantau hasil perlombaan secara langsung. Pilih kejuaraan lalu nomor lomba untuk melihat peringkat per acara."
      breadcrumbItems={[
        { label: 'Beranda', href: '/' },
        { label: 'Live Scoreboard' },
      ]}
    >
      <div className="pub-container space-y-6">
        {!events || events.length === 0 ? (
          <EmptyState
            icon={<Waves className="h-6 w-6 text-primary" />}
            title="Belum ada kejuaraan"
            description="Panitia belum mempublikasikan kejuaraan apa pun."
            className="my-6"
          />
        ) : (
          <>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--m-muted)]">
                  Event Terpilih
                </p>
                <p className="text-sm font-bold text-[var(--m-ink)]">{current?.name}</p>
                <p className="text-xs text-[var(--m-muted)]">
                  {current?.location ? `${current.location} · ` : ''}
                  {current?.start_date && new Date(current.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  {current?.end_date ? ` - ${new Date(current.end_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}` : ''}
                </p>
              </div>
              <RouteEventSelect events={events ?? []} current={current?.id ?? ''} basePath="/scoreboard" />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="pub-chip">{current?.lane_count || 8} lintasan</span>
              {current?.pool_type && <span className="pub-chip">{current.pool_type}</span>}
              {liveStatus?.isActive ? (
                <span className="pub-chip bg-emerald-50 text-emerald-700 border-emerald-300 font-bold flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  Live Scoreboard Aktif
                </span>
              ) : (
                <span className="pub-chip bg-amber-50 text-amber-800 border-amber-300 font-bold flex items-center gap-1.5">
                  <Lock className="h-3 w-3 text-amber-600" />
                  Scoreboard Belum Berjalan
                </span>
              )}
            </div>

            {current && !liveStatus?.isActive ? (
              <LiveClosedCard
                event={current}
                reason={liveStatus?.reason || 'not_started'}
                mode={liveConfig?.mode}
                isAdmin={isAdmin}
              />
            ) : current && compEvents.length > 0 ? (
              <div className="live-card overflow-hidden p-1">
                <LeaderboardView eventId={current.id} compEvents={compEvents} showHeatTab={false} />
              </div>
            ) : (
              <EmptyState
                icon={<Waves className="h-6 w-6 text-primary" />}
                title="Belum ada nomor lomba"
                description="Kejuaraan ini belum memiliki nomor lomba."
                className="my-6"
              />
            )}

            {liveStatus?.isActive && (
              <div className="mt-8 text-center">
                <Link href={current ? `/public-live/${current.id}` : '/live'} className="pub-btn-ghost">
                  Buka Live Board lengkap
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </PublicShell>
  );
}
