import { createClient } from '@/lib/supabase/server';
import { MedalLeaderboardView } from '@/components/modules/medal-leaderboard-view';
import { Award, Waves } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';

interface MedalStat {
  id: string;
  name: string;
  gold: number;
  silver: number;
  bronze: number;
}

interface ResultRow {
  time_ms?: number | null;
  heat_assignments?: {
    competition_events?: { id: string; event_id?: string; name?: string } | null;
    registrations?: {
      athletes?: { full_name?: string | null; schools?: { id: string; name?: string } | null } | null;
    } | null;
  } | null;
}

export default async function MedalsPage({
  searchParams,
}: {
  searchParams: Promise<{ eventId?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;

  // 1. Ambil daftar event
  const { data: events } = await supabase
    .from('events')
    .select('id, name')
    .order('created_at', { ascending: false });

  const activeEventId = params.eventId || events?.[0]?.id || '';

  // 2. Query Hasil Lomba Tercepat per Kategori untuk Menghitung Medali
  let medalStats: MedalStat[] = [];

  if (activeEventId) {
    const { data: results } = await supabase
      .from('results')
      .select(`
        id,
        time_ms,
        heat_assignments!inner (
          competition_events!inner (
            id,
            event_id,
            name
          ),
          registrations!inner (
            athletes!inner (
              full_name,
              schools (
                id,
                name
              )
            )
          )
        )
      `)
      .eq('heat_assignments.competition_events.event_id', activeEventId)
      .not('time_ms', 'is', null)
      .order('time_ms', { ascending: true });

    // Grouping & Perhitungan Medali per Sekolah / Kontingen
    const schoolMap = new Map<string, { id: string; name: string; gold: number; silver: number; bronze: number }>();

    if (results) {
      // Grouping per Nomor Lomba
      const compEventGroups = new Map<string, ResultRow[]>();
      (results as unknown as ResultRow[]).forEach((r) => {
        const ceId = r.heat_assignments?.competition_events?.id;
        if (!ceId) return;
        if (!compEventGroups.has(ceId)) compEventGroups.set(ceId, []);
        compEventGroups.get(ceId)?.push(r);
      });

      // Tetapkan Juara 1 (Emas), Juara 2 (Perak), Juara 3 (Perunggu) per Nomor Lomba
      compEventGroups.forEach((compResults) => {
        // Urutkan waktu dari yang tercepat
        const sorted = compResults.sort((a, b) => (a.time_ms ?? 0) - (b.time_ms ?? 0));

        sorted.forEach((res, index) => {
          if (index > 2) return; // Hanya ambil Top 3

          const school = res.heat_assignments?.registrations?.athletes?.schools;
          const schoolId = school?.id || 'umum';
          const schoolName = school?.name || 'Umum / Perorangan';

          if (!schoolMap.has(schoolId)) {
            schoolMap.set(schoolId, { id: schoolId, name: schoolName, gold: 0, silver: 0, bronze: 0 });
          }

          const current = schoolMap.get(schoolId)!;
          if (index === 0) current.gold += 1;
          else if (index === 1) current.silver += 1;
          else if (index === 2) current.bronze += 1;
        });
      });

      medalStats = Array.from(schoolMap.values()).sort((a, b) => {
        if (b.gold !== a.gold) return b.gold - a.gold;
        if (b.silver !== a.silver) return b.silver - a.silver;
        return b.bronze - a.bronze;
      });
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Perolehan Medali & Klasemen"
        description="Peringkat akumulasi medali Emas, Perak, dan Perunggu per kontingen/sekolah secara otomatis."
        icon={<Award className="h-6 w-6" />}
      />
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Klasemen Medali' }]} className="mb-1" />

      {!events || events.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Waves className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-semibold text-lg">Belum Ada Event</h3>
          <p className="text-sm text-muted-foreground mt-1">Silakan buat event terlebih dahulu.</p>
        </Card>
      ) : (
        <MedalLeaderboardView
          events={events}
          initialEventId={activeEventId}
          medalStats={medalStats}
        />
      )}
    </div>
  );
}