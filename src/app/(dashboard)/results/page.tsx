import { createClient } from '@/lib/supabase/server';
import { ResultInputOperator } from '@/components/modules/result-input-operator';
import { Trophy, Waves } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';

// Types untuk menyempurnakan Type Safety
export interface HeatAssignmentWithResult {
  id: string;
  lane_number: number;
  registrations: {
    id: string;
    seed_time_ms: number | null;
    athletes: {
      full_name: string;
      athlete_number: string;
      schools: { name: string } | null;
    } | null;
  } | null;
  results: {
    id: string;
    time_ms: number | null;
    status: string;
  }[] | null;
}

export interface HeatWithAssignments {
  id: string;
  heat_number: number;
  heat_assignments: HeatAssignmentWithResult[];
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string; compEventId?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  // 1. Ambil daftar event aktif
  const { data: events } = await supabase
    .from('events')
    .select('id, name')
    .order('created_at', { ascending: false });

  const activeEventId = params.eventId || events?.[0]?.id || '';

  // 2. Ambil daftar nomor lomba berdasarkan event yang dipilih
  const { data: compEvents } = await supabase
    .from('competition_events')
    .select('id, name, stroke, distance_meters, gender, grade_level, class_name')
    .eq('event_id', activeEventId);

  // Validasi agar compEventId benar-benar milik event yang aktif
  const isValidCompEvent = compEvents?.some((ce) => ce.id === params.compEventId);
  const activeCompEventId = isValidCompEvent ? params.compEventId! : compEvents?.[0]?.id || '';

  // 3. Ambil data Heat & Assignment beserta Hasil Lomba
  let heatAssignments: HeatWithAssignments[] = [];

  if (activeCompEventId) {
    const { data: heats } = await supabase
      .from('heats')
      .select(`
        id,
        heat_number,
        heat_assignments (
          id,
          lane_number,
          registrations (
            id,
            seed_time_ms,
            athletes (
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

    // Pastikan lane_number di setiap heat terurut rapi (Lane 1..8)
    if (heats) {
      heatAssignments = heats.map((h) => ({
        ...h,
        heat_assignments: (h.heat_assignments || []).sort(
          (a, b) => a.lane_number - b.lane_number
        ),
      })) as unknown as HeatWithAssignments[];
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Input Hasil Lomba"
        description="Input waktu tempuh per lintasan (lane). Hasil otomatis tersimpan dan terupdate secara realtime."
        icon={<Trophy className="h-6 w-6" />}
      />
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Input Hasil' }]} className="mb-1" />

      {!events || events.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Waves className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-semibold text-lg">Belum Ada Event</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Silakan buat event terlebih dahulu di menu Events atau impor Buku Acara Excel.
          </p>
        </Card>
      ) : (
        <ResultInputOperator
          events={events}
          compEvents={compEvents || []}
          initialEventId={activeEventId}
          initialCompEventId={activeCompEventId}
          heatsData={heatAssignments}
        />
      )}
    </div>
  );
}