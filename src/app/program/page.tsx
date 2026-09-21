import { createClient } from '@/lib/supabase/server';
import { PublicShell } from '@/components/layout/public-shell';
import { Waves } from 'lucide-react';
import { PublicProgramViewer, type ProgramCompEvent } from '@/components/modules/public-program-viewer';

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
    const { data: rawCompEvents, error: compErr } = await supabase
      .from('competition_events')
      .select(
        `id, name, stroke, distance_meters, gender, age_group, session_no, order_no,
         heats(heat_number, heat_assignments(lane_number, registrations(seed_time_ms, athletes(athlete_number, full_name, schools(name))), results(id, time_ms, status)))`,
      )
      .eq('event_id', current.id)
      .order('session_no', { ascending: true })
      .order('order_no', { ascending: true });

    if (compErr || !rawCompEvents) {
      const { data: fallbackData } = await supabase
        .from('competition_events')
        .select(
          `id, name, stroke, distance_meters, gender, age_group, session_no, order_no,
           heats(heat_number, heat_assignments(lane_number, registrations(seed_time_ms, athletes(full_name)), results(id, time_ms, status)))`,
        )
        .eq('event_id', current.id)
        .order('session_no', { ascending: true })
        .order('order_no', { ascending: true });
      compEvents = (fallbackData ?? []) as unknown as ProgramCompEvent[];
    } else {
      compEvents = rawCompEvents as unknown as ProgramCompEvent[];
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
      <div className="pub-container pb-16">
        {!current ? (
          <div className="pub-card p-12 text-center no-print">
            <Waves className="mx-auto h-10 w-10 text-[var(--m-aqua)]" />
            <h3 className="mt-3 font-semibold text-[var(--m-ink)]">Belum ada kejuaraan</h3>
          </div>
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
