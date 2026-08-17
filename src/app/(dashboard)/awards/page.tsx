import { createClient } from '@/lib/supabase/server';
import { rankResults } from '@/services/ranking';
import { buildStandings, type PointRule, type ScoredEntry } from '@/services/points';
import { selectBestSwimmers, type SwimmerEntry } from '@/services/records';
import type { ResultStatus } from '@/types/database';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { School, User, Building2 } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';

export const dynamic = 'force-dynamic';

const DEFAULT_RULES: PointRule[] = [
  { rank: 1, points: 10 },
  { rank: 2, points: 8 },
  { rank: 3, points: 6 },
  { rank: 4, points: 5 },
  { rank: 5, points: 4 },
  { rank: 6, points: 3 },
  { rank: 7, points: 2 },
  { rank: 8, points: 1 },
];

interface Row {
  registration_id: string;
  competition_event_id: string;
  athlete_id: string;
  athlete_name: string;
  school_id: string | null;
  school_name: string | null;
  grade_level: string;
  class_name: string;
  gender: string;
  time_ms: number | null;
  status: string;
}

export default async function AwardsPage() {
  const supabase = await createClient();

  const { data: pointRules } = await supabase
    .from('point_rules')
    .select('rank, points')
    .order('rank', { ascending: true });
  const rules = (pointRules && pointRules.length ? pointRules : DEFAULT_RULES) as PointRule[];

  // Ambil hasil + join registrations -> athletes -> schools + competition_event
  const { data: results } = await supabase
    .from('results')
    .select(`
      id,
      time_ms,
      status,
      heat_assignments!inner (
        registrations!inner (
          id,
          competition_event_id,
          athletes!inner (
            id, full_name, grade_level, class_name, gender, schools ( name )
          )
        )
      )
    `);

  const rows: Row[] = (results || []) as unknown as Row[];

  // Rank per competition_event
  const byComp = new Map<string, Row[]>();
  rows.forEach((r) => {
    const arr = byComp.get(r.competition_event_id) || [];
    arr.push(r);
    byComp.set(r.competition_event_id, arr);
  });

  const entries: ScoredEntry[] = [];
  const swimmerEntries: SwimmerEntry[] = [];
  for (const [compId, arr] of byComp) {
    const ranked = rankResults(
      arr.map((r) => ({
        registration_id: r.registration_id,
        time_ms: r.status === 'finished' ? r.time_ms : null,
        status: (r.status === 'ok' ? 'finished' : r.status) as ResultStatus,
      }))
    );
    ranked.forEach((rk) => {
      const r = arr.find((x) => x.registration_id === rk.registration_id);
      if (!r) return;
      const rank = rk.rank ?? null;
      if (rank == null) return;
      entries.push({
        athlete_id: r.athlete_id,
        school_id: r.school_id,
        grade_level: r.grade_level,
        class_name: r.class_name,
        gender: r.gender,
        rank,
        competition_event_id: compId,
      });
      swimmerEntries.push({
        athlete_id: r.athlete_id,
        athlete_name: r.athlete_name,
        school_id: r.school_id,
        grade_level: r.grade_level,
        class_name: r.class_name,
        gender: r.gender,
        competition_event_id: compId,
        rank,
      });
    });
  }

  const overall = buildStandings(entries, rules, { groupBy: 'overall' });
  const byGrade = buildStandings(entries, rules, { groupBy: 'grade' });
  const byClass = buildStandings(entries, rules, { groupBy: 'class' });
  const bestSwimmers = selectBestSwimmers(swimmerEntries, rules);

  const schoolName = (id: string | null) =>
    rows.find((r) => r.school_id === id)?.school_name || 'Umum';

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <PageHeader
        title="Awards & Klasemen"
        description={`Klasemen dihitung otomatis dari hasil lomba. Poin: ${rules.map((r) => `${r.rank}=${r.points}`).join(', ')}.`}
        icon={<Building2 className="h-6 w-6" />}
      />

      {entries.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Belum ada hasil lomba. Input hasil di menu Results untuk melihat klasemen.
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="overall">
          <TabsList>
            <TabsTrigger value="overall"><Building2 className="h-4 w-4" /> Overall</TabsTrigger>
            <TabsTrigger value="grade"><School className="h-4 w-4" /> Per Tingkat</TabsTrigger>
            <TabsTrigger value="class"><User className="h-4 w-4" /> Per Kelas</TabsTrigger>
            <TabsTrigger value="swimmer"><User className="h-4 w-4" /> Best Swimmer</TabsTrigger>
          </TabsList>

          <TabsContent value="overall">
            <StandingTable rows={overall} schoolName={schoolName} title="Klasemen Overall" />
          </TabsContent>
          <TabsContent value="grade">
            <StandingTable rows={byGrade} schoolName={schoolName} title="Klasemen per Tingkat" />
          </TabsContent>
          <TabsContent value="class">
            <StandingTable rows={byClass} schoolName={schoolName} title="Klasemen per Kelas" />
          </TabsContent>
          <TabsContent value="swimmer">
            <div className="space-y-4">
              {bestSwimmers.map((g) => (
                <Card key={g.group_key}>
                  <CardHeader>
                    <CardTitle className="text-base">{g.group_key}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {g.tied ? (
                      <p className="text-sm text-amber-600">
                        Seri di puncak ({g.contenders.map((c) => c.athlete_name).join(', ')}). Panitia menentukan pemenang.
                      </p>
                    ) : g.winner ? (
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">★</span>
                        <div>
                          <p className="font-semibold">{g.winner.athlete_name}</p>
                          <p className="text-sm text-muted-foreground">
                            {schoolName(g.winner.school_id)} · {g.winner.points} poin · {g.winner.gold}Emas {g.winner.silver}Perak {g.winner.bronze}Perunggu
                          </p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Belum ada pemenang.</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function StandingTable({
  rows,
  schoolName,
  title,
}: {
  rows: { key: string; school_id: string | null; points: number; gold: number; silver: number; bronze: number }[];
  schoolName: (id: string | null) => string;
  title: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Sekolah</TableHead>
              <TableHead>Poin</TableHead>
              <TableHead>Emas</TableHead>
              <TableHead>Perak</TableHead>
              <TableHead>Perunggu</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={r.key}>
                <TableCell className="font-bold">{i + 1}</TableCell>
                <TableCell className="font-medium">{schoolName(r.school_id)}</TableCell>
                <TableCell className="font-bold text-primary">{r.points}</TableCell>
                <TableCell>{r.gold}</TableCell>
                <TableCell>{r.silver}</TableCell>
                <TableCell>{r.bronze}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Table primitives

