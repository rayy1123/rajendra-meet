import { createClient } from '@/lib/supabase/server';
import { PublicShell } from '@/components/layout/public-shell';
import { Waves } from 'lucide-react';
import { PublicProgramViewer, type ProgramCompEvent } from '@/components/modules/public-program-viewer';
import { EmptyState } from '@/components/ui/empty-state';

export const dynamic = 'force-dynamic';

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

  let compEvents: ProgramCompEvent[] = [];
  if (current) {
    // 1. Ambil data nomor lomba
    const { data: rawCompEvents } = await supabase
      .from('competition_events')
      .select('id, name, stroke, distance_meters, gender, age_group, session_no, order_no')
      .eq('event_id', current.id)
      .order('session_no', { ascending: true })
      .order('order_no', { ascending: true });

    if (rawCompEvents && rawCompEvents.length > 0) {
      const compIds = rawCompEvents.map((c) => c.id);

      // 2. Ambil seluruh heats & assignments untuk event ini
      const { data: rawHeats } = await supabase
        .from('heats')
        .select(`
          id,
          heat_number,
          competition_event_id,
          heat_assignments (
            id,
            lane_number,
            registration_id,
            registrations (
              id,
              athlete_id,
              seed_time_ms,
              athletes (
                id,
                athlete_number,
                full_name,
                school_id,
                schools (
                  id,
                  name
                )
              )
            ),
            results (
              id,
              time_ms,
              status
            )
          )
        `)
        .in('competition_event_id', compIds)
        .order('heat_number', { ascending: true });

      // 3. Ambil data atlet & sekolah terpusat untuk fallback jika nested join kosong
      const { data: athletesData } = await supabase
        .from('athletes')
        .select('id, athlete_number, full_name, school_id, schools(id, name)');

      const athleteMap = new Map<string, any>();
      (athletesData || []).forEach((a) => {
        athleteMap.set(a.id, a);
      });

      // 4. Ambil data registrasi terpusat untuk mapping
      const { data: allRegs } = await supabase
        .from('registrations')
        .select('id, athlete_id, seed_time_ms')
        .eq('event_id', current.id);

      const regMap = new Map<string, any>();
      (allRegs || []).forEach((r) => {
        regMap.set(r.id, r);
      });

      // Grouping Heats per competition_event_id
      const heatsByComp = new Map<string, any[]>();
      (rawHeats || []).forEach((h) => {
        if (!heatsByComp.has(h.competition_event_id)) {
          heatsByComp.set(h.competition_event_id, []);
        }

        const hydratedAssignments = (h.heat_assignments || []).map((ha: any) => {
          let rawReg = Array.isArray(ha.registrations) ? ha.registrations[0] : ha.registrations;
          if (!rawReg && ha.registration_id) {
            rawReg = regMap.get(ha.registration_id);
          }

          let rawAth = Array.isArray(rawReg?.athletes) ? rawReg?.athletes[0] : rawReg?.athletes;
          if ((!rawAth || !rawAth.full_name) && rawReg?.athlete_id) {
            rawAth = athleteMap.get(rawReg.athlete_id);
          }

          const rawSchool = Array.isArray(rawAth?.schools) ? rawAth?.schools[0] : rawAth?.schools;
          const rawResults = ha.results || null;

          return {
            lane_number: ha.lane_number,
            registrations: {
              seed_time_ms: rawReg?.seed_time_ms ?? null,
              athletes: {
                athlete_number: rawAth?.athlete_number || null,
                full_name: rawAth?.full_name || (rawAth?.id ? `Atlet #${rawAth.athlete_number || ''}` : '—'),
                schools: rawSchool?.name ? { name: rawSchool.name } : null,
              },
            },
            results: rawResults,
          };
        });

        heatsByComp.get(h.competition_event_id)?.push({
          heat_number: h.heat_number,
          heat_assignments: hydratedAssignments,
        });
      });

      compEvents = rawCompEvents.map((ce) => ({
        id: ce.id,
        name: ce.name,
        stroke: ce.stroke,
        distance_meters: ce.distance_meters,
        gender: ce.gender,
        age_group: ce.age_group,
        session_no: ce.session_no || 1,
        order_no: ce.order_no || 1,
        heats: heatsByComp.get(ce.id) || [],
      }));
    }
  }

  return (
    <PublicShell
      title="Buku Acara Kejuaraan"
      subtitle="Susunan nomor lomba, sesi, dan pembagian heat per lintasan. Dilengkapi fitur pencarian nama atlet & siap cetak resmi."
      breadcrumbItems={[
        { label: 'Beranda', href: '/' },
        { label: 'Buku Acara' },
      ]}
    >
      <div className="pub-container pb-16 print:p-0 print:m-0 print:pb-0 print:max-w-none">
        {!current ? (
          <EmptyState
            icon={<Waves className="h-6 w-6 text-primary" />}
            title="Belum ada kejuaraan"
            description="Panitia belum mempublikasikan susunan buku acara kejuaraan apa pun."
            className="no-print my-6"
          />
        ) : (
          <PublicProgramViewer
            currentEvent={current}
            events={events ?? []}
            compEvents={compEvents}
          />
        )}
      </div>
    </PublicShell>
  );
}
