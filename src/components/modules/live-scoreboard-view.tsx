'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatMsToTime } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Radio } from 'lucide-react';

interface LiveHeatAssignment {
  id: string;
  lane_number: number;
  registration_id?: string | null;
  registrations?: {
    seed_time_ms?: number | null;
    athletes?: {
      full_name?: string | null;
      athlete_number?: string | null;
      schools?: { name?: string | null } | null;
    } | null;
  } | null;
  results?: { id: string; time_ms?: number | null; status?: string }[] | null;
}

interface LiveHeat {
  id: string;
  heat_number: number;
  heat_assignments?: LiveHeatAssignment[] | null;
}

interface LiveScoreboardViewProps {
  eventId: string;
  compEvents: { id: string; name: string; grade_level?: string | null; gender?: string | null }[];
}

export function LiveScoreboardView({ compEvents }: LiveScoreboardViewProps) {
  const supabase = useMemo(() => createClient(), []);
  const [selectedCompEventId, setSelectedCompEventId] = useState<string>(compEvents[0]?.id || '');
  const [heatsData, setHeatsData] = useState<LiveHeat[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data Heat & Hasil Lomba
  const fetchScores = useCallback(async () => {
    if (!selectedCompEventId) return;

    const { data: heats } = await supabase
      .from('heats')
      .select(`
        id,
        heat_number,
        heat_assignments (
          id,
          lane_number,
          registrations (
            seed_time_ms,
            athletes (
              full_name,
              athlete_number,
              schools (name)
            )
          ),
          results (
            id,
            time_ms,
            status
          )
        )
      `)
      .eq('competition_event_id', selectedCompEventId)
      .order('heat_number', { ascending: true });

    setHeatsData(heats || []);
  }, [selectedCompEventId, supabase]);

  useEffect(() => {
    let isMounted = true;

    if (selectedCompEventId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchScores().finally(() => {
        if (isMounted) setLoading(false);
      });
    }

    // Setup Supabase Realtime listener pada tabel 'results'
    const channel = supabase
      .channel('realtime-scoreboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'results' },
        () => {
          fetchScores(); // Refresh otomatis jika ada insert/update/delete hasil
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [selectedCompEventId, fetchScores, supabase]);

  return (
    <div className="space-y-6">
      {/* Select Nomor Lomba */}
      <div className="pub-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full space-y-1 sm:w-auto">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--m-muted)]">
            Pilih Nomor Lomba
          </p>
          <Select value={selectedCompEventId} onValueChange={setSelectedCompEventId}>
            <SelectTrigger className="w-full bg-[var(--m-surface)] font-semibold sm:w-[380px]">
              <SelectValue placeholder="Pilih Nomor Lomba" />
            </SelectTrigger>
            <SelectContent>
              {compEvents.map((ce) => (
                <SelectItem key={ce.id} value={ce.id}>
                  {ce.name} - {ce.grade_level} ({ce.gender === 'female' ? 'Putri' : 'Putra'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-[var(--m-border)] bg-[var(--m-aqua-soft)] px-3 py-1.5 text-xs font-bold text-[var(--m-aqua-ink)]">
          <Radio className="h-3.5 w-3.5 animate-ping text-[var(--m-aqua)]" /> Realtime Aktif
        </div>
      </div>

      {/* Render Heats & Leaderboard */}
      {loading ? (
        <div className="flex flex-col items-center justify-center space-y-2 py-20 text-[var(--m-muted)]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--m-aqua)]" />
          <p className="text-sm">Memuat data lintasan & hasil waktu…</p>
        </div>
      ) : heatsData.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--m-border)] py-16 text-center text-[var(--m-muted)]">
          Belum ada Acara / Jadwal Lomba untuk nomor ini.
        </div>
      ) : (
        <div className="space-y-6">
          {heatsData.map((heat) => (
            <Card key={heat.id} className="overflow-hidden border-[var(--m-border)] shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between border-b border-[var(--m-border)] bg-[var(--m-aqua-soft)] py-3">
                <CardTitle className="text-base font-black uppercase tracking-wide text-[var(--m-ink)]">
                  Acara {heat.heat_number}
                </CardTitle>
                <Badge variant="outline" className="border-[var(--m-border)] text-[var(--m-muted)]">
                  {heat.heat_assignments?.length || 0} Atlet
                </Badge>
              </CardHeader>

              <CardContent className="divide-y divide-[var(--m-border)] p-0">
                {heat.heat_assignments &&
                  [...heat.heat_assignments]
                    .sort((a, b) => a.lane_number - b.lane_number)
                    .map((assign) => {
                      const athlete = assign.registrations?.athletes;
                      const school = athlete?.schools;
                      const result = assign.results?.[0];

                      return (
                        <div
                          key={assign.id}
                          className="flex items-stretch gap-3 p-3 transition-colors hover:bg-[var(--m-aqua-soft)] sm:p-4"
                        >
                          {/* Lane strip kiri */}
                          <span className="flex w-10 shrink-0 self-center flex-col items-center justify-center rounded-lg bg-[var(--m-aqua-soft)] py-1 text-[var(--m-aqua-ink)]">
                            <span className="text-[9px] font-semibold uppercase leading-none">Lane</span>
                            <span className="text-lg font-black leading-none">{assign.lane_number}</span>
                          </span>

                          {/* Nama + sekolah */}
                          <div className="min-w-0 flex-1 self-center">
                            <h4 className="truncate text-base font-bold text-[var(--m-ink)]">
                              {athlete?.full_name || 'Lintasan Kosong'}
                            </h4>
                            <p className="truncate text-xs text-[var(--m-muted)]">
                              {school?.name || 'Umum'}
                            </p>
                          </div>

                          {/* Waktu / status + seed di kanan */}
                          <div className="flex shrink-0 flex-col items-end justify-center gap-0.5">
                            <div>
                              {result?.status && result.status !== 'finished' ? (
                                <Badge variant="destructive" className="font-mono text-xs font-bold uppercase">
                                  {result.status}
                                </Badge>
                              ) : result?.time_ms ? (
                                <span className="pub-time text-xl font-black tracking-wider text-[var(--m-aqua-ink)] sm:text-2xl">
                                  {formatMsToTime(result.time_ms)}
                                </span>
                              ) : (
                                <span className="font-mono text-sm text-[var(--m-muted)]">--:--.--</span>
                              )}
                            </div>
                            <span className="text-[10px] font-medium uppercase tracking-wide text-[var(--m-muted)]">
                              Seed {formatMsToTime(assign.registrations?.seed_time_ms)}
                            </span>
                          </div>
                        </div>
                      );
                    })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
