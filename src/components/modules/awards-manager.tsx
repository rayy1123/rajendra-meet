'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Building2,
  School,
  User,
  Users,
  Medal,
  Award,
  Sparkles,
  HelpCircle,
  Printer,
  ChevronDown,
  ChevronUp,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Info,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { type PointRule, type StandingRow } from '@/services/points';
import { type BestSwimmerGroup } from '@/services/records';
import { cn } from '@/lib/utils';

export interface EventOption {
  id: string;
  name: string;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
}

export interface AwardsManagerProps {
  event: EventOption | null;
  eventsList: EventOption[];
  rules: PointRule[];
  overall: StandingRow[];
  byGrade: StandingRow[];
  byClass: StandingRow[];
  bestSwimmers: BestSwimmerGroup[];
  schoolNameMap: Record<string, string>;
  totalEntriesScored: number;
  totalCompEventsScored: number;
}

export function AwardsManager({
  event,
  eventsList,
  rules,
  overall,
  byGrade,
  byClass,
  bestSwimmers,
  schoolNameMap,
  totalEntriesScored,
  totalCompEventsScored,
}: AwardsManagerProps) {
  const [activeTab, setActiveTab] = useState<'overall' | 'grade' | 'class' | 'swimmer'>('overall');
  const [showGuide, setShowGuide] = useState(true);

  // Filters
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [classFilter, setClassFilter] = useState<string>('all');
  const [swimmerGenderFilter, setSwimmerGenderFilter] = useState<string>('all');
  const [swimmerGradeFilter, setSwimmerGradeFilter] = useState<string>('all');

  const getSchoolName = (schoolId: string | null) => {
    if (!schoolId) return 'Umum / Perorangan';
    return schoolNameMap[schoolId] || 'Umum / Perorangan';
  };

  const handlePrint = () => {
    window.print();
  };

  // Format Helper for Group Keys
  const formatGroupKey = (group: BestSwimmerGroup) => {
    const rawKey = group.group_key || '';
    if (!rawKey || rawKey.includes('undefined')) {
      const g = group.grade_level || '';
      const c = group.class_name || '';
      const gen = group.gender === 'female' ? 'Putri' : 'Putra';
      return `${g} ${c} (${gen})`.trim() || 'Kategori Umum';
    }

    const [classPart, genderPart] = rawKey.split('/');
    const cleanClass = (classPart || '').trim();
    const cleanGender = (genderPart || '').trim().toLowerCase();
    const genderLabel =
      cleanGender === 'female' || cleanGender === 'putri'
        ? 'Putri'
        : cleanGender === 'male' || cleanGender === 'putra'
        ? 'Putra'
        : '';

    return `${cleanClass} ${genderLabel ? `(${genderLabel})` : ''}`.trim();
  };

  // Parsing scope from key: "SD::schoolId" -> scope: "SD"
  const parseRowKey = (key: string, schoolId: string | null) => {
    if (!key.includes('::')) return { scope: 'Umum', schoolId };
    const parts = key.split('::');
    return { scope: parts[0] || 'Umum', schoolId: parts[1] || schoolId };
  };

  // Grade options for filter
  const gradeOptions = useMemo(() => {
    const set = new Set<string>();
    byGrade.forEach((r) => {
      const { scope } = parseRowKey(r.key, r.school_id);
      if (scope) set.add(scope);
    });
    return Array.from(set).sort();
  }, [byGrade]);

  // Class options for filter
  const classOptions = useMemo(() => {
    const set = new Set<string>();
    byClass.forEach((r) => {
      const { scope } = parseRowKey(r.key, r.school_id);
      if (scope) set.add(scope);
    });
    return Array.from(set).sort();
  }, [byClass]);

  // Filtered rows for Grade
  const filteredGradeRows = useMemo(() => {
    if (gradeFilter === 'all') return byGrade;
    return byGrade.filter((r) => {
      const { scope } = parseRowKey(r.key, r.school_id);
      return scope === gradeFilter;
    });
  }, [byGrade, gradeFilter]);

  // Filtered rows for Class
  const filteredClassRows = useMemo(() => {
    if (classFilter === 'all') return byClass;
    return byClass.filter((r) => {
      const { scope } = parseRowKey(r.key, r.school_id);
      return scope === classFilter;
    });
  }, [byClass, classFilter]);

  // Filtered Best Swimmers
  const filteredBestSwimmers = useMemo(() => {
    return bestSwimmers.filter((g) => {
      const matchGender =
        swimmerGenderFilter === 'all' ||
        g.gender?.toLowerCase() === swimmerGenderFilter.toLowerCase();
      const matchGrade =
        swimmerGradeFilter === 'all' ||
        g.grade_level?.toLowerCase() === swimmerGradeFilter.toLowerCase();
      return matchGender && matchGrade;
    });
  }, [bestSwimmers, swimmerGenderFilter, swimmerGradeFilter]);

  // Top 1 Overall Champion
  const topOverall = overall[0];

  return (
    <div className="space-y-6">
      {/* ── Toolbar Atas: Event Selector, Print, dan Panduan Toggle ── */}
      <div className="no-print rounded-2xl border border-[var(--m-border)] bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)] font-black text-sm">
                <Trophy className="h-4 w-4" />
              </span>
              <h2 className="font-heading font-black text-lg text-[var(--m-ink)]">
                Indikator Penghargaan & Klasemen Resmi
              </h2>
            </div>
            <p className="text-xs text-[var(--m-muted)] mt-1">
              Perhitungan poin otomatis untuk Juara Umum Kontingen, Pemenang per Tingkat & Kelas, serta Perenang Terbaik (Best Swimmer).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowGuide((prev) => !prev)}
              className="gap-1.5 text-xs font-semibold border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              {showGuide ? 'Sembunyikan Panduan' : 'Lihat Panduan Indikator'}
            </Button>
            <Button
              size="sm"
              onClick={handlePrint}
              className="gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
            >
              <Printer className="h-3.5 w-3.5" />
              Cetak Rekap Hasil (PDF)
            </Button>
          </div>
        </div>

        {/* Filter Kejuaraan */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="font-bold text-slate-700 shrink-0 flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-primary" /> Kejuaraan:
            </span>
            <Select
              value={event?.id || 'all'}
              onValueChange={(val) => {
                if (val === 'all') {
                  window.location.assign('/awards');
                } else {
                  window.location.assign(`/awards?eventId=${val}`);
                }
              }}
            >
              <SelectTrigger className="h-9 w-full sm:w-[280px] text-xs font-bold text-slate-900 bg-slate-50">
                <SelectValue placeholder="Pilih Kejuaraan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">⭐ Seluruh Kejuaraan (Akumulasi)</SelectItem>
                {eventsList.map((e) => (
                  <SelectItem key={e.id} value={e.id} className="text-xs">
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted-foreground font-mono">
            <span>{totalCompEventsScored} Nomor Lomba Terhitung</span>
            <span>•</span>
            <span>{totalEntriesScored} Hasil Waktu</span>
          </div>
        </div>
      </div>

      {/* ── CARD PANDUAN INDIKATOR & SISTEM PENILAIAN PENGHARGAAN ── */}
      {showGuide && (
        <div className="no-print rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50/70 via-white to-indigo-50/50 p-5 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3 border-b border-blue-100 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-600 text-white font-black shadow-xs">
                <Info className="h-5 w-5" />
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-heading font-black text-sm text-blue-950 sm:text-base">
                    Panduan Indikator & Sistem Pembobotan Poin
                  </h3>
                  <Badge variant="outline" className="border-blue-300 bg-white text-blue-800 text-[10px] font-bold">
                    Standar FINA / Akuatik
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Pedoman resmi acuan panitia dalam membaca dan menentukan pemenang kejuaraan:
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="text-slate-400 hover:text-slate-600 p-1"
              title="Tutup panduan"
            >
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>

          {/* 4 Pilar Indikator */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 font-heading font-bold text-slate-900">
                <Building2 className="h-4 w-4 text-blue-600" />
                <span>1. Indikator Juara Umum</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Akumulasi seluruh poin yang diperoleh atlet per kontingen/sekolah. Peringkat #1 ditetapkan sebagai <b>Best Contingent (Juara Umum)</b>.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 font-heading font-bold text-slate-900">
                <School className="h-4 w-4 text-indigo-600" />
                <span>2. Indikator per Tingkat</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Akumulasi poin kontingen yang dipisahkan berdasarkan jenjang pendidikan atlet (TK, SD, SMP, SMA) untuk piala kategori jenjang.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 font-heading font-bold text-slate-900">
                <Users className="h-4 w-4 text-emerald-600" />
                <span>3. Indikator per Kelas</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Klasemen kontingen per kelas spesifik (SD Kelas 1–6, SMP 7–9, SMA 10–12) untuk mendeteksi dominasi pembinaan usia dini.
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs space-y-1">
              <div className="flex items-center gap-1.5 font-heading font-bold text-slate-900">
                <Award className="h-4 w-4 text-amber-500" />
                <span>4. Indikator Best Swimmer</span>
              </div>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Gelar atlet terbaik perorangan per kategori usia & gender berdasarkan perolehan poin dan medali emas terbanyak.
              </p>
            </div>
          </div>

          {/* Bobot Poin Resmi Standar */}
          <div className="pt-1">
            <span className="text-[11px] font-bold text-slate-700 block mb-2">
              Skema Bobot Poin Peringkat (8 Besar Lintasan):
            </span>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 text-center text-xs">
              {rules.map((r) => {
                const isGold = r.rank === 1;
                const isSilver = r.rank === 2;
                const isBronze = r.rank === 3;
                return (
                  <div
                    key={r.rank}
                    className={cn(
                      'p-2 rounded-xl border flex flex-col items-center justify-center transition-all',
                      isGold
                        ? 'border-amber-300 bg-amber-50/80 font-bold text-amber-950'
                        : isSilver
                        ? 'border-slate-300 bg-slate-50/90 font-bold text-slate-800'
                        : isBronze
                        ? 'border-orange-300 bg-orange-50/80 font-bold text-orange-950'
                        : 'border-slate-200 bg-white text-slate-700'
                    )}
                  >
                    <span className="text-[10px] text-muted-foreground uppercase font-mono">
                      {isGold ? '🥇 Juara 1' : isSilver ? '🥈 Juara 2' : isBronze ? '🥉 Juara 3' : `Rank ${r.rank}`}
                    </span>
                    <span className="font-heading font-black text-base mt-0.5">
                      {r.points} <span className="text-[10px] font-normal">Poin</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Kriteria Tie-Break */}
          <div className="p-3 bg-white/90 rounded-xl border border-blue-100 text-[11px] text-slate-700 flex items-start gap-2 leading-relaxed">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-slate-900">Aturan Penentuan Juara Seri (Tie-Break):</span>{' '}
              Apabila dua atlet/kontingen memiliki poin sama: diurutkan dari perolehan medali Emas terbanyak, lalu Perak, lalu Perunggu. Jika masih sama, diutamakan atlet dengan jumlah keikutsertaan nomor lomba lebih efisien atau usia termuda.
            </div>
          </div>
        </div>
      )}

      {/* ── KPI Summary Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Juara 1 Overall */}
        <div className="glass-panel p-5 border border-amber-200/80 bg-gradient-to-br from-amber-50/30 via-white to-white">
          <div className="flex items-center justify-between text-xs text-amber-700 font-bold uppercase tracking-wider">
            <span>Calon Juara Umum (#1)</span>
            <span>🥇</span>
          </div>
          <div className="mt-1 font-heading text-lg sm:text-xl font-black text-slate-950 truncate">
            {topOverall ? getSchoolName(topOverall.school_id) : '–'}
          </div>
          <p className="mt-1 text-xs text-slate-600 font-mono">
            {topOverall ? (
              <span className="font-bold text-amber-900">
                {topOverall.points} Poin · {topOverall.gold}🥇 {topOverall.silver}🥈 {topOverall.bronze}🥉
              </span>
            ) : (
              'Belum ada hasil lomba'
            )}
          </p>
        </div>

        {/* Total Kontingen */}
        <div className="glass-panel p-5 border border-slate-200">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Total Kontingen Bersaing
          </div>
          <div className="mt-1 font-heading text-2xl sm:text-3xl font-black text-[var(--m-ink)]">
            {overall.length} <span className="text-xs font-normal text-muted-foreground">Klub / Sekolah</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Kontingen yang telah mengumpulkan poin
          </p>
        </div>

        {/* Total Nomor Lomba Selesai */}
        <div className="glass-panel p-5 border border-slate-200">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Nomor Lomba Terhitung
          </div>
          <div className="mt-1 font-heading text-2xl sm:text-3xl font-black text-[var(--m-ink)]">
            {totalCompEventsScored} <span className="text-xs font-normal text-muted-foreground">Acara</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {totalEntriesScored} catatan waktu resmi terekam
          </p>
        </div>

        {/* Kategori Best Swimmer */}
        <div className="glass-panel p-5 border border-slate-200">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Gelar Best Swimmer
          </div>
          <div className="mt-1 font-heading text-2xl sm:text-3xl font-black text-[var(--m-ink)]">
            {bestSwimmers.length} <span className="text-xs font-normal text-muted-foreground">Kategori</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Kelompok usia putra & putri
          </p>
        </div>
      </div>

      {/* ── TAB NAVIGASI UTAMA ── */}
      <div className="rounded-2xl border border-[var(--m-border)] bg-white p-6 shadow-xs space-y-5">
        <div className="no-print flex flex-wrap items-center gap-2 border-b border-slate-100 pb-4">
          <button
            type="button"
            onClick={() => setActiveTab('overall')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
              activeTab === 'overall'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            )}
          >
            <Building2 className="h-4 w-4" />
            <span>Klasemen Overall (Juara Umum)</span>
            <Badge variant="secondary" className={cn('text-[10px] ml-1 px-1.5 py-0', activeTab === 'overall' ? 'bg-white text-blue-900' : '')}>
              {overall.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('grade')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
              activeTab === 'grade'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            )}
          >
            <School className="h-4 w-4" />
            <span>Per Tingkat (SD / SMP / SMA)</span>
            <Badge variant="secondary" className={cn('text-[10px] ml-1 px-1.5 py-0', activeTab === 'grade' ? 'bg-white text-indigo-900' : '')}>
              {byGrade.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('class')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
              activeTab === 'class'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            )}
          >
            <Users className="h-4 w-4" />
            <span>Per Kelas Spesifik</span>
            <Badge variant="secondary" className={cn('text-[10px] ml-1 px-1.5 py-0', activeTab === 'class' ? 'bg-white text-emerald-900' : '')}>
              {byClass.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('swimmer')}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer',
              activeTab === 'swimmer'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200'
            )}
          >
            <Award className="h-4 w-4" />
            <span>Best Swimmer (Perenang Terbaik)</span>
            <Badge variant="secondary" className={cn('text-[10px] ml-1 px-1.5 py-0', activeTab === 'swimmer' ? 'bg-white text-amber-900' : '')}>
              {bestSwimmers.length}
            </Badge>
          </button>
        </div>

        {/* ── TAB 1: KLASEMEN OVERALL (JUARA UMUM) ── */}
        {activeTab === 'overall' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-heading font-black text-base text-slate-900">
                  Klasemen Juara Umum Kontingen (Overall Standings)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Indikator peringkat utama seluruh sekolah / perkumpulan renang berdasarkan total akumulasi poin di kejuaraan ini.
                </p>
              </div>
            </div>

            {overall.length === 0 ? (
              <EmptyState
                icon={<Building2 className="h-8 w-8 text-primary" />}
                title="Belum ada data klasemen overall"
                description="Hasil nomor lomba belum diinput atau belum ada peserta yang menyelesaikan perlombaan."
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <Table>
                  <TableHeader className="bg-slate-50/90 text-xs font-bold uppercase">
                    <TableRow>
                      <TableHead className="w-16 text-center">Peringkat</TableHead>
                      <TableHead>Nama Sekolah / Klub</TableHead>
                      <TableHead className="w-28 text-center">Poin Total</TableHead>
                      <TableHead className="w-20 text-center font-mono">Emas 🥇</TableHead>
                      <TableHead className="w-20 text-center font-mono">Perak 🥈</TableHead>
                      <TableHead className="w-20 text-center font-mono">Perunggu 🥉</TableHead>
                      <TableHead className="w-24 text-center">Total Medali</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 text-xs">
                    {overall.map((row, idx) => {
                      const isTop1 = idx === 0;
                      const isTop2 = idx === 1;
                      const isTop3 = idx === 2;
                      const totalMedals = row.gold + row.silver + row.bronze;

                      return (
                        <TableRow
                          key={row.key}
                          className={cn(
                            'hover:bg-slate-50/80 transition-colors',
                            isTop1 ? 'bg-amber-50/40 font-semibold' : ''
                          )}
                        >
                          <TableCell className="text-center font-mono font-bold">
                            {isTop1 ? (
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-amber-950 font-black text-xs shadow-2xs">
                                1
                              </span>
                            ) : isTop2 ? (
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-300 text-slate-900 font-black text-xs">
                                2
                              </span>
                            ) : isTop3 ? (
                              <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-orange-300 text-orange-950 font-black text-xs">
                                3
                              </span>
                            ) : (
                              <span className="text-slate-500 font-bold">{idx + 1}</span>
                            )}
                          </TableCell>
                          <TableCell className="font-bold text-sm text-slate-950">
                            {getSchoolName(row.school_id)}
                            {isTop1 && (
                              <Badge className="ml-2 bg-amber-500 text-white font-bold text-[10px] px-2 py-0">
                                🏆 Juara Umum
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center font-mono font-black text-base text-blue-700">
                            {row.points}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-amber-700">
                            {row.gold}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-slate-700">
                            {row.silver}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-orange-700">
                            {row.bronze}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-slate-900">
                            {totalMedals}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: KLASEMEN PER TINGKAT (SD/SMP/SMA) ── */}
        {activeTab === 'grade' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading font-black text-base text-slate-900">
                  Klasemen Kontingen per Tingkat Pendidikan
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Indikator perolehan poin sekolah/klub yang dikelompokkan berdasarkan jenjang pendidikan atlet.
                </p>
              </div>

              {gradeOptions.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Filter Tingkat:</span>
                  <Select value={gradeFilter} onValueChange={setGradeFilter}>
                    <SelectTrigger className="h-8 text-xs w-[140px]">
                      <SelectValue placeholder="Semua Tingkat" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Tingkat</SelectItem>
                      {gradeOptions.map((g) => (
                        <SelectItem key={g} value={g}>
                          Tingkat {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {filteredGradeRows.length === 0 ? (
              <EmptyState
                icon={<School className="h-8 w-8 text-primary" />}
                title="Belum ada data per tingkat"
                description="Belum ada perolehan poin untuk filter tingkat yang dipilih."
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <Table>
                  <TableHeader className="bg-slate-50/90 text-xs font-bold uppercase">
                    <TableRow>
                      <TableHead className="w-16 text-center">#</TableHead>
                      <TableHead className="w-32">Jenjang / Tingkat</TableHead>
                      <TableHead>Nama Sekolah / Klub</TableHead>
                      <TableHead className="w-28 text-center">Poin</TableHead>
                      <TableHead className="w-20 text-center font-mono">Emas</TableHead>
                      <TableHead className="w-20 text-center font-mono">Perak</TableHead>
                      <TableHead className="w-20 text-center font-mono">Perunggu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 text-xs">
                    {filteredGradeRows.map((row, idx) => {
                      const { scope } = parseRowKey(row.key, row.school_id);
                      return (
                        <TableRow key={row.key} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="text-center font-mono font-bold text-slate-500">
                            {idx + 1}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-indigo-50 text-indigo-900 border-indigo-200 font-bold text-xs">
                              {scope || '–'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-xs text-slate-950">
                            {getSchoolName(row.school_id)}
                          </TableCell>
                          <TableCell className="text-center font-mono font-black text-sm text-indigo-700">
                            {row.points}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-amber-700">
                            {row.gold}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-slate-700">
                            {row.silver}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-orange-700">
                            {row.bronze}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: KLASEMEN PER KELAS ── */}
        {activeTab === 'class' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading font-black text-base text-slate-900">
                  Klasemen Kontingen per Kelas Spesifik
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Indikator perolehan poin kontingen yang difilter spesifik per kelas atlet (misal SD Kelas 1–6, SMP 7–9).
                </p>
              </div>

              {classOptions.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Filter Kelas:</span>
                  <Select value={classFilter} onValueChange={setClassFilter}>
                    <SelectTrigger className="h-8 text-xs w-[160px]">
                      <SelectValue placeholder="Semua Kelas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Semua Kelas</SelectItem>
                      {classOptions.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {filteredClassRows.length === 0 ? (
              <EmptyState
                icon={<Users className="h-8 w-8 text-primary" />}
                title="Belum ada data per kelas"
                description="Belum ada perolehan poin untuk filter kelas yang dipilih."
              />
            ) : (
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <Table>
                  <TableHeader className="bg-slate-50/90 text-xs font-bold uppercase">
                    <TableRow>
                      <TableHead className="w-16 text-center">#</TableHead>
                      <TableHead className="w-36">Kelas Spesifik</TableHead>
                      <TableHead>Nama Sekolah / Klub</TableHead>
                      <TableHead className="w-28 text-center">Poin</TableHead>
                      <TableHead className="w-20 text-center font-mono">Emas</TableHead>
                      <TableHead className="w-20 text-center font-mono">Perak</TableHead>
                      <TableHead className="w-20 text-center font-mono">Perunggu</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 text-xs">
                    {filteredClassRows.map((row, idx) => {
                      const { scope } = parseRowKey(row.key, row.school_id);
                      return (
                        <TableRow key={row.key} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="text-center font-mono font-bold text-slate-500">
                            {idx + 1}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-emerald-50 text-emerald-900 border-emerald-200 font-bold text-xs">
                              {scope || '–'}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-bold text-xs text-slate-950">
                            {getSchoolName(row.school_id)}
                          </TableCell>
                          <TableCell className="text-center font-mono font-black text-sm text-emerald-700">
                            {row.points}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-amber-700">
                            {row.gold}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-slate-700">
                            {row.silver}
                          </TableCell>
                          <TableCell className="text-center font-mono font-bold text-orange-700">
                            {row.bronze}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: BEST SWIMMER (PERENANG TERBAIK) ── */}
        {activeTab === 'swimmer' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading font-black text-base text-slate-900 flex items-center gap-2">
                  <Award className="h-5 w-5 text-amber-500" />
                  Gelar Perenang Terbaik (Best Swimmer)
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Daftar perenang terbaik putra dan putri per kelompok usia / kelas berdasarkan perolehan medali emas dan poin tertinggi.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Filter Gender */}
                <Select value={swimmerGenderFilter} onValueChange={setSwimmerGenderFilter}>
                  <SelectTrigger className="h-8 text-xs w-[120px]">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Gender</SelectItem>
                    <SelectItem value="male">Putra</SelectItem>
                    <SelectItem value="female">Putri</SelectItem>
                  </SelectContent>
                </Select>

                {/* Filter Jenjang */}
                <Select value={swimmerGradeFilter} onValueChange={setSwimmerGradeFilter}>
                  <SelectTrigger className="h-8 text-xs w-[130px]">
                    <SelectValue placeholder="Jenjang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Semua Jenjang</SelectItem>
                    <SelectItem value="TK">TK / PAUD</SelectItem>
                    <SelectItem value="SD">SD</SelectItem>
                    <SelectItem value="SMP">SMP</SelectItem>
                    <SelectItem value="SMA">SMA</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {filteredBestSwimmers.length === 0 ? (
              <EmptyState
                icon={<Award className="h-8 w-8 text-amber-500" />}
                title="Belum ada perenang terbaik"
                description="Belum ada data perenang yang memenuhi kualifikasi poin untuk kategori yang dipilih."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBestSwimmers.map((group) => {
                  const titleLabel = formatGroupKey(group);
                  const winner = group.winner;
                  const isTied = group.tied;

                  return (
                    <div
                      key={group.group_key}
                      className={cn(
                        'rounded-2xl border p-5 shadow-xs transition-all flex flex-col justify-between',
                        isTied
                          ? 'border-amber-300 bg-amber-50/30'
                          : 'border-slate-200 bg-white hover:border-amber-300 hover:shadow-sm'
                      )}
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 text-amber-800 text-xs font-black">
                              ★
                            </span>
                            <h4 className="font-heading font-black text-sm text-slate-900">
                              {titleLabel}
                            </h4>
                          </div>

                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] font-bold uppercase tracking-wider',
                              group.gender === 'female'
                                ? 'bg-rose-50 text-rose-800 border-rose-200'
                                : 'bg-blue-50 text-blue-800 border-blue-200'
                            )}
                          >
                            {group.gender === 'female' ? 'Putri' : 'Putra'}
                          </Badge>
                        </div>

                        {isTied ? (
                          <div className="space-y-2 py-2">
                            <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
                              <AlertTriangle className="h-4 w-4 shrink-0" />
                              <span>Hasil Seri di Puncak (Dead Heat / Poin Sama)</span>
                            </div>
                            <p className="text-[11px] text-slate-600 leading-relaxed">
                              Atlet berikut memiliki akumulasi poin dan medali yang sama. Panitia menentukan pemenang melalui catatan waktu terbaik atau usia termuda:
                            </p>
                            <div className="space-y-1.5 pt-1">
                              {group.contenders.map((c) => (
                                <div
                                  key={c.athlete_id}
                                  className="p-2 rounded-lg bg-white border border-amber-200 flex items-center justify-between text-xs"
                                >
                                  <div>
                                    <span className="font-bold text-slate-900">{c.athlete_name}</span>
                                    <span className="text-[11px] text-slate-500 block">
                                      {getSchoolName(c.school_id)}
                                    </span>
                                  </div>
                                  <div className="text-right font-mono font-bold text-amber-900">
                                    {c.points} Poin ({c.gold}🥇 {c.silver}🥈 {c.bronze}🥉)
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : winner ? (
                          <div className="flex items-start gap-3.5 py-1">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 to-amber-500 text-white font-black text-lg shadow-sm">
                              👑
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-heading font-black text-base text-slate-950 truncate">
                                  {winner.athlete_name}
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 truncate font-semibold">
                                {getSchoolName(winner.school_id)}
                              </p>
                              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                                <span className="font-heading font-black text-blue-700 font-mono text-sm bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                                  {winner.points} Poin
                                </span>
                                <span className="text-[11px] font-mono font-bold text-slate-700">
                                  {winner.gold}🥇 {winner.silver}🥈 {winner.bronze}🥉
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  ({winner.event_count} Nomor Diikuti)
                                </span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground italic py-3 text-center">
                            Belum ada atlet yang menyelesaikan nomor lomba pada kategori ini.
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
