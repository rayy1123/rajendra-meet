import { createClient } from '@/lib/supabase/server';
import { PublicShell } from '@/components/layout/public-shell';
import { FileText, Waves } from 'lucide-react';
import Link from 'next/link';
import { PrintButton } from '@/components/modules/print-button';

export const dynamic = 'force-dynamic';

interface HeatRow {
  lane_number: number;
  registrations: {
    seed_time_ms: number | null;
    athletes: { full_name: string } | null;
  } | null;
}
interface Heat {
  heat_number: number;
  heat_assignments: HeatRow[] | null;
}
interface CompEvent {
  id: string;
  name: string;
  stroke: string;
  distance_meters: number;
  gender: string;
  age_group: string;
  session_no: number;
  order_no: number;
  heats: Heat[] | null;
}

function fmtSeed(ms: number | null): string {
  if (!ms || ms <= 0) return '-';
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60);
  const s = (totalSec % 60).toFixed(2).padStart(5, '0');
  return m > 0 ? `${m}:${s}` : s;
}

export default async function ProgramPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event: eventId } = await searchParams;
  const supabase = await createClient();

  const { data: events } = await supabase
    .from('events')
    .select('id, name, location, start_date, end_date, lane_count')
    .order('start_date', { ascending: false });

  const current =
    events?.find((e) => e.id === eventId) ?? events?.[0] ?? null;

  let compEvents: CompEvent[] = [];
  let bySession: Record<number, CompEvent[]> = {};
  if (current) {
    const { data } = await supabase
      .from('competition_events')
      .select(
        `id, name, stroke, distance_meters, gender, age_group, session_no, order_no,
         heats(heat_number, heat_assignments(lane_number, registrations(seed_time_ms, athletes(full_name))))`,
      )
      .eq('event_id', current.id)
      .order('session_no', { ascending: true })
      .order('order_no', { ascending: true });
    compEvents = (data ?? []) as unknown as CompEvent[];
    bySession = compEvents.reduce<Record<number, CompEvent[]>>((acc, ce) => {
      const k = ce.session_no || 1;
      (acc[k] ||= []).push(ce);
      return acc;
    }, {});
  }

  return (
    <PublicShell
      title="Buku Acara Kejuaraan"
      subtitle="Susunan nomor lomba, sesi, dan pembagian heat per lintasan. Siap cetak untuk keperluan teknis pertandingan."
    >
      <div className="pub-container pb-16">
        {/* Event switcher */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {events?.map((e) => (
            <Link
              key={e.id}
              href={`/program?event=${e.id}`}
              className={
                e.id === current?.id
                  ? 'rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground shadow-sm'
                  : 'rounded-full border border-border px-4 py-1.5 text-sm text-[var(--m-muted)] hover:border-primary hover:text-primary'
              }
            >
              {e.name}
            </Link>
          ))}
          <PrintButton />
        </div>

        {!current ? (
          <div className="pub-card p-12 text-center">
            <Waves className="mx-auto h-10 w-10 text-[var(--m-aqua)]" />
            <h3 className="mt-3 font-semibold text-[var(--m-ink)]">
              Belum ada kejuaraan
            </h3>
          </div>
        ) : (
          <article className="rounded-2xl border border-border bg-card shadow-sm">
            {/* Program header */}
            <header className="flex flex-col gap-3 border-b-2 border-primary bg-[var(--m-navy)] p-6 text-white sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  BUKU ACARA (EVENT PROGRAM)
                </h1>
                <p className="mt-1 text-sm text-white/70">{current.name}</p>
                {current.location && (
                  <p className="mt-1 text-xs text-white/50">
                    {current.location} · {current.start_date} s/d {current.end_date}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 text-primary-foreground">
                <FileText className="h-5 w-5" />
                <span className="text-sm font-semibold">Rajendra Meet</span>
              </div>
            </header>

            <div className="space-y-10 p-6">
              {Object.keys(bySession)
                .map(Number)
                .sort((a, b) => a - b)
                .map((sessionNo) => (
                  <section key={sessionNo} className="print-break-inside-avoid">
                    <div className="mb-4 bg-primary/10 px-4 py-2 text-sm font-semibold uppercase tracking-wider text-primary">
                      Sesi {sessionNo}
                    </div>
                    <div className="space-y-8">
                      {bySession[sessionNo].map((ce) => (
                        <div
                          key={ce.id}
                          className="print-break-inside-avoid border-l-2 border-primary/30 pl-4"
                        >
                          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
                            <h3 className="font-semibold text-[var(--m-ink)]">
                              {ce.name}
                            </h3>
                            <span className="font-mono text-xs text-[var(--m-muted)]">
                              {ce.gender}
                              {ce.age_group ? ` · ${ce.age_group}` : ''}
                            </span>
                          </div>

                          {!ce.heats || ce.heats.length === 0 ? (
                            <p className="text-sm italic text-[var(--m-muted)]">
                              Belum ada heat (pembagian lintasan menyusul).
                            </p>
                          ) : (
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                              {[...ce.heats]
                                .sort((a, b) => a.heat_number - b.heat_number)
                                .map((heat) => {
                                  const rows = (heat.heat_assignments ?? [])
                                    .slice()
                                    .sort((a, b) => a.lane_number - b.lane_number);
                                  const fastest = rows.reduce<number | null>(
                                    (best, r) => {
                                      const t = r.registrations?.seed_time_ms ?? null;
                                      if (t && t > 0 && (best === null || t < best))
                                        return t;
                                      return best;
                                    },
                                    null,
                                  );
                                  return (
                                    <div
                                      key={heat.heat_number}
                                      className="overflow-hidden rounded-lg border border-border"
                                    >
                                      <div className="flex items-center justify-between bg-[var(--m-aqua-soft)] px-3 py-1.5 text-xs font-bold uppercase text-primary">
                                        <span>Heat {heat.heat_number}</span>
                                        <span className="font-normal text-[var(--m-muted)]">
                                          {rows.length} lintasan
                                        </span>
                                      </div>
                                      <table className="w-full text-left text-sm">
                                        <thead className="bg-[var(--m-soft)] text-[11px] uppercase text-[var(--m-muted)]">
                                          <tr>
                                            <th className="px-2 py-1 text-center">Ln</th>
                                            <th className="px-2 py-1">Nama</th>
                                            <th className="px-2 py-1 text-right">Seed</th>
                                          </tr>
                                        </thead>
                                        <tbody className="divide-y divide-border">
                                          {rows.map((r) => {
                                            const name =
                                              r.registrations?.athletes?.full_name ??
                                              '—';
                                            const seed =
                                              r.registrations?.seed_time_ms ?? null;
                                            const isTop =
                                              seed !== null &&
                                              seed > 0 &&
                                              seed === fastest;
                                            return (
                                              <tr
                                                key={r.lane_number}
                                                className={
                                                  isTop
                                                    ? 'bg-orange-50'
                                                    : 'hover:bg-[var(--m-soft)]'
                                                }
                                              >
                                                <td className="px-2 py-1 text-center">
                                                  <span
                                                    className={
                                                      isTop
                                                        ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--m-orange)] text-[11px] font-bold text-white'
                                                        : 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-[var(--m-soft)] text-[11px] text-[var(--m-muted)]'
                                                    }
                                                  >
                                                    {r.lane_number}
                                                  </span>
                                                </td>
                                                <td
                                                  className={
                                                    'px-2 py-1 ' +
                                                    (isTop ? 'font-bold text-[var(--m-ink)]' : 'text-[var(--m-ink)]')
                                                  }
                                                >
                                                  {name}
                                                </td>
                                                <td className="px-2 py-1 text-right font-mono text-xs text-[var(--m-muted)]">
                                                  {fmtSeed(seed)}
                                                </td>
                                              </tr>
                                            );
                                          })}
                                        </tbody>
                                      </table>
                                    </div>
                                  );
                                })}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
            </div>

            <footer className="flex items-center justify-between border-t border-border px-6 py-3 text-xs text-[var(--m-muted)]">
              <span>Powered by Rajendra Meet SCMS</span>
              <span className="font-mono">Program resmi</span>
            </footer>
          </article>
        )}
      </div>
    </PublicShell>
  );
}
