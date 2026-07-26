import { createClient } from '@/lib/supabase/server';
import { ResultInputOperator } from '@/components/modules/result-input-operator';
import { Trophy, Waves } from 'lucide-react';
import { Card } from '@/components/ui/card';

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

  // 2. Ambil daftar nomor lomba (competition_events) berdasarkan event yang dipilih
  const { data: compEvents } = await supabase
    .from('competition_events')
    .select('id, name, stroke, distance_meters, gender, grade_level, class_name')
    .eq('event_id', activeEventId);

  const activeCompEventId = params.compEventId || compEvents?.[0]?.id || '';

  // 3. Ambil data Heat & Assignment untuk nomor lomba yang dipilih
  let heatAssignments: any[] = [];
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

    heatAssignments = heats || [];
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b pb-5 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Trophy className="w-8 h-8 text-amber-500" /> Input Hasil Lomba
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Input waktu tempuh per lintasan (lane). Hasil otomatis tersimpan dan terupdate secara realtime.
          </p>
        </div>
      </div>

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