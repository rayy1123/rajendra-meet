/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { HeatLaneSelectors, type Opt } from '@/components/modules/heat-lane-selectors';
import { Layers, UserX } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function HeatLanePage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; ce?: string; heat?: string }>;
}) {
  const { event: eventId, ce: ceId, heat: heatId } = await searchParams;
  const supabase = await createClient();

  const { data: events } = await supabase
    .from('events')
    .select('id, name')
    .order('start_date', { ascending: false });
  const current = events?.find((e) => e.id === eventId) ?? events?.[0] ?? null;
  const eventOpts: Opt[] = (events ?? []).map((e) => ({ id: e.id, label: e.name }));

  let compEvents: { id: string; label: string }[] = [];
  let heats: { id: string; heat_number: number }[] = [];
  let rows: {
    lane: number;
    swimmer: string;
    school: string | null;
    seed: number | null;
    status: string;
  }[] = [];

  if (current) {
    const { data: ce } = await supabase
      .from('competition_events')
      .select('id, name, stroke, distance_meters, gender')
      .eq('event_id', current.id)
      .order('distance_meters', { ascending: true });
    compEvents = (ce ?? []).map((c) => ({
      id: c.id,
      label: `${c.distance_meters}m ${c.stroke} ${c.gender === 'male' ? 'Putra' : 'Putri'}`,
    }));
    const ceCur = ce?.find((c) => c.id === ceId) ?? ce?.[0];
    if (ceCur) {
      const { data: hs } = await supabase
        .from('heats')
        .select('id, heat_number')
        .eq('competition_event_id', ceCur.id)
        .order('heat_number', { ascending: true });
      heats = (hs ?? []) as typeof heats;
      const heatCur = hs?.find((h) => h.id === heatId) ?? hs?.[0];
      if (heatCur) {
        const { data: assigns } = await supabase
          .from('heat_assignments')
          .select(
            'lane_number, registrations(seed_time_ms, athletes(full_name, schools(name))), results(status)',
          )
          .eq('heat_id', heatCur.id)
          .order('lane_number', { ascending: true });
        rows = (assigns ?? []).map((a: any) => ({
          lane: a.lane_number,
          swimmer: a.registrations?.athletes?.full_name ?? '—',
          school: a.registrations?.athletes?.schools?.name ?? null,
          seed: a.registrations?.seed_time_ms ?? null,
          status: a.results?.[0]?.status ?? 'assigned',
        }));
      }
    }
  }

  const fmt = (ms: number | null) =>
    !ms || ms <= 0 ? '—' : (ms / 1000).toFixed(2);
  const initials = (n: string) =>
    n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  return (
    <>
      <PageHeader
        title="Heat & Lane Management"
        description="Pantau pembagian lintasan per heat. Data diambil langsung dari hasil seeding & penugasan lintasan."
      />
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        {/* Selectors */}
        <HeatLaneSelectors
          eventOpts={eventOpts}
          compOpts={compEvents}
          heatOpts={heats.map((h) => ({ id: h.id, label: `Heat ${h.heat_number}` }))}
          currentEvent={current?.id ?? ''}
          currentCe={compEvents[0]?.id ?? ''}
          currentHeat={heats[0]?.id ?? ''}
        />

        {rows.length === 0 ? (
          <div className="pub-card p-12 text-center">
            <Layers className="mx-auto h-10 w-10 text-[var(--m-aqua)]" />
            <h3 className="mt-3 font-semibold text-[var(--m-ink)]">Belum ada lintasan</h3>
            <p className="mt-1 text-sm text-[var(--m-muted)]">
              Heat ini belum memiliki penugasan lintasan.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--m-soft)] text-xs uppercase text-[var(--m-muted)]">
                <tr>
                  <th className="w-16 px-4 py-3 text-center">Lane</th>
                  <th className="px-4 py-3">Swimmer</th>
                  <th className="px-4 py-3">School / Club</th>
                  <th className="w-32 px-4 py-3 text-right">Seed</th>
                  <th className="w-40 px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r) => {
                  const scratched = r.status === 'scratched' || r.status === 'dns';
                  return (
                    <tr key={r.lane} className={scratched ? 'bg-red-50/50' : 'hover:bg-[var(--m-soft)]'}>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[var(--m-aqua)] text-sm font-bold text-white">
                          {r.lane}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--m-soft)] text-xs font-semibold text-[var(--m-aqua-ink)]">
                            {initials(r.swimmer)}
                          </span>
                          <span className={scratched ? 'font-medium text-[var(--m-muted)] line-through' : 'font-medium text-[var(--m-ink)]'}>
                            {r.swimmer}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[var(--m-muted)]">{r.school ?? '—'}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs text-[var(--m-muted)]">
                        {fmt(r.seed)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {scratched ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-1 text-xs font-semibold text-red-700">
                            <UserX className="h-3.5 w-3.5" /> Scratch
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--m-aqua-soft)] px-2 py-1 text-xs font-semibold text-[var(--m-aqua-ink)]">
                            Assigned
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
