import { createClient } from '@/lib/supabase/server';
import { PublicShell } from '@/components/layout/public-shell';
import { LeaderboardView } from '@/components/modules/leaderboard-view';
import { LiveClosedCard } from '@/components/modules/live-closed-card';
import { getEventLiveConfig } from '@/lib/data/live-scoreboard-server';
import { checkEventLiveStatus } from '@/lib/data/live-scoreboard-settings';
import { notFound } from 'next/navigation';
import { MapPin, Waves, Lock } from 'lucide-react';

interface PublicLivePageProps {
  params: Promise<{ eventId: string }>;
}

export const dynamic = 'force-dynamic';

export default async function PublicLivePage({ params }: PublicLivePageProps) {
  const { eventId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  let isAdmin = false;
  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    isAdmin = profile?.role === 'admin' || profile?.role === 'operator';
  }

  const { data: event, error: eventError } = await supabase
    .from('events')
    .select('id, name, location, pool_type, lane_count, is_published, start_date, end_date')
    .eq('id', eventId)
    .single();

  // Jangan bocorkan event yang belum dipublikasikan lewat URL publik.
  if (eventError || !event || !event.is_published) {
    notFound();
  }

  const liveConfig = getEventLiveConfig(eventId);
  const liveStatus = checkEventLiveStatus(event, liveConfig);

  const { data: compEvents } = await supabase
    .from('competition_events')
    .select('id, name, stroke, distance_meters, gender, grade_level, class_name')
    .eq('event_id', eventId)
    .order('distance_meters', { ascending: true });

  return (
    <PublicShell
      title={event.name}
      subtitle="Papan skor langsung. Hasil memperbarui otomatis setiap kali panitia menyimpan waktu."
      breadcrumbItems={[
        { label: 'Beranda', href: '/' },
        { label: 'Live Scoreboard', href: '/scoreboard' },
        { label: event.name },
      ]}
    >
      <div className="pub-container pb-16 space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          {event.location && (
            <span className="pub-chip">
              <MapPin className="h-3.5 w-3.5 text-[var(--m-aqua)]" /> {event.location}
            </span>
          )}
          <span className="pub-chip">
            <Waves className="h-3.5 w-3.5 text-[var(--m-aqua)]" /> {event.pool_type || 'Standard'} · {event.lane_count || 8} lintasan
          </span>
          {liveStatus.isActive ? (
            <span className="pub-chip bg-emerald-50 text-emerald-700 border-emerald-300 font-bold flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              Live Scoreboard Aktif
            </span>
          ) : (
            <span className="pub-chip bg-amber-50 text-amber-800 border-amber-300 font-bold flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-amber-600" />
              Scoreboard Belum Berjalan
            </span>
          )}
        </div>

        {!liveStatus.isActive ? (
          <LiveClosedCard
            event={event}
            reason={liveStatus.reason}
            mode={liveConfig.mode}
            isAdmin={isAdmin}
          />
        ) : (
          <LeaderboardView eventId={eventId} compEvents={compEvents || []} showHeatTab />
        )}
      </div>
    </PublicShell>
  );
}
