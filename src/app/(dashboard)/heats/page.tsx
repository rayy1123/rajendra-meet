import { createClient } from '@/lib/supabase/server';
import { HeatGeneratorOperator } from '@/components/modules/heat-generator-operator';
import { Layers, Waves } from 'lucide-react';
import { Card } from '@/components/ui/card';

// Definisi Interface untuk Type Safety
export interface RegistrationItem {
  id: string;
  seed_time_ms: number | null;
  athletes: {
    id: string;
    full_name: string;
    athlete_number: string;
    schools: { name: string } | null;
  } | null;
}

export interface HeatItem {
  id: string;
  heat_number: number;
  heat_assignments: {
    id: string;
    lane_number: number;
    registration_id: string;
  }[];
}

export default async function HeatsPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string; compEventId?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  // 1. Ambil daftar event aktif
  const { data: events } = await supabase
    .from('events')
    .select('id, name, lane_count')
    .order('created_at', { ascending: false });

  const activeEventId = params.eventId || events?.[0]?.id || '';
  const currentEvent = events?.find((e) => e.id === activeEventId) || events?.[0];

  // 2. Ambil daftar nomor lomba untuk event aktif
  const { data: compEvents } = await supabase
    .from('competition_events')
    .select('id, name, stroke, distance_meters, gender, grade_level, class_name')
    .eq('event_id', activeEventId);

  // Validasi agar compEventId benar-benar milik event yang aktif
  const isValidCompEvent = compEvents?.some((ce) => ce.id === params.compEventId);
  const activeCompEventId = isValidCompEvent ? params.compEventId! : compEvents?.[0]?.id || '';

  // 3. Ambil pendaftaran atlet & status heat yang ada
  let registrations: RegistrationItem[] = [];
  let existingHeats: HeatItem[] = [];

  if (activeCompEventId) {
    const [{ data: regs }, { data: heats }] = await Promise.all([
      supabase
        .from('registrations')
        .select(`
          id,
          seed_time_ms,
          athletes (
            id,
            full_name,
            athlete_number,
            schools (name)
          )
        `)
        .eq('competition_event_id', activeCompEventId)
        .order('seed_time_ms', { ascending: true }),
      supabase
        .from('heats')
        .select(`
          id,
          heat_number,
          heat_assignments (
            id,
            lane_number,
            registration_id
          )
        `)
        .eq('competition_event_id', activeCompEventId)
        .order('heat_number', { ascending: true }),
    ]);

    registrations = (regs as unknown as RegistrationItem[]) || [];
    existingHeats = (heats as unknown as HeatItem[]) || [];
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="border-b pb-5 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Layers className="w-8 h-8 text-blue-600" /> Auto-Heat Generator
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Bagi peserta lomba ke dalam Heat dan Lintasan secara otomatis menggunakan algoritma Spearhead Seeding standar FINA/Aquatics.
          </p>
        </div>
      </div>

      {!events || events.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Waves className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-semibold text-lg">Belum Ada Event</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Silakan buat event atau impor Buku Acara Excel terlebih dahulu.
          </p>
        </Card>
      ) : (
        <HeatGeneratorOperator
          events={events}
          compEvents={compEvents || []}
          initialEventId={activeEventId}
          initialCompEventId={activeCompEventId}
          registrations={registrations}
          existingHeats={existingHeats}
          laneCount={currentEvent?.lane_count || 8}
        />
      )}
    </div>
  );
}