'use client';

import { useState, useMemo, useRef } from 'react';
import {
  Trophy,
  Medal,
  Award,
  Crown,
  Search,
  Printer,
  Sparkles,
  School,
  Building2,
  TrendingUp,
  Layers,
  ArrowUpDown,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { printElement } from '@/lib/utils/print-helper';
import { cn } from '@/lib/utils';

export interface MedalRowItem {
  id?: string;
  name: string;
  gold: number;
  silver: number;
  bronze: number;
  total: number;
}

interface MedalTallyViewProps {
  eventName: string;
  eventDate?: string;
  eventLocation?: string;
  rows: MedalRowItem[];
}

export function MedalTallyView({
  eventName,
  eventDate,
  eventLocation,
  rows,
}: MedalTallyViewProps) {
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'olympic' | 'total'>('olympic');
  const printAreaRef = useRef<HTMLDivElement>(null);

  // Sorting logic (Standar Olimpiade: Emas > Perak > Perunggu > Total)
  const sortedRows = useMemo(() => {
    const list = [...rows];
    if (sortBy === 'olympic') {
      list.sort((a, b) => {
        if (b.gold !== a.gold) return b.gold - a.gold;
        if (b.silver !== a.silver) return b.silver - a.silver;
        if (b.bronze !== a.bronze) return b.bronze - a.bronze;
        return b.total - a.total;
      });
    } else if (sortBy === 'total') {
      list.sort((a, b) => b.total - a.total || b.gold - a.gold || b.silver - a.silver);
    }
    return list;
  }, [rows, sortBy]);

  // Filter search
  const filteredRows = useMemo(() => {
    if (!search.trim()) return sortedRows;
    const q = search.toLowerCase();
    return sortedRows.filter((r) => r.name.toLowerCase().includes(q));
  }, [sortedRows, search]);

  // Podium (Top 3 dari list terurut)
  const first = sortedRows[0] || null;
  const second = sortedRows[1] || null;
  const third = sortedRows[2] || null;

  // Aggregate stats
  const totalGold = useMemo(() => rows.reduce((acc, curr) => acc + curr.gold, 0), [rows]);
  const totalSilver = useMemo(() => rows.reduce((acc, curr) => acc + curr.silver, 0), [rows]);
  const totalBronze = useMemo(() => rows.reduce((acc, curr) => acc + curr.bronze, 0), [rows]);
  const totalAllMedals = totalGold + totalSilver + totalBronze;

  const handlePrint = () => {
    if (printAreaRef.current) {
      printElement(printAreaRef.current, {
        title: `Klasemen-Medali-${eventName.replace(/\s+/g, '-')}`,
        isLandscape: false,
      });
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-8">
      {/* ── 1. PODIUM JUARA OLYMPIC STYLE (HANYA LAYAR, NO PRINT) ── */}
      {rows.length > 0 && (
        <div className="no-print space-y-4">
          <div className="text-center space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider text-amber-900 bg-amber-100 border border-amber-300">
              <Crown className="h-3.5 w-3.5 text-amber-600" /> PODIUM KLASEMEN UTAMA
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Tiga Kontingen Terbaik
            </h2>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Penetapan juara umum berdasarkan perolehan medali emas, perak, dan perunggu resmi kejuaraan.
            </p>
          </div>

          {/* Podium Grid 3-Card Interactive */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end pt-4 max-w-4xl mx-auto">
            {/* JUARA 2 (PERAK) - KIRI */}
            {second ? (
              <div className="order-2 sm:order-1 rounded-2xl border-2 border-slate-300 bg-gradient-to-b from-slate-50/90 via-white to-slate-100/80 p-5 shadow-sm text-center relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-slate-200/50 blur-xl pointer-events-none" />
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-200 to-slate-400 text-slate-900 shadow-xs font-mono font-black text-xl border border-white">
                  🥈
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 bg-slate-200/80 px-2.5 py-0.5 rounded-full">
                  JUARA II &bull; PERAK
                </span>
                <h3 className="font-heading font-black text-base text-slate-900 mt-2 line-clamp-1">
                  {second.name}
                </h3>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs font-mono font-bold">
                  <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                    {second.gold} 🥇
                  </span>
                  <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded border border-slate-300">
                    {second.silver} 🥈
                  </span>
                  <span className="bg-orange-100 text-orange-900 px-2 py-0.5 rounded border border-orange-300">
                    {second.bronze} 🥉
                  </span>
                </div>
                <div className="mt-3.5 pt-2.5 border-t border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                  <span>{second.total} Total Medali</span>
                </div>
              </div>
            ) : <div className="hidden sm:block" />}

            {/* JUARA 1 (EMAS) - TENGAH / TERTINGGI */}
            {first && (
              <div className="order-1 sm:order-2 rounded-3xl border-2 border-amber-400 bg-gradient-to-b from-amber-50/90 via-white to-amber-100/60 p-6 shadow-md text-center relative overflow-hidden transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg sm:-translate-y-2">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-400 via-amber-300 to-amber-500" />
                <div className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-amber-300/40 blur-2xl pointer-events-none" />

                <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-300 to-amber-500 text-white shadow-md font-mono font-black text-2xl ring-4 ring-amber-200/80">
                  👑
                </div>
                <span className="text-[11px] font-black uppercase tracking-widest text-amber-950 bg-amber-300/80 px-3 py-1 rounded-full shadow-2xs">
                  JUARA UMUM I &bull; EMAS
                </span>
                <h3 className="font-heading font-black text-lg sm:text-xl text-slate-950 mt-2.5 line-clamp-1">
                  {first.name}
                </h3>
                <div className="mt-3.5 flex items-center justify-center gap-2.5 text-xs font-mono font-bold">
                  <span className="bg-amber-400 text-amber-950 px-2.5 py-1 rounded-lg border border-amber-500 shadow-2xs">
                    {first.gold} 🥇
                  </span>
                  <span className="bg-slate-200 text-slate-900 px-2.5 py-1 rounded-lg border border-slate-300">
                    {first.silver} 🥈
                  </span>
                  <span className="bg-orange-200 text-orange-950 px-2.5 py-1 rounded-lg border border-orange-300">
                    {first.bronze} 🥉
                  </span>
                </div>
                <div className="mt-4 pt-3 border-t border-amber-200 flex items-center justify-center text-xs">
                  <span className="font-mono font-black text-slate-950 text-sm bg-amber-200/80 px-3.5 py-1 rounded-full">
                    {first.total} Total Medali
                  </span>
                </div>
              </div>
            )}

            {/* JUARA 3 (PERUNGGU) - KANAN */}
            {third ? (
              <div className="order-3 sm:order-3 rounded-2xl border-2 border-orange-300 bg-gradient-to-b from-orange-50/90 via-white to-orange-100/80 p-5 shadow-sm text-center relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <div className="absolute -left-6 -top-6 h-20 w-20 rounded-full bg-orange-200/50 blur-xl pointer-events-none" />
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-600 to-orange-700 text-white shadow-xs font-mono font-black text-xl border border-white">
                  🥉
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-orange-900 bg-orange-200/80 px-2.5 py-0.5 rounded-full">
                  JUARA III &bull; PERUNGGU
                </span>
                <h3 className="font-heading font-black text-base text-slate-900 mt-2 line-clamp-1">
                  {third.name}
                </h3>
                <div className="mt-3 flex items-center justify-center gap-2 text-xs font-mono font-bold">
                  <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded border border-amber-300">
                    {third.gold} 🥇
                  </span>
                  <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded border border-slate-300">
                    {third.silver} 🥈
                  </span>
                  <span className="bg-orange-200 text-orange-950 px-2 py-0.5 rounded border border-orange-300">
                    {third.bronze} 🥉
                  </span>
                </div>
                <div className="mt-3.5 pt-2.5 border-t border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700">
                  <span>{third.total} Total Medali</span>
                </div>
              </div>
            ) : <div className="hidden sm:block" />}
          </div>
        </div>
      )}

      {/* ── 2. STAT COUNTER BAR (HANYA LAYAR, NO PRINT) ── */}
      <div className="no-print grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Total Medali Terbit</span>
          <p className="text-xl sm:text-2xl font-black text-slate-900 font-mono mt-1">{totalAllMedals}</p>
          <span className="text-[11px] text-slate-400">Seluruh nomor acara</span>
        </div>
        <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800 block">Medali Emas 🥇</span>
          <p className="text-xl sm:text-2xl font-black text-amber-700 font-mono mt-1">{totalGold}</p>
          <span className="text-[11px] text-amber-800/80">Podium Pertama</span>
        </div>
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 block">Medali Perak 🥈</span>
          <p className="text-xl sm:text-2xl font-black text-slate-700 font-mono mt-1">{totalSilver}</p>
          <span className="text-[11px] text-slate-500">Podium Kedua</span>
        </div>
        <div className="p-4 rounded-2xl border border-orange-200 bg-orange-50/50 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-orange-800 block">Medali Perunggu 🥉</span>
          <p className="text-xl sm:text-2xl font-black text-orange-700 font-mono mt-1">{totalBronze}</p>
          <span className="text-[11px] text-orange-800/80">Podium Ketiga</span>
        </div>
      </div>

      {/* ── 3. TOOLBAR PENCARIAN, SORTING & TOMBOL CETAK ── */}
      <div className="no-print rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Cari nama klub / sekolah..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs h-9 rounded-xl bg-slate-50 border-slate-200"
          />
        </div>

        {/* Sorting Toggles */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end overflow-x-auto">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
            <button
              type="button"
              onClick={() => setSortBy('olympic')}
              className={cn(
                'px-3 py-1 rounded-lg transition-all cursor-pointer',
                sortBy === 'olympic'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Standar Emas (Olimpiade)
            </button>
            <button
              type="button"
              onClick={() => setSortBy('total')}
              className={cn(
                'px-3 py-1 rounded-lg transition-all cursor-pointer',
                sortBy === 'total'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              Total Medali
            </button>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handlePrint}
            className="rounded-xl h-9 px-3.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-2xs shrink-0"
          >
            <Printer className="h-3.5 w-3.5" /> Cetak Lembar Klasemen
          </Button>
        </div>
      </div>

      {/* ── 4. DOKUMEN CETAK & TABEL KLASEMEN RESMI ── */}
      <div
        ref={printAreaRef}
        className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-sm print:border-none print:shadow-none print:rounded-none"
      >
        {/* Printable Official Header (Dengan Logo Rajendra Swim System & Rajendra Organizer) */}
        <div className="only-print p-6 space-y-4">
          <div className="bg-[#1b2e4b] text-white p-5 rounded-xl flex items-center justify-between gap-4">
            {/* Logo Kiri: Rajendra Swim System */}
            <div className="flex items-center gap-2.5 shrink-0 text-left">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo.png"
                alt="Rajendra Swim System"
                className="h-10 w-auto object-contain bg-white/10 rounded-lg p-1 backdrop-blur-xs"
              />
              <div>
                <p className="font-heading font-black text-xs text-white uppercase tracking-tight">
                  Rajendra <span className="text-cyan-300">Swim System</span>
                </p>
                <p className="text-[9px] font-mono text-cyan-200 font-semibold uppercase">OFFICIAL MEDAL TALLY</p>
              </div>
            </div>

            {/* Info Tengah: Judul & Event */}
            <div className="text-center flex-1 px-2 space-y-0.5">
              <h1 className="text-base sm:text-lg font-black uppercase tracking-tight text-white">
                KLASEMEN PEROLEHAN MEDALI
              </h1>
              <p className="text-xs text-slate-200 font-bold">{eventName}</p>
              <p className="text-[11px] text-slate-300">
                {eventLocation ? `${eventLocation} · ` : ''}{eventDate || 'Musim 2026'}
              </p>
            </div>

            {/* Logo Kanan: Rajendra Swimming Organizer */}
            <div className="flex flex-col items-end gap-1 shrink-0 text-right">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/rajendra-organizer-logo.png"
                alt="Rajendra Swimming Organizer"
                className="h-8 w-auto max-w-[120px] object-contain bg-white/10 rounded-lg p-1 backdrop-blur-xs"
              />
              <span className="text-[9px] font-mono text-cyan-200 uppercase font-bold">
                HASIL RESMI TERVERIFIKASI
              </span>
            </div>
          </div>
        </div>

        {/* Tabel Data Klasemen */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-[#1b2e4b] text-white text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-3 w-14 text-center">Rank</th>
                <th className="py-3.5 px-4 font-bold">Kontingen / Klub / Sekolah</th>
                <th className="py-3.5 px-3 text-center w-24 text-amber-300">🥇 Emas</th>
                <th className="py-3.5 px-3 text-center w-24 text-slate-200">🥈 Perak</th>
                <th className="py-3.5 px-3 text-center w-24 text-orange-300">🥉 Perunggu</th>
                <th className="py-3.5 px-4 text-right w-28 font-bold">Total Medali</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                    Tidak ada kontingen atau sekolah yang cocok dengan pencarian &quot;{search}&quot;.
                  </td>
                </tr>
              ) : (
                filteredRows.map((item, idx) => {
                  const rank = idx + 1;

                  return (
                    <tr
                      key={item.name}
                      className={cn(
                        'transition-colors',
                        rank === 1
                          ? 'bg-amber-50/40 hover:bg-amber-50/70 font-bold'
                          : rank === 2
                          ? 'bg-slate-50/60 hover:bg-slate-50'
                          : rank === 3
                          ? 'bg-orange-50/30 hover:bg-orange-50/60'
                          : 'hover:bg-slate-50/70'
                      )}
                    >
                      <td className="py-3 px-3 text-center font-mono">
                        {rank === 1 ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-amber-950 font-black text-xs shadow-2xs">
                            1
                          </span>
                        ) : rank === 2 ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-300 text-slate-900 font-black text-xs shadow-2xs">
                            2
                          </span>
                        ) : rank === 3 ? (
                          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-orange-300 text-orange-950 font-black text-xs shadow-2xs">
                            3
                          </span>
                        ) : (
                          <span className="font-bold text-slate-600">#{rank}</span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <div
                            className={cn(
                              'h-7 w-7 rounded-lg flex items-center justify-center font-mono font-bold text-xs shrink-0',
                              rank === 1
                                ? 'bg-amber-200 text-amber-900'
                                : rank === 2
                                ? 'bg-slate-200 text-slate-800'
                                : rank === 3
                                ? 'bg-orange-200 text-orange-900'
                                : 'bg-slate-100 text-slate-600'
                            )}
                          >
                            {item.name.slice(0, 2).toUpperCase()}
                          </div>
                          <span className="font-bold text-slate-900 text-xs sm:text-sm truncate">
                            {item.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-amber-700 bg-amber-50/30">
                        {item.gold > 0 ? (
                          <span className="inline-block px-2.5 py-0.5 rounded bg-amber-100 text-amber-900 font-black">
                            {item.gold}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-slate-700 bg-slate-50/40">
                        {item.silver > 0 ? (
                          <span className="inline-block px-2.5 py-0.5 rounded bg-slate-200 text-slate-900 font-black">
                            {item.silver}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center font-mono font-bold text-orange-700 bg-orange-50/30">
                        {item.bronze > 0 ? (
                          <span className="inline-block px-2.5 py-0.5 rounded bg-orange-100 text-orange-900 font-black">
                            {item.bronze}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-black text-slate-950 text-sm">
                        {item.total}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Printable Clean Official Footer */}
        <div className="only-print px-6 py-4 border-t border-slate-200 flex items-center justify-between text-[10px] text-slate-500 font-mono">
          <span>© {new Date().getFullYear()} Rajendra Swim System &bull; Official Meet Platform</span>
          <span>Dicetak otomatis &bull; Status: Hasil Resmi Terverifikasi</span>
        </div>
      </div>
    </div>
  );
}
