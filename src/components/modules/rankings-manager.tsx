'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Trophy,
  Crown,
  Printer,
  Search,
  Layers,
  ListOrdered,
  Users,
  Filter,
} from 'lucide-react';
import { formatMsToTime, cn } from '@/lib/utils';
import { rankResults, type RankableResult, type ResultStatus } from '@/services/ranking';
import { calculateFinaPoints } from '@/services/fina-points';

export interface RawCompEventData {
  id: string;
  order_no?: number | null;
  name: string;
  stroke: string | null;
  distance_meters: number | null;
  gender: string | null;
  grade_level: string | null;
  class_name: string | null;
  age_group: string | null;
  heats?: Array<{
    id: string;
    heat_number: number;
    heat_assignments?: Array<{
      id: string;
      lane_number: number;
      results?: Array<{
        id: string;
        time_ms: number | null;
        status: string | null;
      }> | null;
      registrations?: {
        id: string;
        seed_time_ms?: number | null;
        athletes?: {
          id: string;
          athlete_number?: string | null;
          full_name: string;
          gender?: string | null;
          grade_level?: string | null;
          class_name?: string | null;
          age_group?: string | null;
          birth_date?: string | null;
          schools?: {
            id: string;
            name: string;
          } | null;
        } | null;
      } | null;
    }> | null;
  }> | null;
}

export interface RankedAthleteItem {
  id: string;
  registrationId: string;
  athleteId: string;
  athleteNumber: string;
  athleteName: string;
  schoolName: string;
  gender: string;
  ageGroup: string;
  heatNumber: number;
  laneNumber: number;
  timeMs: number | null;
  seedTimeMs: number | null;
  status: string;
  rank: number | null;
  heatRank?: number | null;
  gapMs?: number;
  finaPoints?: number;
}

export interface BestSwimmerScore {
  athleteId: string;
  athleteNumber: string;
  athleteName: string;
  schoolName: string;
  gender: string;
  ageGroup: string;
  gold: number;
  silver: number;
  bronze: number;
  points: number;
  eventCount: number;
  bestTimeMs: number | null;
  bestEventName: string;
}

const STATUS_LABELS: Record<string, string> = {
  finished: 'FINIS',
  ok: 'FINIS',
  dns: 'DNS (Tidak Hadir)',
  dnf: 'DNF (Tidak Selesai)',
  dq: 'DQ (Diskualifikasi)',
  scr: 'SCR (Mundur)',
};

export function resolveAgeGroup(ce: {
  age_group?: string | null;
  grade_level?: string | null;
  class_name?: string | null;
}): string {
  if (ce.age_group && ce.age_group.trim()) return ce.age_group.trim();
  if (ce.grade_level && ce.grade_level.trim()) {
    const gl = ce.grade_level.trim();
    if (gl === 'SD' && ce.class_name && ce.class_name.trim()) {
      return `SD ${ce.class_name.trim()}`;
    }
    if (gl === 'TK') return 'PAUD / TK';
    return gl;
  }
  if (ce.class_name && ce.class_name.trim()) return ce.class_name.trim();
  return 'Umum / Terbuka';
}

export function RankingsManager({
  events,
  currentEvent,
  compEvents,
  pointRules = [],
}: {
  events: Array<{
    id: string;
    name: string;
    location?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  }>;
  currentEvent: {
    id: string;
    name: string;
    location?: string | null;
    start_date?: string | null;
    end_date?: string | null;
  } | null;
  compEvents: RawCompEventData[];
  pointRules?: Array<{ rank: number; points: number }>;
}) {
  const [activeTab, setActiveTab] = useState<'event' | 'heat' | 'age_group' | 'best_swimmer'>('event');
  const [selectedCompEventId, setSelectedCompEventId] = useState<string>(compEvents[0]?.id || '');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const pointsMap = useMemo(() => {
    const map = new Map<number, number>();
    const defaultRules = [
      { rank: 1, points: 3 },
      { rank: 2, points: 2 },
      { rank: 3, points: 1 },
    ];
    const rules = pointRules && pointRules.length > 0
      ? pointRules.filter((r) => r.rank >= 1 && r.rank <= 3)
      : defaultRules;
    rules.forEach((r) => map.set(r.rank, r.points));
    return map;
  }, [pointRules]);

  // Ekstrak seluruh kategori umur unik dari buku acara kejuaraan
  const availableAgeGroups = useMemo(() => {
    const set = new Set<string>();
    compEvents.forEach((ce) => {
      const ku = resolveAgeGroup(ce);
      if (ku) set.add(ku);
    });
    return Array.from(set).sort();
  }, [compEvents]);

  // Proses seluruh atlet per nomor lomba
  const processedEvents = useMemo(() => {
    return compEvents.map((ce) => {
      const ageGroup = resolveAgeGroup(ce);
      const rawHeats = Array.isArray(ce.heats) ? ce.heats : [];

      const allParticipants: RankedAthleteItem[] = [];

      rawHeats.forEach((h) => {
        const assigns = Array.isArray(h.heat_assignments) ? h.heat_assignments : [];

        // Hitung peringkat dalam seri ini
        const heatRankables: RankableResult[] = assigns.map((a) => {
          const res = a.results?.[0];
          const rawStatus = (res?.status || '').toLowerCase();
          const isFinished = rawStatus === 'ok' || rawStatus === 'finished';
          return {
            registration_id: a.registrations?.id || a.id,
            time_ms: isFinished ? res?.time_ms ?? null : null,
            status: isFinished ? 'finished' : (rawStatus as ResultStatus),
          };
        });
        const heatRanked = rankResults(heatRankables);
        const heatRankMap = new Map<string, number | null>();
        heatRanked.forEach((hr) => heatRankMap.set(hr.registration_id, hr.rank));

        assigns.forEach((a) => {
          const reg = a.registrations;
          const ath = reg?.athletes;
          const school = ath?.schools;
          const res = a.results?.[0];
          const regId = reg?.id || a.id;
          const rawStatus = (res?.status || '').toLowerCase();
          const isFinished = rawStatus === 'ok' || rawStatus === 'finished';

          allParticipants.push({
            id: a.id,
            registrationId: regId,
            athleteId: ath?.id || a.id,
            athleteNumber: ath?.athlete_number || '—',
            athleteName: ath?.full_name || 'Lintasan Kosong',
            schoolName: school?.name || 'Umum / Terbuka',
            gender: ce.gender || ath?.gender || 'male',
            ageGroup,
            heatNumber: h.heat_number,
            laneNumber: a.lane_number,
            timeMs: isFinished ? res?.time_ms ?? null : null,
            seedTimeMs: reg?.seed_time_ms ?? null,
            status: isFinished ? 'finished' : (rawStatus || 'not_started'),
            rank: null, // dihitung lintas heat di bawah
            heatRank: heatRankMap.get(regId) ?? null,
            finaPoints:
              isFinished && res?.time_ms
                ? calculateFinaPoints(ce.gender, ce.stroke, ce.distance_meters, res.time_ms)
                : undefined,
          });
        });
      });

      // Hitung Peringkat Keseluruhan Lintas Heat (Time Final)
      const overallRankables: RankableResult[] = allParticipants.map((p) => ({
        registration_id: p.registrationId,
        time_ms: p.status === 'finished' ? p.timeMs : null,
        status: (p.status === 'finished' ? 'finished' : p.status) as ResultStatus,
      }));
      const overallRanked = rankResults(overallRankables);
      const overallRankMap = new Map<string, number | null>();
      overallRanked.forEach((or) => overallRankMap.set(or.registration_id, or.rank));

      const firstTime = allParticipants
        .filter((p) => p.status === 'finished' && p.timeMs && overallRankMap.get(p.registrationId) === 1)
        .map((p) => p.timeMs!)[0] ?? null;

      const finalizedParticipants = allParticipants.map((p) => {
        const rank = overallRankMap.get(p.registrationId) ?? null;
        return {
          ...p,
          rank,
          gapMs: firstTime && p.timeMs ? p.timeMs - firstTime : 0,
        };
      });

      // Sort: peserta finis berdasarkan peringkat, kemudian yang non-finis
      finalizedParticipants.sort((a, b) => {
        if (a.rank !== null && b.rank !== null) return a.rank - b.rank;
        if (a.rank !== null) return -1;
        if (b.rank !== null) return 1;
        return a.heatNumber - b.heatNumber || a.laneNumber - b.laneNumber;
      });

      return {
        ...ce,
        ageGroup,
        participants: finalizedParticipants,
      };
    });
  }, [compEvents]);

  // Acara yang sedang dipilih
  const currentCompEvent = useMemo(() => {
    return processedEvents.find((ce) => ce.id === selectedCompEventId) || processedEvents[0] || null;
  }, [processedEvents, selectedCompEventId]);

  // Hitung Klasemen Best Swimmer per Kategori Umur
  const bestSwimmersByAgeGroup = useMemo(() => {
    const ageGroupMap = new Map<string, { male: Map<string, BestSwimmerScore>; female: Map<string, BestSwimmerScore> }>();

    processedEvents.forEach((ev) => {
      const ku = ev.ageGroup;
      if (!ageGroupMap.has(ku)) {
        ageGroupMap.set(ku, {
          male: new Map<string, BestSwimmerScore>(),
          female: new Map<string, BestSwimmerScore>(),
        });
      }
      const groupData = ageGroupMap.get(ku)!;

      ev.participants.forEach((p) => {
        if (!p.rank || p.status !== 'finished') return;

        const isFemale = p.gender === 'female' || p.gender === 'putri';
        const targetMap = isFemale ? groupData.female : groupData.male;
        const pts = pointsMap.get(p.rank) || 0;

        let score = targetMap.get(p.athleteId);
        if (!score) {
          score = {
            athleteId: p.athleteId,
            athleteNumber: p.athleteNumber,
            athleteName: p.athleteName,
            schoolName: p.schoolName,
            gender: isFemale ? 'female' : 'male',
            ageGroup: ku,
            gold: 0,
            silver: 0,
            bronze: 0,
            points: 0,
            eventCount: 0,
            bestTimeMs: p.timeMs,
            bestEventName: `${ev.distance_meters}m ${ev.stroke}`,
          };
          targetMap.set(p.athleteId, score);
        }

        if (p.rank === 1) score.gold += 1;
        else if (p.rank === 2) score.silver += 1;
        else if (p.rank === 3) score.bronze += 1;

        score.points += pts;
        score.eventCount += 1;

        if (p.timeMs && (!score.bestTimeMs || p.timeMs < score.bestTimeMs)) {
          score.bestTimeMs = p.timeMs;
          score.bestEventName = `${ev.distance_meters}m ${ev.stroke}`;
        }
      });
    });

    const compareSwimmers = (a: BestSwimmerScore, b: BestSwimmerScore) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gold !== a.gold) return b.gold - a.gold;
      if (b.silver !== a.silver) return b.silver - a.silver;
      if (b.bronze !== a.bronze) return b.bronze - a.bronze;
      return a.athleteName.localeCompare(b.athleteName);
    };

    const results: Array<{
      ageGroup: string;
      maleBest: BestSwimmerScore | null;
      maleStandings: BestSwimmerScore[];
      femaleBest: BestSwimmerScore | null;
      femaleStandings: BestSwimmerScore[];
    }> = [];

    ageGroupMap.forEach((g, ku) => {
      const maleList = Array.from(g.male.values()).sort(compareSwimmers);
      const femaleList = Array.from(g.female.values()).sort(compareSwimmers);

      results.push({
        ageGroup: ku,
        maleBest: maleList[0] || null,
        maleStandings: maleList,
        femaleBest: femaleList[0] || null,
        femaleStandings: femaleList,
      });
    });

    return results.sort((a, b) => a.ageGroup.localeCompare(b.ageGroup));
  }, [processedEvents, pointsMap]);

  // Filter peserta pada acara yang dipilih
  const filteredParticipants = useMemo(() => {
    if (!currentCompEvent) return [];
    let list = currentCompEvent.participants;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.athleteName.toLowerCase().includes(q) ||
          p.schoolName.toLowerCase().includes(q) ||
          p.athleteNumber.toLowerCase().includes(q)
      );
    }
    return list;
  }, [currentCompEvent, searchQuery]);

  // Kelompokkan per Seri (Heat)
  const heatGroups = useMemo(() => {
    if (!currentCompEvent) return [];
    const map = new Map<number, RankedAthleteItem[]>();
    currentCompEvent.participants.forEach((p) => {
      const arr = map.get(p.heatNumber) || [];
      arr.push(p);
      map.set(p.heatNumber, arr);
    });

    return Array.from(map.entries())
      .sort(([hA], [hB]) => hA - hB)
      .map(([heatNumber, lanes]) => {
        const sortedLanes = [...lanes].sort((a, b) => a.laneNumber - b.laneNumber);
        const heatFinished = sortedLanes.every((l) => l.status === 'finished');
        return {
          heatNumber,
          isFinished: heatFinished,
          lanes: sortedLanes,
        };
      });
  }, [currentCompEvent]);

  // Acara yang difilter per Kategori Umur
  const eventsByAgeGroup = useMemo(() => {
    if (selectedAgeGroup === 'ALL') return processedEvents;
    return processedEvents.filter((ev) => ev.ageGroup === selectedAgeGroup);
  }, [processedEvents, selectedAgeGroup]);

  // Top 3 Podium untuk Acara Terpilih
  const podiumTop3 = useMemo(() => {
    if (!currentCompEvent) return { gold: null, silver: null, bronze: null };
    const p = currentCompEvent.participants;
    return {
      gold: p.find((x) => x.rank === 1 && x.status === 'finished') || null,
      silver: p.find((x) => x.rank === 2 && x.status === 'finished') || null,
      bronze: p.find((x) => x.rank === 3 && x.status === 'finished') || null,
    };
  }, [currentCompEvent]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Print Stylesheet Tanpa Border Tebal & Tanpa Watermark */}
      <style jsx global>{`
        @media print {
          aside,
          header,
          nav,
          .no-print,
          footer,
          .breadcrumb-container {
            display: none !important;
          }

          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }

          body,
          html {
            background: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #rankings-print-area {
            display: block !important;
            width: 100% !important;
          }

          #rankings-print-area div,
          #rankings-print-area .rounded-2xl,
          #rankings-print-area .rounded-xl {
            border: none !important;
            box-shadow: none !important;
          }

          .print-page-break {
            page-break-after: always !important;
            break-after: page !important;
          }

          table {
            border-collapse: collapse !important;
          }
        }
      `}</style>

      {/* Control Bar & Navigasi Tab (No Print) */}
      <Card className="no-print border-slate-200 shadow-xs">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              Perangkingan & Hasil Resmi Kejuaraan
            </h3>
            <p className="text-xs text-muted-foreground">
              Klasemen hasil perlombaan renang per acara, per seri, per kategori umur, dan Best Swimmer.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {events.length > 1 && (
              <Select
                value={currentEvent?.id}
                onValueChange={(val) => {
                  window.location.assign(`/rankings?event=${val}`);
                }}
              >
                <SelectTrigger className="h-9 text-xs w-[200px]">
                  <SelectValue placeholder="Pilih Kejuaraan" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button onClick={handlePrint} className="gap-2 text-xs font-bold h-9">
              <Printer className="h-4 w-4" /> Cetak Hasil / PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 4 TAB UTAMA PERANGKINGAN */}
      <div className="no-print flex items-center justify-between border-b border-slate-200 pb-2 overflow-x-auto gap-2">
        <div className="inline-flex rounded-xl bg-slate-100 p-1 text-slate-600">
          <button
            onClick={() => setActiveTab('event')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all',
              activeTab === 'event'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'hover:text-slate-900 text-slate-600'
            )}
          >
            <ListOrdered className="h-4 w-4 text-blue-600" /> Per Acara
          </button>

          <button
            onClick={() => setActiveTab('heat')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all',
              activeTab === 'heat'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'hover:text-slate-900 text-slate-600'
            )}
          >
            <Layers className="h-4 w-4 text-emerald-600" /> Per Seri
          </button>

          <button
            onClick={() => setActiveTab('age_group')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all',
              activeTab === 'age_group'
                ? 'bg-white text-blue-900 shadow-xs'
                : 'hover:text-slate-900 text-slate-600'
            )}
          >
            <Users className="h-4 w-4 text-purple-600" /> Per Kategori Umur (KU)
          </button>

          <button
            onClick={() => setActiveTab('best_swimmer')}
            className={cn(
              'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all',
              activeTab === 'best_swimmer'
                ? 'bg-white text-amber-900 shadow-xs'
                : 'hover:text-slate-900 text-slate-600'
            )}
          >
            <Crown className="h-4 w-4 text-amber-500" /> Best Swimmer per KU
          </button>
        </div>

        <div className="text-xs font-semibold text-slate-500">
          {compEvents.length} Acara Terdaftar
        </div>
      </div>

      {/* KONTEN UTAMA */}
      <div id="rankings-print-area" className="space-y-6">
        {/* =================================================================== */}
        {/* TAB 1: PER ACARA                                                    */}
        {/* =================================================================== */}
        {activeTab === 'event' && (
          <div className="space-y-6">
            {/* Selector Nomor Acara & Pencarian */}
            <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase text-slate-500 block">
                  Pilih Acara Lomba (Sesuai Buku Acara)
                </label>
                <select
                  value={selectedCompEventId}
                  onChange={(e) => setSelectedCompEventId(e.target.value)}
                  className="w-full sm:min-w-[340px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-xs focus:ring-2 focus:ring-blue-500/20"
                >
                  {processedEvents.map((ce) => (
                    <option key={ce.id} value={ce.id}>
                      Acara #{ce.order_no || '—'}: {ce.name} · {ce.ageGroup} · ({ce.gender === 'female' ? 'Putri' : 'Putra'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="w-full sm:w-64">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Cari atlet / sekolah..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-9 text-xs pl-8"
                  />
                </div>
              </div>
            </div>

            {currentCompEvent && (
              <div className="space-y-6">
                {/* Header Acara */}
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-600 text-white font-bold text-xs">
                        ACARA #{currentCompEvent.order_no || '—'}
                      </Badge>
                      <Badge variant="outline" className="text-xs font-semibold">
                        Kategori: {currentCompEvent.ageGroup}
                      </Badge>
                      <Badge variant="secondary" className="text-xs font-bold">
                        {currentCompEvent.gender === 'female' ? 'Putri' : 'Putra'}
                      </Badge>
                    </div>
                    <h2 className="text-xl font-black text-slate-900 mt-2 uppercase">
                      {currentCompEvent.name}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Jarak: {currentCompEvent.distance_meters}m · Gaya: {currentCompEvent.stroke} · Format: Time Final
                    </p>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-center">
                    <div className="p-2.5 px-3 rounded-lg border border-slate-200 bg-slate-50">
                      <span className="block text-[10px] text-slate-500 font-sans font-semibold">Peserta</span>
                      <span className="text-base font-bold text-slate-900">{currentCompEvent.participants.length}</span>
                    </div>
                    <div className="p-2.5 px-3 rounded-lg border border-slate-200 bg-slate-50">
                      <span className="block text-[10px] text-slate-500 font-sans font-semibold">Seri</span>
                      <span className="text-base font-bold text-blue-600">{heatGroups.length}</span>
                    </div>
                  </div>
                </div>

                {/* PODIUM TOP 3 (EMAS, PERAK, PERUNGGU) */}
                {podiumTop3.gold && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Juara 2: Perak */}
                    <div className="order-2 sm:order-1 rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-slate-100 p-4 flex flex-col justify-between shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="h-8 w-8 rounded-lg bg-slate-300 text-slate-800 font-black text-sm flex items-center justify-center">
                          2
                        </span>
                        <Badge variant="outline" className="border-slate-300 text-[10px] font-bold">
                          🥈 Medali Perak
                        </Badge>
                      </div>
                      <div className="my-3">
                        <h4 className="font-bold text-sm text-slate-900 truncate">
                          {podiumTop3.silver?.athleteName || '—'}
                        </h4>
                        <p className="text-xs text-slate-500 truncate">{podiumTop3.silver?.schoolName || '—'}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-slate-500">
                          Seri {podiumTop3.silver?.heatNumber} · Lin {podiumTop3.silver?.laneNumber}
                        </span>
                        <span className="font-mono font-bold text-slate-800 text-sm">
                          {podiumTop3.silver?.timeMs ? formatMsToTime(podiumTop3.silver.timeMs) : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Juara 1: Emas (Tengah & Menonjol) */}
                    <div className="order-1 sm:order-2 rounded-2xl border-2 border-amber-400 bg-gradient-to-b from-amber-50 to-amber-100/60 p-4 flex flex-col justify-between shadow-sm sm:-mt-2">
                      <div className="flex items-center justify-between">
                        <span className="h-9 w-9 rounded-lg bg-amber-400 text-amber-950 font-black text-base flex items-center justify-center shadow-xs">
                          <Crown className="h-5 w-5 text-amber-950" />
                        </span>
                        <Badge className="bg-amber-500 text-amber-950 font-black text-[10px]">
                          🥇 MEDALI EMAS
                        </Badge>
                      </div>
                      <div className="my-3">
                        <h4 className="font-black text-base text-amber-950 truncate">
                          {podiumTop3.gold.athleteName}
                        </h4>
                        <p className="text-xs font-semibold text-amber-800/80 truncate">
                          {podiumTop3.gold.schoolName}
                        </p>
                      </div>
                      <div className="pt-2 border-t border-amber-200 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-amber-800">
                          Seri {podiumTop3.gold.heatNumber} · Lin {podiumTop3.gold.laneNumber}
                        </span>
                        <span className="font-mono font-black text-amber-950 text-base">
                          {podiumTop3.gold.timeMs ? formatMsToTime(podiumTop3.gold.timeMs) : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Juara 3: Perunggu */}
                    <div className="order-3 rounded-2xl border border-slate-200 bg-gradient-to-b from-orange-50 to-orange-100/60 p-4 flex flex-col justify-between shadow-xs">
                      <div className="flex items-center justify-between">
                        <span className="h-8 w-8 rounded-lg bg-orange-300 text-orange-950 font-black text-sm flex items-center justify-center">
                          3
                        </span>
                        <Badge variant="outline" className="border-orange-300 text-[10px] font-bold text-orange-800">
                          🥉 Medali Perunggu
                        </Badge>
                      </div>
                      <div className="my-3">
                        <h4 className="font-bold text-sm text-slate-900 truncate">
                          {podiumTop3.bronze?.athleteName || '—'}
                        </h4>
                        <p className="text-xs text-slate-500 truncate">{podiumTop3.bronze?.schoolName || '—'}</p>
                      </div>
                      <div className="pt-2 border-t border-orange-200 flex items-center justify-between text-xs">
                        <span className="text-[10px] text-orange-700">
                          Seri {podiumTop3.bronze?.heatNumber} · Lin {podiumTop3.bronze?.laneNumber}
                        </span>
                        <span className="font-mono font-bold text-slate-800 text-sm">
                          {podiumTop3.bronze?.timeMs ? formatMsToTime(podiumTop3.bronze.timeMs) : '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* TABEL KLASEMEN LENGKAP TIME FINAL */}
                <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                  <div className="bg-slate-900 px-4 py-3 text-white flex items-center justify-between text-xs">
                    <span className="font-bold flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-amber-400" />
                      Klasemen Peringkat Resmi Time Final (Lintas Seri)
                    </span>
                    <span className="font-mono text-cyan-300 text-[11px]">
                      {filteredParticipants.filter((p) => p.status === 'finished').length} Finis
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b bg-slate-50 text-slate-600 text-[11px]">
                          <th className="p-2.5 w-14 text-center font-bold">Peringkat</th>
                          <th className="p-2.5 w-20 text-center font-semibold">Seri/Lin</th>
                          <th className="p-2.5 font-bold">Nama Atlet</th>
                          <th className="p-2.5 font-semibold">Kontingen / Sekolah</th>
                          <th className="p-2.5 text-right font-semibold w-24">Seed Time</th>
                          <th className="p-2.5 text-right font-bold w-28">Waktu Akhir</th>
                          <th className="p-2.5 text-right font-semibold w-20">Selisih</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filteredParticipants.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-slate-400">
                              Tidak ada atlet yang cocok dengan kriteria pencarian.
                            </td>
                          </tr>
                        ) : (
                          filteredParticipants.map((p) => {
                            const isFin = p.status === 'finished';
                            const rankBadgeClass =
                              p.rank === 1
                                ? 'bg-amber-400 text-amber-950 font-black'
                                : p.rank === 2
                                ? 'bg-slate-300 text-slate-900 font-bold'
                                : p.rank === 3
                                ? 'bg-orange-300 text-orange-950 font-bold'
                                : 'bg-slate-100 text-slate-700 font-medium';

                            return (
                              <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                                <td className="p-2.5 text-center">
                                  {isFin && p.rank ? (
                                    <span
                                      className={cn(
                                        'inline-flex h-6 w-6 items-center justify-center rounded-md text-xs',
                                        rankBadgeClass
                                      )}
                                    >
                                      {p.rank}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400 text-xs">—</span>
                                  )}
                                </td>
                                <td className="p-2.5 text-center font-mono text-[11px] text-slate-600">
                                  H{p.heatNumber} / L{p.laneNumber}
                                </td>
                                <td className="p-2.5">
                                  <div className="font-bold text-slate-900">{p.athleteName}</div>
                                  {p.athleteNumber && p.athleteNumber !== '—' && (
                                    <span className="text-[10px] text-slate-400 font-mono">#{p.athleteNumber}</span>
                                  )}
                                </td>
                                <td className="p-2.5 text-slate-600">{p.schoolName}</td>
                                <td className="p-2.5 text-right font-mono text-slate-500">
                                  {p.seedTimeMs ? formatMsToTime(p.seedTimeMs) : 'NT'}
                                </td>
                                <td className="p-2.5 text-right font-mono font-black text-slate-900 text-sm">
                                  {isFin && p.timeMs ? (
                                    formatMsToTime(p.timeMs)
                                  ) : (
                                    <Badge variant="outline" className="text-[10px] uppercase font-mono">
                                      {STATUS_LABELS[p.status] || p.status || 'BELUM FINIS'}
                                    </Badge>
                                  )}
                                </td>
                                <td className="p-2.5 text-right font-mono text-[11px] text-slate-500">
                                  {isFin && p.gapMs && p.gapMs > 0 ? `+${(p.gapMs / 1000).toFixed(2)}s` : isFin ? '—' : ''}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 2: PER SERI                                                     */}
        {/* =================================================================== */}
        {activeTab === 'heat' && (
          <div className="space-y-6">
            {/* Selector Nomor Acara */}
            <div className="no-print flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-white shadow-xs">
              <div className="space-y-1 w-full sm:w-auto">
                <label className="text-[11px] font-bold uppercase text-slate-500 block">
                  Pilih Acara untuk Melihat Hasil Per Seri
                </label>
                <select
                  value={selectedCompEventId}
                  onChange={(e) => setSelectedCompEventId(e.target.value)}
                  className="w-full sm:min-w-[340px] rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 shadow-xs focus:ring-2 focus:ring-blue-500/20"
                >
                  {processedEvents.map((ce) => (
                    <option key={ce.id} value={ce.id}>
                      Acara #{ce.order_no || '—'}: {ce.name} · {ce.ageGroup} · ({ce.gender === 'female' ? 'Putri' : 'Putra'})
                    </option>
                  ))}
                </select>
              </div>

              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-slate-700 block">
                  {currentCompEvent?.name}
                </span>
                <span className="text-[11px] text-slate-500">
                  Total {heatGroups.length} Seri
                </span>
              </div>
            </div>

            {/* DAFTAR KARTU SERI (HEAT 1, HEAT 2, ...) */}
            <div className="space-y-6">
              {heatGroups.length === 0 ? (
                <div className="p-12 text-center text-slate-400 rounded-xl border border-dashed">
                  Belum ada pembagian seri untuk nomor lomba ini.
                </div>
              ) : (
                heatGroups.map((hg) => (
                  <div key={hg.heatNumber} className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="bg-slate-900 px-4 py-2.5 text-white flex items-center justify-between text-xs">
                      <span className="font-bold flex items-center gap-2">
                        <Layers className="h-4 w-4 text-emerald-400" />
                        SERI #{hg.heatNumber} — ACARA #{currentCompEvent?.order_no || '—'}: {currentCompEvent?.name.toUpperCase()}
                      </span>
                      <span className="font-mono text-[11px] text-emerald-300">
                        {hg.isFinished ? '✓ Selesai' : 'Siap / Berjalan'}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b bg-slate-50 text-slate-600 text-[11px]">
                            <th className="p-2 w-16 text-center font-bold">Lintasan</th>
                            <th className="p-2 w-20 text-center font-bold">Rank Seri</th>
                            <th className="p-2 font-bold">Nama Atlet</th>
                            <th className="p-2 font-semibold">Kontingen / Sekolah</th>
                            <th className="p-2 text-right font-semibold w-24">Seed Time</th>
                            <th className="p-2 text-right font-bold w-28">Waktu Seri</th>
                            <th className="p-2 text-center font-semibold w-24">Rank Acara</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {hg.lanes.map((lane) => {
                            const isFin = lane.status === 'finished';
                            return (
                              <tr key={lane.id} className="hover:bg-slate-50/70">
                                <td className="p-2 text-center font-mono font-bold text-slate-800">
                                  {lane.laneNumber}
                                </td>
                                <td className="p-2 text-center font-bold">
                                  {isFin && lane.heatRank ? (
                                    <span
                                      className={cn(
                                        'inline-flex h-5 w-5 items-center justify-center rounded text-[11px]',
                                        lane.heatRank === 1
                                          ? 'bg-amber-400 text-amber-950 font-black'
                                          : lane.heatRank === 2
                                          ? 'bg-slate-300 text-slate-900 font-bold'
                                          : lane.heatRank === 3
                                          ? 'bg-orange-300 text-orange-950 font-bold'
                                          : 'bg-slate-100 text-slate-600'
                                      )}
                                    >
                                      {lane.heatRank}
                                    </span>
                                  ) : (
                                    '—'
                                  )}
                                </td>
                                <td className="p-2 font-bold text-slate-900">
                                  {lane.athleteName}
                                </td>
                                <td className="p-2 text-slate-600">{lane.schoolName}</td>
                                <td className="p-2 text-right font-mono text-slate-500">
                                  {lane.seedTimeMs ? formatMsToTime(lane.seedTimeMs) : 'NT'}
                                </td>
                                <td className="p-2 text-right font-mono font-bold text-slate-900 text-sm">
                                  {isFin && lane.timeMs ? (
                                    formatMsToTime(lane.timeMs)
                                  ) : (
                                    <span className="text-[10px] text-slate-400 uppercase">
                                      {STATUS_LABELS[lane.status] || lane.status || '—'}
                                    </span>
                                  )}
                                </td>
                                <td className="p-2 text-center font-mono text-[11px] text-slate-600">
                                  {isFin && lane.rank ? `#${lane.rank}` : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 3: PER KATEGORI UMUR (KU)                                       */}
        {/* =================================================================== */}
        {activeTab === 'age_group' && (
          <div className="space-y-6">
            {/* Filter Pill Kategori Umur (Menyesuaikan Buku Acara) */}
            <div className="no-print p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5 text-purple-600" /> Filter Kategori Umur Sesuai Buku Acara:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAgeGroup('ALL')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                    selectedAgeGroup === 'ALL'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  )}
                >
                  Semua Kategori ({processedEvents.length} Acara)
                </button>
                {availableAgeGroups.map((ku) => {
                  const count = processedEvents.filter((e) => e.ageGroup === ku).length;
                  return (
                    <button
                      key={ku}
                      type="button"
                      onClick={() => setSelectedAgeGroup(ku)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                        selectedAgeGroup === 'ku' || selectedAgeGroup === ku
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      )}
                    >
                      {ku} ({count} Acara)
                    </button>
                  );
                })}
              </div>
            </div>

            {/* DAFTAR NOMOR LOMBA PER KATEGORI UMUR */}
            <div className="space-y-6">
              {eventsByAgeGroup.length === 0 ? (
                <div className="p-12 text-center text-slate-400 rounded-xl border border-dashed">
                  Tidak ada nomor lomba untuk kategori umur ini.
                </div>
              ) : (
                eventsByAgeGroup.map((evItem) => (
                  <div key={evItem.id} className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                    <div className="bg-slate-900 px-4 py-2.5 text-white flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-purple-600 text-white text-[10px] font-bold">
                          {evItem.ageGroup}
                        </Badge>
                        <span className="font-bold">
                          ACARA #{evItem.order_no || '—'}: {evItem.name.toUpperCase()} ({evItem.gender === 'female' ? 'PUTRI' : 'PUTRA'})
                        </span>
                      </div>
                      <span className="font-mono text-xs text-purple-300">
                        {evItem.participants.filter((p) => p.status === 'finished').length} Atlet Finis
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b bg-slate-50 text-slate-600 text-[11px]">
                            <th className="p-2 w-14 text-center font-bold">Rank</th>
                            <th className="p-2 font-bold">Nama Atlet</th>
                            <th className="p-2 font-semibold">Kontingen / Sekolah</th>
                            <th className="p-2 text-center font-semibold w-20">Seri/Lin</th>
                            <th className="p-2 text-right font-bold w-28">Waktu Finis</th>
                            <th className="p-2 text-right font-semibold w-20">FINA Pts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {evItem.participants.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-slate-400">
                                Belum ada data peserta.
                              </td>
                            </tr>
                          ) : (
                            evItem.participants.map((p) => {
                              const isFin = p.status === 'finished';
                              return (
                                <tr key={p.id} className="hover:bg-slate-50/70">
                                  <td className="p-2 text-center font-bold">
                                    {isFin && p.rank ? (
                                      <span
                                        className={cn(
                                          'inline-flex h-5 w-5 items-center justify-center rounded text-[11px]',
                                          p.rank === 1
                                            ? 'bg-amber-400 text-amber-950 font-black'
                                            : p.rank === 2
                                            ? 'bg-slate-300 text-slate-900 font-bold'
                                            : p.rank === 3
                                            ? 'bg-orange-300 text-orange-950 font-bold'
                                            : 'bg-slate-100 text-slate-600'
                                        )}
                                      >
                                        {p.rank}
                                      </span>
                                    ) : (
                                      '—'
                                    )}
                                  </td>
                                  <td className="p-2 font-bold text-slate-900">
                                    {p.athleteName}
                                  </td>
                                  <td className="p-2 text-slate-600">{p.schoolName}</td>
                                  <td className="p-2 text-center font-mono text-[11px] text-slate-500">
                                    H{p.heatNumber}/L{p.laneNumber}
                                  </td>
                                  <td className="p-2 text-right font-mono font-bold text-slate-900">
                                    {isFin && p.timeMs ? (
                                      formatMsToTime(p.timeMs)
                                    ) : (
                                      <span className="text-[10px] text-slate-400 uppercase">
                                        {STATUS_LABELS[p.status] || p.status || '—'}
                                      </span>
                                    )}
                                  </td>
                                  <td className="p-2 text-right font-mono text-[11px] text-purple-700 font-semibold">
                                    {p.finaPoints ? `${p.finaPoints} pts` : '—'}
                                  </td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* TAB 4: BEST SWIMMER PER KATEGORI UMUR                               */}
        {/* =================================================================== */}
        {activeTab === 'best_swimmer' && (
          <div className="space-y-8">
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 text-xs text-amber-900 space-y-1">
              <h4 className="font-bold flex items-center gap-1.5 text-sm text-amber-950">
                <Crown className="h-4 w-4 text-amber-600" /> Penentuan Perenang Terbaik (Best Swimmer)
              </h4>
              <p className="text-amber-800">
                Best Swimmer ditentukan berdasarkan perolehan medali (Emas, Perak, Perunggu) dan akumulasi poin kejuaraan pada masing-masing Kategori Umur (KU) yang terdaftar di Buku Acara.
              </p>
            </div>

            {bestSwimmersByAgeGroup.length === 0 ? (
              <div className="p-12 text-center text-slate-400 rounded-xl border border-dashed">
                Belum ada hasil perlombaan yang finis untuk penentuan Best Swimmer.
              </div>
            ) : (
              bestSwimmersByAgeGroup.map((group) => (
                <div key={group.ageGroup} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
                  {/* Header Kategori Umur */}
                  <div className="flex items-center justify-between border-b pb-3">
                    <div className="flex items-center gap-2">
                      <span className="h-8 w-8 rounded-lg bg-amber-500 text-white font-black flex items-center justify-center">
                        <Crown className="h-4 w-4" />
                      </span>
                      <div>
                        <h3 className="text-base font-black text-slate-900 uppercase">
                          KATEGORI UMUR: {group.ageGroup}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          Perenang Terbaik Putra & Putri
                        </p>
                      </div>
                    </div>

                    <Badge className="bg-amber-100 text-amber-900 border-amber-300 font-bold text-xs">
                      Official Best Swimmer
                    </Badge>
                  </div>

                  {/* KARTU SHOWCASE BEST SWIMMER PUTRA & PUTRI */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Best Swimmer Putra */}
                    <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50/80 to-white p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-blue-600 text-white font-bold text-xs">
                          👑 BEST SWIMMER PUTRA
                        </Badge>
                        <span className="font-mono text-xs font-black text-blue-900">
                          {group.maleBest?.points ?? 0} Poin
                        </span>
                      </div>

                      {group.maleBest ? (
                        <div className="space-y-2">
                          <h4 className="font-black text-base text-slate-900">
                            {group.maleBest.athleteName}
                          </h4>
                          <p className="text-xs text-slate-600 font-semibold">
                            {group.maleBest.schoolName}
                          </p>

                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-blue-100 text-center font-mono">
                            <div className="bg-amber-100/70 p-1.5 rounded">
                              <span className="block text-[10px] text-amber-800 font-bold">🥇 EMAS</span>
                              <span className="font-black text-amber-950">{group.maleBest.gold}</span>
                            </div>
                            <div className="bg-slate-200/70 p-1.5 rounded">
                              <span className="block text-[10px] text-slate-700 font-bold">🥈 PERAK</span>
                              <span className="font-black text-slate-900">{group.maleBest.silver}</span>
                            </div>
                            <div className="bg-orange-100/70 p-1.5 rounded">
                              <span className="block text-[10px] text-orange-800 font-bold">🥉 PERUNGGU</span>
                              <span className="font-black text-orange-950">{group.maleBest.bronze}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 py-4 text-center">
                          Belum ada perenang putra yang finis di kategori ini.
                        </p>
                      )}
                    </div>

                    {/* Best Swimmer Putri */}
                    <div className="rounded-xl border-2 border-rose-200 bg-gradient-to-br from-rose-50/80 to-white p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <Badge className="bg-rose-600 text-white font-bold text-xs">
                          👑 BEST SWIMMER PUTRI
                        </Badge>
                        <span className="font-mono text-xs font-black text-rose-900">
                          {group.femaleBest?.points ?? 0} Poin
                        </span>
                      </div>

                      {group.femaleBest ? (
                        <div className="space-y-2">
                          <h4 className="font-black text-base text-slate-900">
                            {group.femaleBest.athleteName}
                          </h4>
                          <p className="text-xs text-slate-600 font-semibold">
                            {group.femaleBest.schoolName}
                          </p>

                          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-rose-100 text-center font-mono">
                            <div className="bg-amber-100/70 p-1.5 rounded">
                              <span className="block text-[10px] text-amber-800 font-bold">🥇 EMAS</span>
                              <span className="font-black text-amber-950">{group.femaleBest.gold}</span>
                            </div>
                            <div className="bg-slate-200/70 p-1.5 rounded">
                              <span className="block text-[10px] text-slate-700 font-bold">🥈 PERAK</span>
                              <span className="font-black text-slate-900">{group.femaleBest.silver}</span>
                            </div>
                            <div className="bg-orange-100/70 p-1.5 rounded">
                              <span className="block text-[10px] text-orange-800 font-bold">🥉 PERUNGGU</span>
                              <span className="font-black text-orange-950">{group.femaleBest.bronze}</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 py-4 text-center">
                          Belum ada perenang putri yang finis di kategori ini.
                        </p>
                      )}
                    </div>
                  </div>

                  {/* TABEL KLASEMEN ATLET DI KATEGORI UMUR INI */}
                  <div className="space-y-2">
                    <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Klasemen Poin Atlet ({group.ageGroup})
                    </h5>
                    <div className="overflow-x-auto rounded-xl border border-slate-200">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b bg-slate-50 text-slate-600 text-[11px]">
                            <th className="p-2 w-12 text-center font-bold">No</th>
                            <th className="p-2 font-bold">Nama Atlet</th>
                            <th className="p-2 font-semibold">Gender</th>
                            <th className="p-2 font-semibold">Kontingen / Sekolah</th>
                            <th className="p-2 text-center font-bold w-12 text-amber-600">🥇</th>
                            <th className="p-2 text-center font-bold w-12 text-slate-600">🥈</th>
                            <th className="p-2 text-center font-bold w-12 text-orange-600">🥉</th>
                            <th className="p-2 text-right font-black w-20">Total Poin</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {[...group.maleStandings, ...group.femaleStandings]
                            .sort((a, b) => b.points - a.points || b.gold - a.gold)
                            .map((s, idx) => (
                              <tr key={s.athleteId} className="hover:bg-slate-50">
                                <td className="p-2 text-center font-bold text-slate-700">{idx + 1}</td>
                                <td className="p-2 font-bold text-slate-900">{s.athleteName}</td>
                                <td className="p-2 text-slate-600">
                                  {s.gender === 'female' ? 'Putri' : 'Putra'}
                                </td>
                                <td className="p-2 text-slate-600">{s.schoolName}</td>
                                <td className="p-2 text-center font-mono font-bold text-amber-700">{s.gold}</td>
                                <td className="p-2 text-center font-mono font-bold text-slate-700">{s.silver}</td>
                                <td className="p-2 text-center font-mono font-bold text-orange-700">{s.bronze}</td>
                                <td className="p-2 text-right font-mono font-black text-blue-900 text-sm">
                                  {s.points} pts
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
