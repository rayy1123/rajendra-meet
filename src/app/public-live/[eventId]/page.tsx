import { createClient } from '@/lib/supabase/server';
import { LiveScoreboardView } from '@/components/modules/live-scoreboard-view';
import { Waves } from 'lucide-react';
import { notFound } from 'next/navigation';

export default async function PublicLivePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const supabase = await createClient();
  const { eventId } = await params;

  // 1. Ambil detail Event
  const { data: event } = await supabase
    .from('events')
    .select('id, name, location, pool_type, lane_count')
    .eq('id', eventId)
    .single();

  if (!event) {
    notFound();
  }

  // 2. Ambil daftar Nomor Lomba untuk Event ini
  const { data: compEvents } = await supabase
    .from('competition_events')
    .select('id, name, stroke, distance_meters, gender, grade_level, class_name')
    .eq('event_id', eventId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-lg text-white font-bold">
            <Waves className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest bg-blue-950 px-2 py-0.5 rounded border border-blue-800/50">
              Live Scoreboard
            </span>
            <h1 className="text-xl font-extrabold text-white line-clamp-1">{event.name}</h1>
          </div>
        </div>

        <div className="text-right text-xs text-slate-400 hidden md:block">
          <p className="font-semibold text-slate-200">📍 {event.location}</p>
          <p>{event.pool_type} • {event.lane_count} Lintasan</p>
        </div>
      </header>

      {/* Interactive Realtime Scoreboard */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl w-full mx-auto">
        <LiveScoreboardView eventId={eventId} compEvents={compEvents || []} />
      </main>

      <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        SCMS Realtime Leaderboard &copy; {new Date().getFullYear()} — Powered by Rajendra
      </footer>
    </div>
  );
}