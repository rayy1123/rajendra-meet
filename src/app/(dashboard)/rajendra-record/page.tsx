import { createClient } from '@/lib/supabase/server';
import { detectBrokenRecords, type RecordCandidate, type ExistingRecord } from '@/services/records';
import { formatMsToTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Crown } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function RajendraRecordPage() {
  const supabase = await createClient();

  // Rekor yang sudah tercatat
  const { data: existing } = await supabase
    .from('rajendra_records')
    .select('competition_event_id, time_ms')
    .eq('is_active', true);

  // Kandidat: hasil finished yang valid
  const { data: results } = await supabase
    .from('results')
    .select(`
      time_ms,
      status,
      heat_assignments!inner (
        registrations!inner (
          athletes!inner ( full_name ),
          competition_event_id
        )
      )
    `);

  const candidates: RecordCandidate[] = (results || [])
    .map((r: any) => {
      const reg = r.heat_assignments?.registrations;
      return {
        competition_event_id: reg.competition_event_id,
        athlete_id: reg.athletes.id,
        athlete_name: reg.athletes.full_name,
        time_ms: r.time_ms ?? 0,
        status: r.status,
      };
    });

  const existingRecs: ExistingRecord[] = (existing || []).map((e: any) => ({
    competition_event_id: e.competition_event_id,
    time_ms: e.time_ms,
  }));

  const broken = detectBrokenRecords(candidates, existingRecs);

  // Map nama nomor lomba
  const { data: compEvents } = await supabase
    .from('competition_events')
    .select('id, distance_meters, stroke, gender, grade_level');

  const compName = (id: string) => {
    const c = (compEvents || []).find((x: any) => x.id === id);
    if (!c) return id;
    return `${c.distance_meters}m ${c.stroke} ${c.grade_level} (${c.gender === 'female' ? 'Putri' : 'Putra'})`;
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-bold">Rajendra Record</h1>
        <p className="text-sm text-muted-foreground">
          Deteksi otomatis rekor baru per nomor lomba. Rekor memecahkan catatan tercepat sebelumnya.
        </p>
      </div>

      {broken.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Belum ada rekor baru terdeteksi. Input hasil lomba untuk memulai.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {broken.map((b) => (
            <Card key={b.competition_event_id}>
              <CardContent className="flex items-center gap-4 p-5">
                <Crown className="h-8 w-8 text-amber-500" />
                <div className="flex-1">
                  <p className="font-semibold">{compName(b.competition_event_id)}</p>
                  <p className="text-sm text-muted-foreground">{b.athlete_name}</p>
                </div>
                <div className="text-right">
                  <p className="pub-time text-2xl text-primary">{formatMsToTime(b.time_ms)}</p>
                  {b.improvement_ms != null && (
                    <p className="text-xs text-emerald-600">-{(b.improvement_ms / 1000).toFixed(2)}s dari rekor lama</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
