import { createClient } from '@/lib/supabase/server';
import { PublicShell } from '@/components/layout/public-shell';
import { LeaderboardView, type CompEvent } from '@/components/modules/leaderboard-view';
import { RouteEventSelect } from '@/components/modules/route-event-select';
import { Waves } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function ScoreboardPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event: eventId } = await searchParams;
  const supabase = await createClient();

  const { data: events } = await supabase
    .from('events')
    .select('id, name, location, start_date, end_date, lane_count, pool_type')
    .order('start_date', { ascending: false });

  const current = events?.find((e) => e.id === eventId) ?? events?.[0] ?? null;

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
    >
      <div className="pub-container pb-16">
        {!events || events.length === 0 ? (
          <div className="pub-card p-12 text-center">
            <Waves className="mx-auto h-10 w-10 text-[var(--m-aqua)]" />
            <h3 className="mt-3 font-semibold text-[var(--m-ink)]">Belum ada kejuaraan</h3>
            <p className="mt-1 text-sm text-[var(--m-muted)]">
              Panitia belum mempublikasikan kejuaraan apa pun.
            </p>
          </div>
        ) : (
          <>
            {/* Pemilih kejuaraan */}
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <RouteEventSelect events={events ?? []} current={current?.id ?? ''} basePath="/scoreboard" />
              <span className="pub-chip">
                {current?.lane_count || 8} lintasan
              </span>
              {current?.pool_type && (
                <span className="pub-chip">{current.pool_type}</span>
              )}
            </div>

            {/* Leaderboard per acara (satu nomor yang dipilih) */}
            {current && compEvents.length > 0 ? (
              <div className="live-card overflow-hidden p-1">
                <LeaderboardView
                  eventId={current.id}
                  compEvents={compEvents}
                  showHeatTab={false}
                />
              </div>
            ) : (
              <div className="pub-card p-12 text-center">
                <Waves className="mx-auto h-10 w-10 text-[var(--m-aqua)]" />
                <h3 className="mt-3 font-semibold text-[var(--m-ink)]">
                  Belum ada nomor lomba
                </h3>
                <p className="mt-1 text-sm text-[var(--m-muted)]">
                  Kejuaraan ini belum memiliki nomor lomba.
                </p>
              </div>
            )}

            <div className="mt-8 text-center">
              <Link
                href={current ? `/public-live/${current.id}` : '/live'}
                className="pub-btn-ghost"
              >
                Buka Live Board lengkap
              </Link>
            </div>
          </>
        )}
      </div>
    </PublicShell>
  );
}
