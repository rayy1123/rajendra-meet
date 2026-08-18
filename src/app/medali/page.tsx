/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server';
import { PublicShell } from '@/components/layout/public-shell';
import { RouteEventSelect } from '@/components/modules/route-event-select';
import { Medal } from 'lucide-react';

interface SchoolTally {
  name: string;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
  points: number;
}

export const dynamic = 'force-dynamic';

// Points: gold 5, silver 3, bronze 1 (standar banyak kejuaraan renang)
function points(g: number, s: number, b: number) {
  return g * 5 + s * 3 + b * 1;
}

export default async function MedalTallyPage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string }>;
}) {
  const { event: eventId } = await searchParams;
  const supabase = await createClient();

  const { data: events } = await supabase
    .from('events')
    .select('id, name')
    .order('start_date', { ascending: false });
  const current = events?.find((e) => e.id === eventId) ?? events?.[0] ?? null;

  const tally: Record<string, SchoolTally> = {};

  if (current) {
    // 3 query total (hindari N+1 per competition_event)
    const { data: heats } = await supabase
      .from('heats')
      .select('id, competition_event_id')
      .in('competition_event_id', (await supabase.from('competition_events').select('id').eq('event_id', current.id)).data?.map((c) => c.id) ?? []);
    const heatIds = (heats ?? []).map((h) => h.id);
    const ceOfHeat: Record<string, string> = {};
    (heats ?? []).forEach((h) => (ceOfHeat[h.id] = h.competition_event_id));

    const { data: assigns } = await supabase
      .from('heat_assignments')
      .select('id, heat_id, registration_id')
      .in('heat_id', heatIds);
    const assignIds = (assigns ?? []).map((a) => a.id);
    const ceOfAssign: Record<string, string> = {};
    const regOfAssign: Record<string, string> = {};
    (assigns ?? []).forEach((a: any) => {
      ceOfAssign[a.id] = ceOfHeat[a.heat_id];
      regOfAssign[a.id] = a.registration_id;
    });

    // Map pasti via kolom langsung (hindari relasi nested yang tidak ter-infer)
    const { data: regRows } = await supabase
      .from('registrations')
      .select('id, athlete_id')
      .eq('event_id', current.id);
    const athleteOfReg: Record<string, string> = {};
    (regRows ?? []).forEach((r: any) => (athleteOfReg[r.id] = r.athlete_id));

    const { data: athRows } = await supabase
      .from('athletes')
      .select('id, school_id')
      .eq('event_id', current.id);
    const schoolOfAthlete: Record<string, string> = {};
    (athRows ?? []).forEach((a: any) => (schoolOfAthlete[a.id] = a.school_id));

    const { data: schoolRows } = await supabase.from('schools').select('id, name');
    const schoolName: Record<string, string> = {};
    (schoolRows ?? []).forEach((s: any) => (schoolName[s.id] = s.name));

    // Helper: school name dari assignment id
    const schoolOfAssign = (aid: string): string => {
      const reg = regOfAssign[aid];
      const ath = reg && athleteOfReg[reg];
      const sid = ath && schoolOfAthlete[ath];
      return (sid && schoolName[sid]) || 'Tanpa Klub';
    };

    if (assignIds.length > 0) {
      const { data: res } = await supabase
        .from('results')
        .select('time_ms, heat_assignment_id')
        .in('heat_assignment_id', assignIds)
        .eq('status', 'finished')
        .order('time_ms', { ascending: true });

      // Top-3 per competition_event
      const top3: Record<string, number> = {};
      const medals: ('gold' | 'silver' | 'bronze')[] = ['gold', 'silver', 'bronze'];
      (res ?? []).forEach((r: any) => {
        const ceId = ceOfAssign[r.heat_assignment_id];
        if (!ceId) return;
        top3[ceId] = (top3[ceId] ?? 0) + 1;
        if (top3[ceId] > 3) return; // hanya 3 terbaik per nomor
        const school = schoolOfAssign(r.heat_assignment_id);
        const m = medals[top3[ceId] - 1];
        if (!tally[school]) tally[school] = { name: school, gold: 0, silver: 0, bronze: 0, total: 0, points: 0 };
        if (m) {
          tally[school][m] += 1;
          tally[school].total += 1;
        }
      });
    }
  }

  const rows = Object.values(tally)
    .map((t) => ({ ...t, points: points(t.gold, t.silver, t.bronze) }))
    .sort((a, b) => b.points - a.points || b.gold - a.gold || b.total - a.total);

  const podium = rows.slice(0, 3);
  const podiumColors = ['bg-[#FCD34D] text-[#0b1c30]', 'bg-[#E2E8F0] text-[#0b1c30]', 'bg-[#FDBA74] text-[#0b1c30]'];
  const podiumAccent = ['gold-accent', 'silver-accent', 'bronze-accent'];

  return (
    <PublicShell
      title="Klasemen Medali"
      subtitle="Podium dan klasemen medali per sekolah / klub untuk kejuaraan terpilih."
    >
      <div className="pub-container pb-16">
        {/* Pemilih kejuaraan */}
        <div className="mb-6">
          <RouteEventSelect events={events ?? []} current={current?.id ?? ''} basePath="/medali" />
        </div>

        {rows.length === 0 ? (
          <div className="pub-card p-12 text-center">
            <Medal className="mx-auto h-10 w-10 text-[var(--m-aqua)]" />
            <h3 className="mt-3 font-semibold text-[var(--m-ink)]">Belum ada hasil</h3>
            <p className="mt-1 text-sm text-[var(--m-muted)]">
              Kejuaraan ini belum memiliki hasil finished untuk dihitung medalinya.
            </p>
          </div>
        ) : (
          <>
            {/* Podium */}
            <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
              {podium.map((p, i) => (
                <div
                  key={p.name}
                  className={`pub-card relative flex flex-col items-center border-t-4 p-5 ${podiumAccent[i]}`}
                >
                  <div className={`flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold ${podiumColors[i]}`}>
                    {i + 1}
                  </div>
                  <h3 className="mt-3 text-center font-bold text-[var(--m-ink)]">{p.name}</h3>
                  <div className="mt-3 flex items-center gap-3">
                    <span className="flex items-center gap-1 text-sm">
                      <span className="h-3 w-3 rounded-full bg-[#FCD34D]" /> {p.gold}
                    </span>
                    <span className="flex items-center gap-1 text-sm">
                      <span className="h-3 w-3 rounded-full bg-[#E2E8F0]" /> {p.silver}
                    </span>
                    <span className="flex items-center gap-1 text-sm">
                      <span className="h-3 w-3 rounded-full bg-[#FDBA74]" /> {p.bronze}
                    </span>
                  </div>
                  <p className="mt-2 text-2xl font-bold text-[var(--m-aqua-ink)]">{p.points}</p>
                  <p className="text-xs text-[var(--m-muted)]">poin</p>
                </div>
              ))}
            </section>

            {/* Tabel klasemen */}
            <div className="overflow-hidden rounded-xl border border-[var(--m-border)] bg-[var(--m-surface)] shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-[var(--m-soft)] text-xs uppercase text-[var(--m-muted)]">
                  <tr>
                    <th className="w-12 px-4 py-3 text-center">#</th>
                    <th className="px-4 py-3">Sekolah / Klub</th>
                    <th className="w-20 px-4 py-3 text-center">Emas</th>
                    <th className="w-20 px-4 py-3 text-center">Perak</th>
                    <th className="w-20 px-4 py-3 text-center">Perunggu</th>
                    <th className="w-20 px-4 py-3 text-center">Total</th>
                    <th className="w-20 px-4 py-3 text-right">Poin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--m-border)]">
                  {rows.map((r, i) => (
                    <tr key={r.name} className="hover:bg-[var(--m-soft)]">
                      <td className="px-4 py-3 text-center font-bold text-[var(--m-ink)]">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-[var(--m-ink)]">{r.name}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs">{r.gold}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs">{r.silver}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs">{r.bronze}</td>
                      <td className="px-4 py-3 text-center font-mono text-xs font-bold text-[var(--m-aqua-ink)]">{r.total}</td>
                      <td className="px-4 py-3 text-right font-mono text-xs font-bold text-[var(--m-ink)]">{r.points}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </PublicShell>
  );
}
