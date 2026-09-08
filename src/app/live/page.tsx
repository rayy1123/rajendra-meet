import { createClient } from '@/lib/supabase/server';
import { PublicShell } from '@/components/layout/public-shell';
import { LiveBoard, type LiveRow, type LiveOption } from '@/components/modules/live-board';
import { Waves, Info } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

interface ResultRow {
  time_ms: number | null;
  status: string | null;
  is_new_record: boolean;
  heat_assignments: {
    lane_number: number;
    registrations: {
      athletes: { full_name: string; schools: { name: string | null } | null } | null;
    } | null;
  } | null;
}

export default async function LivePage({
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

  const eventOpts: LiveOption[] = (events ?? []).map((e) => ({ id: e.id, label: e.name }));

  let compOpts: LiveOption[] = [];
  let heatOpts: LiveOption[] = [];
  let rows: LiveRow[] = [];
  let eventName = '';
  let compEventName = '';
  let heatLabel = '';
  let selectedEventName = '';

  if (current) {
    selectedEventName = current.name;
    const { data: ce } = await supabase
      .from('competition_events')
      .select('id, name, stroke, distance_meters, gender')
      .eq('event_id', current.id)
      .order('distance_meters', { ascending: true });
    compOpts = (ce ?? []).map((c) => ({
      id: c.id,
      label: `${c.distance_meters}m ${c.stroke} ${c.gender === 'male' ? 'Putra' : 'Putri'}`,
    }));
    const ceCur = ce?.find((c) => c.id === ceId) ?? ce?.[0];
    if (ceCur) {
      compEventName = `${ceCur.distance_meters}m ${ceCur.stroke} ${ceCur.gender === 'male' ? 'Putra' : 'Putri'}`;
      eventName = ceCur.name;
      const { data: hs } = await supabase
        .from('heats')
        .select('id, heat_number')
        .eq('competition_event_id', ceCur.id)
        .order('heat_number', { ascending: true });
      heatOpts = (hs ?? []).map((h) => ({ id: h.id, label: `Heat ${h.heat_number}` }));
      const heatCur = hs?.find((h) => h.id === heatId) ?? hs?.[0];
      if (heatCur) {
        heatLabel = `${heatCur.heat_number} / ${hs?.length || heatCur.heat_number}`;
        const { data: assigns } = await supabase
          .from('heat_assignments')
          .select('id')
          .eq('heat_id', heatCur.id);
        const ids = (assigns ?? []).map((a: any) => a.id);
        if (ids.length > 0) {
          const { data: res } = await supabase
            .from('results')
            .select(
              `time_ms, status, is_new_record,
               heat_assignments(lane_number, registrations(athletes(full_name, schools(name))))`,
            )
            .in('heat_assignment_id', ids)
            .order('time_ms', { ascending: true });
          const raw = (res ?? []) as unknown as ResultRow[];
          rows = raw
            .map((r, i) => ({
              rank: r.time_ms && r.time_ms > 0 ? i + 1 : null,
              lane: r.heat_assignments?.lane_number ?? 0,
              swimmer: r.heat_assignments?.registrations?.athletes?.full_name ?? '—',
              school: r.heat_assignments?.registrations?.athletes?.schools?.name ?? null,
              finish: r.time_ms,
              isRecord: r.is_new_record,
              status: r.status,
            }))
            .sort((a, b) => (a.finish ?? 1e9) - (b.finish ?? 1e9));
        }
      }
    }
  }

  return (
    <PublicShell
      title="Live Board"
      subtitle="Papan hasil langsung. Pilih event, nomor lomba, dan heat untuk melihat perkembangan waktu per lintasan."
    >
      {!current ? (
        <div className="pub-card p-12 text-center">
          <Waves className="mx-auto h-10 w-10 text-[var(--m-aqua)]" />
          <h3 className="mt-3 font-semibold text-[var(--m-ink)]">Belum ada kejuaraan</h3>
          <p className="mt-1 text-sm text-[var(--m-muted)]">Panitia belum mempublikasikan kejuaraan apa pun.</p>
        </div>
      ) : (
        <div className="space-y-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--m-muted)]">
                Event Terpilih
              </p>
              <p className="text-sm font-bold text-[var(--m-ink)]">{selectedEventName}</p>
              <p className="text-xs text-[var(--m-muted)]">
                Gunakan kontrol di bawah untuk mengganti nomor lomba atau heat.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/scoreboard"
                className="inline-flex items-center gap-1 rounded-xl border border-[var(--m-border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--m-ink)] shadow-sm transition-colors hover:border-[var(--m-aqua)]"
              >
                Buka Scoreboard
              </Link>
            </div>
          </div>

          <LiveBoard
            eventName={eventName}
            compEventName={compEventName}
            heatLabel={heatLabel}
            rows={rows}
            eventOpts={eventOpts}
            compOpts={compOpts}
            heatOpts={heatOpts}
            currentEvent={current?.id ?? ''}
            currentCe={compOpts[0]?.id ?? ''}
            currentHeat={heatOpts[0]?.id ?? ''}
          />
        </div>
      )}
    </PublicShell>
  );
}
