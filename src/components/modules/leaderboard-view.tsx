'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatMsToTime } from '@/lib/utils';
import { rankResults, type RankableResult, type ResultStatus } from '@/services/ranking';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Trophy, Radio } from 'lucide-react';

interface CompEvent {
  id: string;
  name: string;
  stroke: string | null;
  distance_meters: number | null;
  gender: string | null;
  grade_level: string | null;
  class_name: string | null;
}

interface AssignmentRow {
  id: string;
  lane_number: number;
  registrations: {
    id: string;
    seed_time_ms: number | null;
    athletes: { full_name: string; athlete_number: string; schools: { name: string } | null } | null;
  } | null;
  results: { id: string; time_ms: number | null; status: string }[] | null;
}

interface LeaderboardViewProps {
  eventId: string;
  compEvents: CompEvent[];
  /** Bila true, tidak menampilkan header judul (dipakai di dalam kartu event). */
  embedded?: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  dns: 'DNS',
  dnf: 'DNF',
  dq: 'DQ',
  scr: 'SCR',
  ok: 'OK',
};

export function LeaderboardView({ eventId, compEvents, embedded }: LeaderboardViewProps) {
  const supabase = useMemo(() => createClient(), []);
  const [selectedCompEventId, setSelectedCompEventId] = useState<string>(compEvents[0]?.id || '');
  const [rows, setRows] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    if (!selectedCompEventId) return;
    setLoading(true);
    const { data: heats } = await supabase
      .from('heats')
      .select(`
        id,
        heat_number,
        heat_assignments (
          id,
          lane_number,
          registrations (
            id,
            seed_time_ms,
            athletes ( full_name, athlete_number, schools (name) )
          ),
          results ( id, time_ms, status )
        )
      `)
      .eq('competition_event_id', selectedCompEventId)
      .order('heat_number', { ascending: true });
    setRows(
      (heats || []).flatMap((h: any) => (h.heat_assignments || [])) as AssignmentRow[]
    );
    setLoading(false);
  }, [selectedCompEventId, supabase]);

  useEffect(() => {
    let isMounted = true;
    if (selectedCompEventId) fetchData().finally(() => isMounted && setLoading(false));
    const channel = supabase
      .channel(`leaderboard-${selectedCompEventId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'results' }, () => fetchData())
      .subscribe();
    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [selectedCompEventId, fetchData, supabase]);

  // Susun input untuk rankResults (satu nomor lomba, lintas heat)
  const ranked = useMemo(() => {
    const input: RankableResult[] = rows.map((r) => {
      const res = r.results?.[0];
      const rawStatus = (res?.status || 'finished').toLowerCase();
      const isFinished = rawStatus === 'finished' || rawStatus === 'ok';
      const status: ResultStatus = isFinished ? 'finished' : (rawStatus as ResultStatus);
      const time = res?.time_ms ?? null;
      return {
        registration_id: r.registrations?.id || r.id,
        time_ms: isFinished ? time : null,
        status,
      };
    });
    return rankResults(input);
  }, [rows]);

  const rankById = useMemo(() => {
    const m = new Map<string, number | null>();
    ranked.forEach((r) => m.set(r.registration_id, r.rank));
    return m;
  }, [ranked]);

  const selectedComp = compEvents.find((c) => c.id === selectedCompEventId);

  return (
    <div className={embedded ? 'space-y-3' : 'space-y-6'}>
      {/* Pilihan nomor lomba / acara */}
      <div className="pub-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full space-y-1 sm:w-auto">
          <p className="pub-eyebrow">Pilih Acara / Nomor Lomba</p>
          <Select value={selectedCompEventId} onValueChange={setSelectedCompEventId}>
            <SelectTrigger className="w-full bg-[var(--m-surface)] font-semibold text-[var(--m-ink)] sm:w-[420px]">
              <SelectValue placeholder="Pilih Acara" />
            </SelectTrigger>
            <SelectContent className="bg-[var(--m-surface)] text-[var(--m-ink)]">
              {compEvents.map((ce) => (
                <SelectItem key={ce.id} value={ce.id}>
                  {ce.distance_meters}m {ce.stroke} {ce.grade_level} ({ce.gender === 'female' ? 'Putri' : 'Putra'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="pub-chip">
          <Radio className="h-3.5 w-3.5 animate-ping text-[var(--m-aqua)]" /> Realtime
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center space-y-2 py-16 text-[var(--m-muted)]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--m-aqua)]" />
          <p className="text-sm">Memuat hasil lomba…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--m-border)] py-14 text-center text-[var(--m-muted)]">
          Belum ada Heat / Jadwal Lomba untuk acara ini.
        </div>
      ) : (
        <div className="pub-card overflow-hidden">
          {!embedded && (
            <div className="flex items-center justify-between border-b border-[var(--m-border)] bg-[var(--m-aqua-soft)] px-4 py-3">
              <h2 className="flex items-center gap-2 text-base font-bold text-[var(--m-ink)]">
                <Trophy className="h-5 w-5 text-amber-500" />
                {selectedComp?.distance_meters}m {selectedComp?.stroke} {selectedComp?.grade_level}
              </h2>
              <span className="pub-chip">{rows.length} Atlet</span>
            </div>
          )}
          <div className="divide-y divide-[var(--m-border)]">
            {ranked.map((r) => {
              const row = rows.find((x) => (x.registrations?.id || x.id) === r.registration_id);
              const athlete = row?.registrations?.athletes;
              const school = athlete?.schools;
              const res = row?.results?.[0];
              const rank = r.rank;
              const isDnf = r.status !== 'finished';
              const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-n';
              return (
                <div
                  key={r.registration_id}
                  className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-[var(--m-aqua-soft)]"
                >
                  <div className="flex items-center gap-4">
                    <span className={rankClass}>{rank ?? '–'}</span>
                    <div>
                      <h4 className="text-base font-semibold text-[var(--m-ink)]">
                        {athlete?.full_name || 'Lintasan Kosong'}
                      </h4>
                      <p className="text-xs text-[var(--m-muted)]">
                        {school?.name || 'Umum'}
                        {row?.lane_number ? ` · Lane ${row.lane_number}` : ''}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    {isDnf ? (
                      <span className="rounded-md bg-red-50 px-2 py-0.5 font-mono text-xs font-bold uppercase text-red-600">
                        {STATUS_LABEL[r.status] || r.status}
                      </span>
                    ) : res?.time_ms ? (
                      <span className="pub-time text-xl text-[var(--m-aqua-ink)] sm:text-2xl">
                        {formatMsToTime(res.time_ms)}
                      </span>
                    ) : (
                      <span className="pub-time text-sm text-[var(--m-muted)]">—</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
