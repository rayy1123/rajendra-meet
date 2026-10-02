/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server';
import { PublicShell } from '@/components/layout/public-shell';
import { RouteEventSelect } from '@/components/modules/route-event-select';
import { Medal, Lock } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { checkEventResultsVisibility } from '@/lib/data/live-scoreboard-settings';
import { MedalTallyView, type MedalRowItem } from '@/components/modules/medal-tally-view';

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
    .select('id, name, location, start_date, end_date')
    .order('start_date', { ascending: false });
  const current = events?.find((e) => e.id === eventId) ?? events?.[0] ?? null;

  // Cek otorisasi publikasi hasil / klasemen dari panitia (open / closed / auto)
  let isResultsVisible = true;
  if (current) {
    const { getEventLiveConfig } = await import('@/lib/data/live-scoreboard-server');
    const liveConfig = getEventLiveConfig(current.id);
    const visResult = checkEventResultsVisibility(current, liveConfig);
    isResultsVisible = visResult.isVisible;
  }

  const tally: Record<string, SchoolTally> = {};

  if (current && isResultsVisible) {
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

  const rows: MedalRowItem[] = Object.values(tally)
    .map((t) => ({ ...t, points: points(t.gold, t.silver, t.bronze) }))
    .sort((a, b) => b.points - a.points || b.gold - a.gold || b.total - a.total);

  const eventDateStr = current?.start_date
    ? new Date(current.start_date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : undefined;

  return (
    <PublicShell
      title="Klasemen Medali Kejuaraan"
      subtitle="Podium kehormatan dan rekapitulasi perolehan medali per kontingen, klub, dan sekolah resmi."
      breadcrumbItems={[
        { label: 'Beranda', href: '/' },
        { label: 'Klasemen Medali' },
      ]}
    >
      <div className="pub-container pb-16">
        {/* Pemilih kejuaraan */}
        <div className="mb-6 flex flex-wrap items-center gap-2 no-print">
          <div className="flex-1">
            <RouteEventSelect events={events ?? []} current={current?.id ?? ''} basePath="/medali" />
          </div>
        </div>

        {!isResultsVisible ? (
          <EmptyState
            icon={<Lock className="h-6 w-6 text-amber-600" />}
            title="Klasemen Medali Sedang Diverifikasi Panitia"
            description="Panitia pelaksana sedang memverifikasi hasil resmi kejuaraan. Klasemen medali publik akan muncul otomatis setelah proses pengesahan selesai."
            className="no-print my-6 bg-amber-50/50 border-amber-200"
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<Medal className="h-6 w-6 text-blue-600" />}
            title="Belum Ada Perolehan Medali"
            description="Nomor lomba pada kejuaraan ini belum memiliki catatan waktu selesai (finished) untuk dihitung ke klasemen medali."
            className="no-print my-6"
          />
        ) : (
          <MedalTallyView
            eventName={current?.name || 'Kejuaraan Renang'}
            eventDate={eventDateStr}
            eventLocation={current?.location || undefined}
            rows={rows}
          />
        )}
      </div>
    </PublicShell>
  );
}
