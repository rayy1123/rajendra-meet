import { createClient } from '@/lib/supabase/server';
import { LeaderboardView } from '@/components/modules/leaderboard-view';
import { Card, CardContent } from '@/components/ui/card';
import { Trophy } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function RankingsPage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from('events')
    .select('id, name')
    .order('start_date', { ascending: false });

  const { data: compEvents } = await supabase
    .from('competition_events')
    .select('id, name, stroke, distance_meters, gender, grade_level, class_name, event_id')
    .order('distance_meters', { ascending: true });

  // Kelompokkan nomor lomba per event
  const byEvent = (events || []).map((ev) => ({
    ...ev,
    compEvents: (compEvents || []).filter((c) => c.event_id === ev.id),
  }));

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Perangkingan</h1>
        <p className="text-sm text-muted-foreground">
          Peringkat otomatis per nomor lomba, dihitung lintas heat berdasarkan waktu tercepat.
        </p>
      </div>

      {byEvent.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Belum ada kejuaraan. Buat event terlebih dahulu.
          </CardContent>
        </Card>
      ) : (
        byEvent.map((ev) => (
          <Card key={ev.id}>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center gap-2 border-b border-border pb-3">
                <Trophy className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-bold">{ev.name}</h2>
                <span className="pub-chip ml-auto">{ev.compEvents.length} Nomor Lomba</span>
              </div>
              {ev.compEvents.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Belum ada nomor lomba untuk kejuaraan ini.
                </p>
              ) : (
                <LeaderboardView eventId={ev.id} compEvents={ev.compEvents as any} embedded showHeatTab={false} />
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
