import { createClient } from '@/lib/supabase/server';
import { detectBrokenRecords, type RecordCandidate, type ExistingRecord } from '@/services/records';
import { formatMsToTime } from '@/lib/utils';
import { GlassCard } from '@/components/ui/glass-card';
import { EmptyState } from '@/components/ui/empty-state';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Crown } from 'lucide-react';

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
          athletes!inner ( id, full_name, schools ( name ) ),
          competition_event_id
        )
      )
    `);

  const candidates: RecordCandidate[] = (results || []).map((r: {
    time_ms: number | null;
    status: string | null;
    heat_assignments: {
      registrations: {
        athletes: { id: string; full_name: string | null; schools: { name: string | null }[] | null }[] | null;
        competition_event_id: string;
      }[];
    }[];
  }) => {
    const ha = r.heat_assignments?.[0];
    const reg = ha?.registrations?.[0];
    const ath = reg?.athletes?.[0];
    return {
      time_ms: r.time_ms ?? 0,
      status: r.status ?? '',
      competition_event_id: reg?.competition_event_id ?? '',
      athlete_id: ath?.id ?? '',
      athlete_name: ath?.full_name ?? '',
      school_name: ath?.schools?.[0]?.name ?? '',
    };
  }) as unknown as RecordCandidate[];

  const existingRecs: ExistingRecord[] = (existing || []) as unknown as ExistingRecord[];

  const broken = detectBrokenRecords(candidates, existingRecs);

  // Map nama nomor lomba
  const { data: compEvents } = await supabase
    .from('competition_events')
    .select('id, distance_meters, stroke, gender, grade_level');

  const compName = (id: string) => {
    const c = (compEvents || []).find((x: { id: string; distance_meters?: number | null; stroke?: string | null; grade_level?: string | null; gender?: string | null }) => x.id === id);
    if (!c) return id;
    return `${c.distance_meters}m ${c.stroke} ${c.grade_level} (${c.gender === 'female' ? 'Putri' : 'Putra'})`;
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumb items={[{ label: 'Dasbor', href: '/dashboard' }, { label: 'Rajendra Record' }]} className="mb-2" />
      <PageHeader
        title="Rajendra Record"
        description="Deteksi otomatis rekor baru per nomor lomba. Rekor memecahkan catatan tercepat sebelumnya."
        icon={<Crown className="h-6 w-6" />}
      />

      {broken.length === 0 ? (
        <EmptyState
          icon={<Crown className="h-6 w-6" />}
          title="Belum Ada Rekor Baru"
          description="Belum ada rekor baru terdeteksi. Input hasil lomba untuk memulai."
        />
      ) : (
        <div className="space-y-3">
          {broken.map((b) => (
            <GlassCard key={b.competition_event_id} className="flex items-center gap-4 p-5">
              <Crown className="h-8 w-8 text-amber-500" />
              <div className="flex-1">
                <p className="font-semibold">{compName(b.competition_event_id)}</p>
                <p className="text-sm text-[var(--m-muted)]">{b.athlete_name}</p>
                <p className="text-xs text-[var(--m-muted)]/80">{b.school_name || 'Perorangan'}</p>
              </div>
              <div className="text-right">
                <p className="font-mono text-2xl tabular-nums tracking-tight text-primary">{formatMsToTime(b.time_ms)}</p>
                {b.improvement_ms != null && (
                  <p className="text-xs text-emerald-600">-{(b.improvement_ms / 1000).toFixed(2)}s dari rekor lama</p>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
