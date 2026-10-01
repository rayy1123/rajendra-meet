import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth';
import { CallRoomManager, type CallRoomHeatData } from '@/components/modules/call-room-manager';
import { Megaphone, Users } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { readCallRoomStore } from '@/lib/data/call-room-server';

export const dynamic = 'force-dynamic';

export default async function CallRoomPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string; compEventId?: string }>;
}) {
  const { user } = await requireRole([
    'super_admin',
    'event_admin',
    'operator',
    'admin',
    'admin_kejuaraan',
    'admin_technical',
    'admin-technical',
  ]);

  const supabase = await createClient();
  const params = await searchParams;

  // 1. Ambil daftar event aktif
  const { data: eventsData } = await supabase
    .from('events')
    .select('id, name, start_date, end_date')
    .order('start_date', { ascending: false });

  const events = (eventsData || []).map((e) => ({ id: e.id, name: e.name }));
  const activeEventId = params.eventId || events[0]?.id || '';

  // 2. Ambil daftar nomor lomba untuk event aktif
  let compEvents: Array<{
    id: string;
    name: string;
    grade_level?: string | null;
    gender?: string | null;
    order_no?: number;
  }> = [];

  if (activeEventId) {
    const { data: ceData } = await supabase
      .from('competition_events')
      .select('id, name, stroke, distance_meters, gender, grade_level, order_no')
      .eq('event_id', activeEventId)
      .order('order_no', { ascending: true });

    compEvents = (ceData || []).map((c) => ({
      id: c.id,
      name: c.name,
      grade_level: c.grade_level,
      gender: c.gender,
      order_no: c.order_no,
    }));
  }

  const activeCompEventId = params.compEventId || compEvents[0]?.id || '';
  const currentCompEvent = compEvents.find((c) => c.id === activeCompEventId);

  // 3. Ambil data Heat & Assignment untuk nomor lomba aktif
  let heatsList: CallRoomHeatData[] = [];

  if (activeCompEventId) {
    const { data: rawHeats } = await supabase
      .from('heats')
      .select(`
        id,
        heat_number,
        competition_event_id,
        heat_assignments (
          id,
          lane_number,
          registrations (
            id,
            seed_time_ms,
            athletes (
              id,
              full_name,
              athlete_number,
              schools (name)
            )
          ),
          results (
            id,
            time_ms,
            status
          )
        )
      `)
      .eq('competition_event_id', activeCompEventId)
      .order('heat_number', { ascending: true });

    heatsList = (rawHeats || []).map((h: any) => {
      const assignments = (h.heat_assignments || []).map((ha: any) => {
        const reg = Array.isArray(ha.registrations) ? ha.registrations[0] : ha.registrations;
        const ath = Array.isArray(reg?.athletes) ? reg?.athletes[0] : reg?.athletes;
        const school = Array.isArray(ath?.schools) ? ath?.schools[0] : ath?.schools;
        const res = Array.isArray(ha.results) ? ha.results[0] : ha.results;

        return {
          assignment_id: ha.id,
          lane_number: ha.lane_number,
          heat_id: h.id,
          heat_number: h.heat_number,
          competition_event_id: activeCompEventId,
          competition_event_name: currentCompEvent?.name || 'Nomor Lomba',
          event_id: activeEventId,
          athlete_id: ath?.id,
          athlete_name: ath?.full_name || 'Atlet',
          athlete_number: ath?.athlete_number,
          school_name: school?.name || 'Klub Independen',
          seed_time_ms: reg?.seed_time_ms,
          result_status: res?.status,
        };
      });

      return {
        id: h.id,
        heat_number: h.heat_number,
        competition_event_id: h.competition_event_id,
        assignments,
      };
    });
  }

  // 4. Ambil local checkins store
  const store = readCallRoomStore();
  const operatorName = (user.user_metadata?.full_name as string) || 'Call Room Marshall';

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6 print:p-0 print:m-0">
      <Breadcrumb
        items={[
          { label: 'Dasbor', href: '/dashboard' },
          { label: 'Call Room (Meja Panggil)' },
        ]}
        className="mb-2 print:hidden"
      />

      <div className="print:hidden">
        <PageHeader
          title="Call Room & Meja Panggil Atlet"
          description="Portal operasional petugas Call Room (Marshall): check-in kehadiran fisik perenang, validasi nomor dada, antrean heat menuju kolam, dan pencatatan atlet scratch / mundur."
          icon={<Megaphone className="h-6 w-6 text-blue-600" />}
        />
      </div>

      <CallRoomManager
        events={events}
        compEvents={compEvents}
        activeEventId={activeEventId}
        activeCompEventId={activeCompEventId}
        heats={heatsList}
        initialCheckins={store.checkins}
        operatorName={operatorName}
      />
    </div>
  );
}
