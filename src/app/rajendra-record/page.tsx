import { createClient } from '@/lib/supabase/server';
import { PublicShell } from '@/components/layout/public-shell';
import { RecordsManager, type RecordItemView } from '@/components/modules/records-manager';
import { formatMsToTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function PublicRajendraRecordPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const activeEventId = params?.eventId || 'all';

  // 1. Ambil daftar event untuk filter switcher
  const { data: eventsData } = await supabase
    .from('events')
    .select('id, name')
    .order('start_date', { ascending: false });

  const events = (eventsData || []).map((e) => ({ id: e.id, name: e.name }));

  // 2. Ambil data nomor lomba
  let compQuery = supabase
    .from('competition_events')
    .select('id, name, distance_meters, stroke, gender, grade_level, event_id, events(id, name)')
    .order('order_no', { ascending: true });

  if (activeEventId && activeEventId !== 'all') {
    compQuery = compQuery.eq('event_id', activeEventId);
  }

  const { data: compEventsData } = await compQuery;
  const compEvents = compEventsData || [];

  const compMap = new Map<string, any>();
  compEvents.forEach((c) => {
    compMap.set(c.id, c);
  });
  const targetCompIds = compEvents.map((c) => c.id);

  // 3. Ambil data rekor resmi di database (rajendra_records)
  let existingQuery = supabase
    .from('rajendra_records')
    .select(`
      competition_event_id,
      time_ms,
      event_year,
      athlete_id,
      athletes ( id, full_name, schools ( name ) ),
      competition_events ( id, name, event_id, events ( id, name ) )
    `)
    .eq('is_active', true);

  if (activeEventId && activeEventId !== 'all' && targetCompIds.length > 0) {
    existingQuery = existingQuery.in('competition_event_id', targetCompIds);
  }

  const { data: existingRecordsData } = await existingQuery;

  const existingMap = new Map<string, any>();
  (existingRecordsData || []).forEach((r: any) => {
    if (r.competition_event_id) {
      existingMap.set(r.competition_event_id, r);
    }
  });

  // 4. Ambil catatan waktu hasil lomba riil (results)
  // Query terstruktur 2 tahap untuk menjamin data hasil terekstrak tanpa kegagalan nested join
  const candidateResultsByComp = new Map<string, Array<{
    athlete_id: string;
    athlete_name: string;
    school_name: string;
    time_ms: number;
    event_id?: string;
    event_name?: string;
  }>>();

  if (targetCompIds.length > 0) {
    const { data: heats } = await supabase
      .from('heats')
      .select('id, competition_event_id')
      .in('competition_event_id', targetCompIds);

    const heatIds = (heats || []).map((h) => h.id);
    const ceOfHeat: Record<string, string> = {};
    (heats || []).forEach((h) => {
      ceOfHeat[h.id] = h.competition_event_id;
    });

    if (heatIds.length > 0) {
      const { data: assigns } = await supabase
        .from('heat_assignments')
        .select(`
          id,
          heat_id,
          registration_id,
          registrations (
            id,
            athlete_id,
            athletes (
              id,
              full_name,
              schools ( name )
            )
          )
        `)
        .in('heat_id', heatIds);

      const assignIds = (assigns || []).map((a) => a.id);
      const assignMap = new Map<string, any>();
      (assigns || []).forEach((a) => {
        assignMap.set(a.id, a);
      });

      if (assignIds.length > 0) {
        const { data: results } = await supabase
          .from('results')
          .select('id, time_ms, status, heat_assignment_id')
          .in('heat_assignment_id', assignIds)
          .eq('status', 'finished')
          .not('time_ms', 'is', null)
          .gt('time_ms', 0)
          .order('time_ms', { ascending: true });

        (results || []).forEach((r) => {
          const assign = assignMap.get(r.heat_assignment_id);
          const heatId = assign?.heat_id;
          const compId = heatId ? ceOfHeat[heatId] : null;
          const reg = assign?.registrations;
          const ath = reg?.athletes;
          if (compId && ath && r.time_ms && r.time_ms > 0) {
            const comp = compMap.get(compId);
            const list = candidateResultsByComp.get(compId) || [];
            list.push({
              athlete_id: ath.id || '',
              athlete_name: ath.full_name || 'Atlet',
              school_name: ath.schools?.name || 'Umum / Perorangan',
              time_ms: r.time_ms,
              event_id: comp?.event_id,
              event_name: comp?.events?.name || 'Kejuaraan Renang',
            });
            candidateResultsByComp.set(compId, list);
          }
        });
      }
    }
  }

  // 5. Gabungkan dan bentuk daftar rekor resmi per nomor lomba
  const formattedRecords: RecordItemView[] = [];

  compEvents.forEach((comp) => {
    const compId = comp.id;
    const existingRec = existingMap.get(compId);
    const resultsList = (candidateResultsByComp.get(compId) || []).sort(
      (a, b) => a.time_ms - b.time_ms
    );
    const bestResult = resultsList[0];

    const strokeName = comp.stroke || 'Gaya Bebas';
    const dist = comp.distance_meters || 50;
    const gender = comp.gender === 'female' ? 'female' : 'male';
    const grade = comp.grade_level || 'Umum';
    const compRawEvents = (comp as any).events;
    const eventName =
      (Array.isArray(compRawEvents) ? compRawEvents[0]?.name : compRawEvents?.name) ||
      'Kejuaraan Renang';
    const displayName =
      comp.name || `${dist}m ${strokeName} ${grade} (${gender === 'female' ? 'Putri' : 'Putra'})`;

    // Skenario A: Hasil lomba baru memecahkan rekor yang ada di rajendra_records
    if (bestResult && existingRec && bestResult.time_ms < existingRec.time_ms) {
      const prevAthlete = existingRec.athletes?.full_name || 'Pemegang Rekor Sebelumnya';
      const prevSchool = existingRec.athletes?.schools?.name || null;
      const recEvents = (existingRec.competition_events as any)?.events;
      const prevEvent =
        (Array.isArray(recEvents) ? recEvents[0]?.name : recEvents?.name) || null;
      const prevTime = existingRec.time_ms;
      const diffMs = prevTime - bestResult.time_ms;

      formattedRecords.push({
        competition_event_id: compId,
        event_id: comp.event_id,
        event_name: bestResult.event_name || eventName,
        athlete_id: bestResult.athlete_id,
        athlete_name: bestResult.athlete_name,
        school_name: bestResult.school_name,
        time_ms: bestResult.time_ms,
        previous_time_ms: prevTime,
        previous_athlete_name: prevAthlete,
        previous_school_name: prevSchool,
        previous_event_name: prevEvent,
        improvement_ms: diffMs,
        notes: `${bestResult.athlete_name} mendapatkan rekor ${formatMsToTime(bestResult.time_ms)} mengalahkan ${prevAthlete} yang sebelumnya mencetak ${formatMsToTime(prevTime)}${prevEvent ? ` di ${prevEvent}` : ''}`,
        comp_name: displayName,
        stroke: strokeName,
        distance_meters: dist,
        gender,
        grade_level: grade,
      });
    }
    // Skenario B: Rekor di rajendra_records tetap bertahan (tidak ada yang mengalahkan)
    else if (existingRec) {
      const ath = existingRec.athletes;
      const diffMs =
        bestResult && bestResult.time_ms > existingRec.time_ms
          ? bestResult.time_ms - existingRec.time_ms
          : null;

      const recEvents = (existingRec.competition_events as any)?.events;
      const recEventName =
        (Array.isArray(recEvents) ? recEvents[0]?.name : recEvents?.name) || eventName;

      formattedRecords.push({
        competition_event_id: compId,
        event_id: existingRec.competition_events?.event_id || comp.event_id,
        event_name: recEventName,
        athlete_id: existingRec.athlete_id || ath?.id || '',
        athlete_name: ath?.full_name || 'Atlet',
        school_name: ath?.schools?.name || 'Umum / Perorangan',
        time_ms: existingRec.time_ms,
        previous_time_ms: null,
        previous_athlete_name: null,
        previous_school_name: null,
        previous_event_name: null,
        improvement_ms: diffMs,
        notes: `Rekor resmi kejuaraan yang masih bertahan dengan catatan waktu ${formatMsToTime(existingRec.time_ms)}`,
        comp_name: displayName,
        stroke: strokeName,
        distance_meters: dist,
        gender,
        grade_level: grade,
      });
    }
    // Skenario C: Belum ada di rajendra_records, tetapi ada hasil waktu resmi di results
    else if (bestResult) {
      const secondPlace = resultsList.length > 1 ? resultsList[1] : null;
      const diffMs = secondPlace ? secondPlace.time_ms - bestResult.time_ms : null;

      let notes = `${bestResult.athlete_name} mencetak rekor kejuaraan dengan catatan waktu ${formatMsToTime(bestResult.time_ms)}`;
      if (secondPlace && secondPlace.athlete_name !== bestResult.athlete_name) {
        notes = `${bestResult.athlete_name} mendapatkan rekor ${formatMsToTime(bestResult.time_ms)} mengalahkan ${secondPlace.athlete_name} yang mencetak ${formatMsToTime(secondPlace.time_ms)}`;
      }

      formattedRecords.push({
        competition_event_id: compId,
        event_id: comp.event_id,
        event_name: bestResult.event_name || eventName,
        athlete_id: bestResult.athlete_id,
        athlete_name: bestResult.athlete_name,
        school_name: bestResult.school_name,
        time_ms: bestResult.time_ms,
        previous_time_ms: secondPlace ? secondPlace.time_ms : null,
        previous_athlete_name: secondPlace ? secondPlace.athlete_name : null,
        previous_school_name: secondPlace ? secondPlace.school_name : null,
        previous_event_name: secondPlace ? secondPlace.event_name : null,
        improvement_ms: diffMs,
        notes,
        comp_name: displayName,
        stroke: strokeName,
        distance_meters: dist,
        gender,
        grade_level: grade,
      });
    }
  });

  return (
    <PublicShell
      title="Rajendra Record"
      subtitle="Daftar rekor resmi kejuaraan renang Rajendra Swim System. Memuat nama atlet, klub/sekolah, waktu rekor, dan kejuaraan tempat rekor diraih."
      breadcrumbItems={[
        { label: 'Beranda', href: '/' },
        { label: 'Rajendra Record' },
      ]}
    >
      <div className="pub-container pb-16">
        <RecordsManager
          events={events}
          activeEventId={activeEventId}
          records={formattedRecords}
        />
      </div>
    </PublicShell>
  );
}
