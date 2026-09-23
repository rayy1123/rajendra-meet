import { createClient } from '@/lib/supabase/server';
import { rankResults } from '@/services/ranking';
import { buildStandings, type PointRule, type ScoredEntry } from '@/services/points';
import { selectBestSwimmers, type SwimmerEntry } from '@/services/records';
import type { ResultStatus } from '@/types/database';
import { Trophy } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { AwardsManager, type EventOption } from '@/components/modules/awards-manager';

export const dynamic = 'force-dynamic';

const DEFAULT_RULES: PointRule[] = [
  { rank: 1, points: 10 },
  { rank: 2, points: 8 },
  { rank: 3, points: 6 },
  { rank: 4, points: 5 },
  { rank: 5, points: 4 },
  { rank: 6, points: 3 },
  { rank: 7, points: 2 },
  { rank: 8, points: 1 },
];

interface MappedRow {
  registration_id: string;
  competition_event_id: string;
  event_id: string;
  athlete_id: string;
  athlete_name: string;
  school_id: string | null;
  school_name: string;
  grade_level: string;
  class_name: string;
  gender: string;
  time_ms: number | null;
  status: string;
}

export default async function AwardsPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const activeEventId = params?.eventId || '';

  // 1. Ambil daftar event aktif
  const { data: eventsData } = await supabase
    .from('events')
    .select('id, name, location, start_date, end_date')
    .order('start_date', { ascending: false });

  const eventsList: EventOption[] = (eventsData || []).map((e) => ({
    id: e.id,
    name: e.name,
    location: e.location,
    startDate: e.start_date,
    endDate: e.end_date,
  }));

  const currentEvent = activeEventId
    ? eventsList.find((e) => e.id === activeEventId) || null
    : eventsList[0] || null;

  // 2. Ambil point rules (deduplikasi per rank 1..8)
  let prQuery = supabase
    .from('point_rules')
    .select('event_id, rank, points')
    .order('rank', { ascending: true });

  if (currentEvent) {
    prQuery = prQuery.eq('event_id', currentEvent.id);
  }

  const { data: pointRulesData } = await prQuery;

  const rulesMap = new Map<number, number>();
  DEFAULT_RULES.forEach((r) => rulesMap.set(r.rank, r.points));
  (pointRulesData || []).forEach((r) => {
    if (r.rank && r.points != null) {
      rulesMap.set(r.rank, r.points);
    }
  });

  const rules: PointRule[] = Array.from(rulesMap.entries())
    .map(([rank, points]) => ({ rank, points }))
    .sort((a, b) => a.rank - b.rank);

  // 3. Ambil data sekolah untuk pemetaan nama
  const { data: schoolsData } = await supabase.from('schools').select('id, name');
  const schoolNameMap: Record<string, string> = {};
  (schoolsData || []).forEach((s) => {
    schoolNameMap[s.id] = s.name;
  });

  // 4. Ambil hasil lomba (results) dengan relasi lengkap
  let resultsQuery = supabase
    .from('results')
    .select(`
      id,
      time_ms,
      status,
      heat_assignments!inner (
        id,
        heat_id,
        registration_id,
        registrations!inner (
          id,
          competition_event_id,
          event_id,
          athletes!inner (
            id,
            full_name,
            grade_level,
            class_name,
            gender,
            school_id,
            schools (
              id,
              name
            )
          )
        )
      )
    `);

  if (currentEvent) {
    resultsQuery = resultsQuery.eq(
      'heat_assignments.registrations.event_id',
      currentEvent.id
    );
  }

  const { data: rawResults } = await resultsQuery;

  // 5. Normalisasi data berstruktur nested ke bentuk MappedRow yang bersih
  const rows: MappedRow[] = (rawResults || [])
    .map((r: any) => {
      const assign = r.heat_assignments;
      const reg = assign?.registrations;
      const ath = reg?.athletes;
      if (!reg || !ath) return null;

      const sId = ath.school_id || ath.schools?.id || null;
      const sName = ath.schools?.name || (sId ? schoolNameMap[sId] : null) || 'Umum / Perorangan';
      if (sId && !schoolNameMap[sId]) {
        schoolNameMap[sId] = sName;
      }

      return {
        registration_id: reg.id,
        competition_event_id: reg.competition_event_id,
        event_id: reg.event_id,
        athlete_id: ath.id,
        athlete_name: ath.full_name,
        school_id: sId,
        school_name: sName,
        grade_level: ath.grade_level || '–',
        class_name: ath.class_name || '–',
        gender: ath.gender || 'male',
        time_ms: r.time_ms,
        status: r.status,
      };
    })
    .filter(Boolean) as MappedRow[];

  // 6. Hitung Ranking per Nomor Lomba (competition_event_id)
  const byComp = new Map<string, MappedRow[]>();
  rows.forEach((r) => {
    const arr = byComp.get(r.competition_event_id) || [];
    arr.push(r);
    byComp.set(r.competition_event_id, arr);
  });

  const entries: ScoredEntry[] = [];
  const swimmerEntries: SwimmerEntry[] = [];

  for (const [compId, arr] of byComp) {
    const ranked = rankResults(
      arr.map((r) => ({
        registration_id: r.registration_id,
        time_ms: r.status === 'finished' ? r.time_ms : null,
        status: (r.status === 'ok' ? 'finished' : r.status) as ResultStatus,
      }))
    );

    ranked.forEach((rk) => {
      const r = arr.find((x) => x.registration_id === rk.registration_id);
      if (!r) return;
      const rank = rk.rank ?? null;
      if (rank == null) return;

      entries.push({
        athlete_id: r.athlete_id,
        school_id: r.school_id,
        grade_level: r.grade_level,
        class_name: r.class_name,
        gender: r.gender,
        rank,
        competition_event_id: compId,
        event_id: r.event_id,
      });

      swimmerEntries.push({
        athlete_id: r.athlete_id,
        athlete_name: r.athlete_name,
        school_id: r.school_id,
        grade_level: r.grade_level,
        class_name: r.class_name,
        gender: r.gender,
        competition_event_id: compId,
        rank,
      });
    });
  }

  // 7. Kalkulasi Standings
  const overall = buildStandings(entries, rules, { groupBy: 'overall' });
  const byGrade = buildStandings(entries, rules, { groupBy: 'grade' });
  const byClass = buildStandings(entries, rules, { groupBy: 'class' });
  const bestSwimmers = selectBestSwimmers(swimmerEntries, rules);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <div className="no-print">
        <Breadcrumb
          items={[
            { label: 'Dasbor', href: '/dashboard' },
            { label: 'Penghargaan & Klasemen' },
          ]}
          className="mb-2"
        />
        <PageHeader
          title="Awards & Indikator Klasemen"
          description="Sistem indikator penilaian otomatis: Klasemen Juara Umum, Pemenang per Tingkat & Kelas, serta Gelar Best Swimmer."
          icon={<Trophy className="h-6 w-6" />}
        />
      </div>

      <AwardsManager
        event={currentEvent}
        eventsList={eventsList}
        rules={rules}
        overall={overall}
        byGrade={byGrade}
        byClass={byClass}
        bestSwimmers={bestSwimmers}
        schoolNameMap={schoolNameMap}
        totalEntriesScored={entries.length}
        totalCompEventsScored={byComp.size}
      />
    </div>
  );
}
