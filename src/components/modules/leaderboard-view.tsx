'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatMsToTime } from '@/lib/utils';
import { rankResults, type RankableResult, type ResultStatus } from '@/services/ranking';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Trophy, Radio, ListOrdered, Layers, Timer, CheckCircle2 } from 'lucide-react';

interface CompEvent {
  id: string;
  name: string;
  stroke: string | null;
  distance_meters: number | null;
  gender: string | null;
  grade_level: string | null;
  class_name: string | null;
}

interface HeatGroup {
  id: string;
  heat_number: number;
  lane_number: number;
  registration_id: string | null;
  seed_time_ms: number | null;
  athlete_name: string | null;
  athlete_number: string | null;
  school_name: string | null;
  result_id: string | null;
  time_ms: number | null;
  status: string | null;
}

interface LeaderboardViewProps {
  eventId: string;
  compEvents: CompEvent[];
  /** Bila true, tidak menampilkan header judul (dipakai di dalam kartu event). */
  embedded?: boolean;
  /** Tampilkan tab Per Heat (berguna di halaman live penuh). */
  showHeatTab?: boolean;
}

const STATUS_LABEL: Record<string, string> = {
  dns: 'DNS',
  dnf: 'DNF',
  dq: 'DQ',
  scr: 'SCR',
  ok: 'OK',
};

export function LeaderboardView({ eventId, compEvents, embedded, showHeatTab = true }: LeaderboardViewProps) {
  const supabase = useMemo(() => createClient(), []);
  const [selectedCompEventId, setSelectedCompEventId] = useState<string>(compEvents[0]?.id || '');
  const [heats, setHeats] = useState<HeatGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<'rank' | 'heat'>('rank');

  const fetchData = useCallback(async () => {
    if (!selectedCompEventId) return;
    setLoading(true);
    const { data } = await supabase
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

    const flat: HeatGroup[] = (data || []).flatMap((h: any) =>
      (h.heat_assignments || []).map((a: any) => ({
        id: h.id,
        heat_number: h.heat_number,
        lane_number: a.lane_number,
        registration_id: a.registrations?.id ?? null,
        seed_time_ms: a.registrations?.seed_time_ms ?? null,
        athlete_name: a.registrations?.athletes?.full_name ?? null,
        athlete_number: a.registrations?.athletes?.athlete_number ?? null,
        school_name: a.registrations?.athletes?.schools?.name ?? null,
        result_id: a.results?.[0]?.id ?? null,
        time_ms: a.results?.[0]?.time_ms ?? null,
        status: a.results?.[0]?.status ?? null,
      }))
    );
    setHeats(flat);
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

  const selectedComp = compEvents.find((c) => c.id === selectedCompEventId);

  // Ringkasan live
  const total = heats.length;
  const finished = heats.filter((h) => {
    const s = (h.status || 'finished').toLowerCase();
    return s === 'finished' || s === 'ok';
  }).length;
  const hasResult = (h: HeatGroup) => h.result_id !== null;
  const bestTime = useMemo(() => {
    const times = heats.filter((h) => hasResult(h) && (h.status || 'finished').toLowerCase() !== 'dns' && (h.status || 'finished').toLowerCase() !== 'dnf' && (h.status || 'finished').toLowerCase() !== 'dq').map((h) => h.time_ms).filter((t): t is number => t != null);
    return times.length ? Math.min(...times) : null;
  }, [heats]);

  // Peringkat lintas heat
  const ranked = useMemo(() => {
    const input: RankableResult[] = heats.map((h) => {
      const raw = (h.status || 'finished').toLowerCase();
      const isFinished = raw === 'finished' || raw === 'ok';
      const status: ResultStatus = isFinished ? 'finished' : (raw as ResultStatus);
      return {
        registration_id: h.registration_id || h.id,
        time_ms: isFinished ? h.time_ms : null,
        status,
      };
    });
    return rankResults(input);
  }, [heats]);

  const rankByReg = useMemo(() => {
    const m = new Map<string, number | null>();
    ranked.forEach((r) => m.set(r.registration_id, r.rank));
    return m;
  }, [ranked]);

  const heatsSorted = useMemo(
    () => [...heats].sort((a, b) => a.heat_number - b.heat_number || a.lane_number - b.lane_number),
    [heats]
  );

  const heatCount = useMemo(() => new Set(heats.map((h) => h.heat_number)).size, [heats]);

  if (compEvents.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-[var(--m-border)] py-14 text-center text-[var(--m-muted)]">
        Belum ada nomor lomba untuk kejuaraan ini.
      </div>
    );
  }

  return (
    <div className={embedded ? 'space-y-3' : 'space-y-6'}>
      {/* Pilihan nomor lomba / acara */}
      <div className="pub-card flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full space-y-1 sm:w-auto">
          <p className="pub-eyebrow">Pilih Acara / Nomor Lomba</p>
          <Select value={selectedCompEventId} onValueChange={(v) => { setSelectedCompEventId(v); setTab('rank'); }}>
            <SelectTrigger className="w-full bg-[var(--m-surface)] font-semibold text-[var(--m-ink)] sm:w-[440px]">
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
          <Radio className="h-3.5 w-3.5 animate-ping text-[var(--m-aqua)]" /> Live
        </div>
        {total > 0 && (
          <span className="pub-chip">
            <Layers className="h-3.5 w-3.5 text-[var(--m-aqua)]" /> {heatCount} Heat
          </span>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center space-y-2 py-16 text-[var(--m-muted)]">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--m-aqua)]" />
          <p className="text-sm">Memuat hasil lomba…</p>
        </div>
      ) : total === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--m-border)] py-14 text-center text-[var(--m-muted)]">
          Belum ada Heat / Jadwal Lomba untuk acara ini.
        </div>
      ) : (
        <>
          {/* Baris ringkasan */}
          <div className="grid grid-cols-3 gap-3">
            <Stat icon={<Layers className="h-4 w-4" />} label="Peserta" value={String(total)} />
            <Stat icon={<CheckCircle2 className="h-4 w-4" />} label="Selesai" value={`${finished}/${total}`} />
            <Stat icon={<Timer className="h-4 w-4" />} label="Waktu Terbaik" value={bestTime ? formatMsToTime(bestTime) : '—'} />
          </div>

          {/* Ringkasan akumulasi heat */}
          {total > 0 && (
            <p className="pub-eyebrow">
              Akumulasi {heatCount} Heat • {total} Peserta Lintas Heat — Peringkat Dihitung Otomatis
            </p>
          )}

          {/* Tab */}
          {showHeatTab && (
            <div className="inline-flex rounded-xl border border-[var(--m-border)] bg-[var(--m-surface)] p-1">
              <TabBtn active={tab === 'rank'} onClick={() => setTab('rank')} icon={<ListOrdered className="h-4 w-4" />} label="Peringkat" />
              <TabBtn active={tab === 'heat'} onClick={() => setTab('heat')} icon={<Layers className="h-4 w-4" />} label="Akumulasi Heat" />
            </div>
          )}

          {tab === 'rank' ? (
            <div className="pub-card overflow-hidden">
              {!embedded && (
                <div className="flex items-center justify-between border-b border-[var(--m-border)] bg-[var(--m-aqua-soft)] px-4 py-3">
                  <h2 className="flex items-center gap-2 text-base font-bold text-[var(--m-ink)]">
                    <Trophy className="h-5 w-5 text-amber-500" />
                    {selectedComp?.distance_meters}m {selectedComp?.stroke} {selectedComp?.grade_level}
                  </h2>
                  <span className="pub-chip">{total} Atlet</span>
                </div>
              )}
              <div className="divide-y divide-[var(--m-border)]">
                {ranked.map((r) => {
                  const h = heats.find((x) => (x.registration_id || x.id) === r.registration_id);
                  const isDnf = r.status !== 'finished';
                  const rankClass = r.rank === 1 ? 'rank-1' : r.rank === 2 ? 'rank-2' : r.rank === 3 ? 'rank-3' : 'rank-n';
                  return (
                    <div key={r.registration_id} className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-[var(--m-aqua-soft)]">
                      <div className="flex items-center gap-4">
                        <span className={rankClass}>{r.rank ?? '–'}</span>
                        <div>
                          <h4 className="text-base font-semibold text-[var(--m-ink)]">{h?.athlete_name || 'Lintasan Kosong'}</h4>
                          <p className="text-xs text-[var(--m-muted)]">
                            {h?.school_name || 'Umum'}
                            {h?.lane_number ? ` · Lane ${h.lane_number}` : ''}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {isDnf ? (
                          <span className="rounded-md bg-red-50 px-2 py-0.5 font-mono text-xs font-bold uppercase text-red-600">
                            {STATUS_LABEL[r.status] || r.status}
                          </span>
                        ) : h?.time_ms ? (
                          <span className="pub-time text-xl text-[var(--m-aqua-ink)] sm:text-2xl">{formatMsToTime(h.time_ms)}</span>
                        ) : (
                          <span className="pub-time text-sm text-[var(--m-muted)]">—</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {Array.from(new Set(heatsSorted.map((h) => h.heat_number)))
                .sort((a, b) => a - b)
                .map((hn) => {
                  const lanes = heatsSorted.filter((h) => h.heat_number === hn);
                  const heatDone = lanes.every((l) => l.result_id !== null);
                  return (
                    <div key={hn} className="pub-card overflow-hidden">
                      <div className="flex items-center justify-between border-b border-[var(--m-border)] bg-[var(--m-aqua-soft)] px-4 py-2.5">
                        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-[var(--m-ink)]">
                          <Layers className="h-4 w-4 text-[var(--m-aqua-ink)]" /> Heat {hn}
                        </h3>
                        <span className={`pub-chip ${heatDone ? 'text-emerald-600' : 'text-[var(--m-muted)]'}`}>
                          {heatDone ? 'Selesai' : 'Berlangsung'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-px bg-[var(--m-border)] sm:grid-cols-2">
                        {lanes.map((l) => {
                          const raw = (l.status || 'finished').toLowerCase();
                          const isDnf = raw !== 'finished' && raw !== 'ok';
                          const rank = rankByReg.get(l.registration_id || l.id);
                          return (
                            <div key={l.id} className="flex items-center gap-3 bg-[var(--m-surface)] px-4 py-2.5">
                              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--m-aqua-soft)] text-xs font-bold text-[var(--m-aqua-ink)]">
                                {l.lane_number}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-[var(--m-ink)]">{l.athlete_name || 'Kosong'}</p>
                                <p className="truncate text-xs text-[var(--m-muted)]">{l.school_name || 'Umum'}</p>
                              </div>
                              {isDnf && l.status ? (
                                <span className="rounded bg-red-50 px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase text-red-600">{STATUS_LABEL[l.status] || l.status}</span>
                              ) : l.time_ms ? (
                                <span className="pub-time text-sm text-[var(--m-aqua-ink)]">{formatMsToTime(l.time_ms)}</span>
                              ) : (
                                <span className="text-xs text-[var(--m-muted)]">—</span>
                              )}
                              {rank && !isDnf && (
                                <span className={`ml-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${rank <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)]'}`}>
                                  {rank}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="pub-card flex items-center gap-3 p-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)]">{icon}</span>
      <div className="leading-tight">
        <p className="text-xs text-[var(--m-muted)]">{label}</p>
        <p className="pub-time text-lg text-[var(--m-ink)]">{value}</p>
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
        active ? 'bg-[var(--m-aqua)] text-white' : 'text-[var(--m-muted)] hover:text-[var(--m-ink)]'
      }`}
    >
      {icon} {label}
    </button>
  );
}
