import { createClient } from '@/lib/supabase/server';
import { detectBrokenRecords, type RecordCandidate, type ExistingRecord } from '@/services/records';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Crown } from 'lucide-react';
import { RecordsManager, type RecordItemView } from '@/components/modules/records-manager';

export const dynamic = 'force-dynamic';

export default async function RajendraRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const activeEventId = params?.eventId || 'all';

  // 1. Ambil daftar event untuk switcher
  const { data: eventsData } = await supabase
    .from('events')
    .select('id, name')
    .order('start_date', { ascending: false });

  const events = (eventsData || []).map((e) => ({ id: e.id, name: e.name }));

  // 2. Rekor yang sudah tercatat di database
  const { data: existing } = await supabase
    .from('rajendra_records')
    .select('competition_event_id, time_ms')
    .eq('is_active', true);

  // 3. Ambil data nomor lomba untuk detail nama, gaya, jarak, dll
  const { data: compEvents } = await supabase
    .from('competition_events')
    .select('id, name, distance_meters, stroke, gender, grade_level, event_id, events(id, name)');

  const compMap = new Map<string, any>();
  (compEvents || []).forEach((c) => {
    compMap.set(c.id, c);
  });

  // 4. Kandidat: hasil finished yang valid dengan struktur relasi yang benar
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
            schools ( name )
          )
        )
      )
    `)
    .eq('status', 'finished')
    .not('time_ms', 'is', null)
    .gt('time_ms', 0);

  if (activeEventId && activeEventId !== 'all') {
    resultsQuery = resultsQuery.eq(
      'heat_assignments.registrations.event_id',
      activeEventId
    );
  }

  const { data: results } = await resultsQuery;

  // 5. Normalisasi candidates
  const candidates: RecordCandidate[] = (results || [])
    .map((r: any) => {
      const ha = r.heat_assignments;
      const reg = ha?.registrations;
      const ath = reg?.athletes;
      if (!reg || !ath || !reg.competition_event_id) return null;

      return {
        time_ms: r.time_ms ?? 0,
        status: r.status ?? 'finished',
        competition_event_id: reg.competition_event_id,
        event_id: reg.event_id,
        athlete_id: ath.id ?? '',
        athlete_name: ath.full_name ?? 'Atlet',
        school_name: ath.schools?.name ?? 'Umum / Perorangan',
      };
    })
    .filter(Boolean) as RecordCandidate[];

  const existingRecs: ExistingRecord[] = (existing || []) as unknown as ExistingRecord[];
  const broken = detectBrokenRecords(candidates, existingRecs);

  // 6. Bentuk record items view yang lengkap
  const formattedRecords: RecordItemView[] = broken.map((b) => {
    const comp = compMap.get(b.competition_event_id);
    const strokeName = comp?.stroke || 'Gaya Bebas';
    const dist = comp?.distance_meters || 50;
    const gender = comp?.gender === 'female' ? 'female' : 'male';
    const grade = comp?.grade_level || 'Umum';
    const eventName = comp?.events?.name || 'Kejuaraan Renang';

    const displayName =
      comp?.name || `${dist}m ${strokeName} ${grade} (${gender === 'female' ? 'Putri' : 'Putra'})`;

    return {
      competition_event_id: b.competition_event_id,
      event_id: comp?.event_id,
      event_name: eventName,
      athlete_id: b.athlete_id,
      athlete_name: b.athlete_name || 'Atlet',
      school_name: b.school_name || 'Umum / Perorangan',
      time_ms: b.time_ms,
      previous_time_ms: b.previous_time_ms,
      improvement_ms: b.improvement_ms,
      comp_name: displayName,
      stroke: strokeName,
      distance_meters: dist,
      gender,
      grade_level: grade,
    };
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumb items={[{ label: 'Dasbor', href: '/dashboard' }, { label: 'Rajendra Record' }]} className="mb-2" />
      <PageHeader
        title="Rajendra Record"
        description="Deteksi otomatis rekor baru per nomor lomba. Rekor memecahkan catatan tercepat sebelumnya."
        icon={<Crown className="h-6 w-6" />}
      />

      <RecordsManager
        events={events}
        activeEventId={activeEventId}
        records={formattedRecords}
      />
    </div>
  );
}
