import { createClient } from '@/lib/supabase/server';
import { PublicShell } from '@/components/layout/public-shell';
import { LeaderboardView } from '@/components/modules/leaderboard-view';
import { notFound } from 'next/navigation';
import { MapPin, Waves } from 'lucide-react';

interface PublicLivePageProps {
  params: Promise<{ eventId: string }>;
}

export const dynamic = 'force-dynamic';

export default async function PublicLivePage({ params }: PublicLivePageProps) {
  const { eventId } = await params;
  const supabase = await createClient();

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, name, location, pool_type, lane_count, is_published')
    .eq('id', eventId)
    .single();

  // Jangan bocorkan event yang belum dipublikasikan lewat URL publik.
  if (eventError || !event || !event.is_published) {
    notFound();
  }

  const { data: compEvents } = await supabase
    .from('competition_events')
    .select('id, name, stroke, distance_meters, gender, grade_level, class_name')
    .eq('event_id', eventId)
    .order('distance_meters', { ascending: true });

  return (
    <PublicShell
      title={event.name}
      subtitle="Papan skor langsung. Hasil memperbarui otomatis setiap kali panitia menyimpan waktu."
    >
      <div className="pub-container pb-16">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {event.location && (
            <span className="pub-chip">
              <MapPin className="h-3.5 w-3.5 text-[var(--m-aqua)]" /> {event.location}
            </span>
          )}
          <span className="pub-chip">
            <Waves className="h-3.5 w-3.5 text-[var(--m-aqua)]" /> {event.pool_type || 'Standard'} · {event.lane_count || 8} lintasan
          </span>
        </div>

        <LeaderboardView eventId={eventId} compEvents={compEvents || []} showHeatTab />
      </div>
    </PublicShell>
  );
}
