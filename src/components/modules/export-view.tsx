'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Printer, Download, BookOpen, Layers, Timer, UserCheck, CheckSquare, Sparkles } from 'lucide-react';
import { exportToExcel, printPage } from '@/lib/utils/export';
import { formatMsToTime, cn } from '@/lib/utils';

interface HeatAssignmentRow {
  heat_number: number;
  lane_number: number;
  registrations?: {
    seed_time_ms?: number | null;
    athletes?: { full_name?: string | null; schools?: { name?: string | null } | null } | null;
  } | null;
}

export interface ExportCompEvent {
  id: string;
  order_no?: number | null;
  name?: string | null;
  gender?: string | null;
  age_group?: string | null;
  heat_assignments?: HeatAssignmentRow[] | null;
}

interface ExportViewProps {
  events: { id: string; name: string }[];
  initialEventId: string;
  exportData: ExportCompEvent[];
  showEventSelector?: boolean;
  poolLaneCount?: number;
}

export function ExportView({
  events,
  initialEventId,
  exportData,
  showEventSelector = false,
  poolLaneCount = 8,
}: ExportViewProps) {
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [viewMode, setViewMode] = useState<'buku_acara' | 'wasit'>('buku_acara');
  const [selectedLane, setSelectedLane] = useState<string>('all');

  useEffect(() => {
    if (initialEventId) {
      setSelectedEventId(initialEventId);
    }
  }, [initialEventId]);

  const handleEventChange = (val: string) => {
    setSelectedEventId(val);
    router.push(`/export?eventId=${val}`, { scroll: false });
  };

  const activeEventName = events.find((e) => e.id === selectedEventId)?.name || 'Kejuaraan Renang';

  // Deteksi jumlah lintasan maksimal yang digunakan di kejuaraan (misal 6 lintasan, 8 lintasan, s/d 12)
  const maxLaneUsed = useMemo(() => {
    let maxL = poolLaneCount || 6;
    exportData.forEach((ce) => {
      ce.heat_assignments?.forEach((ha) => {
        if (ha.lane_number && ha.lane_number > maxL) {
          maxL = ha.lane_number;
        }
      });
    });
    return Math.min(Math.max(maxL, 6), 12);
  }, [exportData, poolLaneCount]);

  const availableLanes = useMemo(() => {
    return Array.from({ length: maxLaneUsed }, (_, i) => i + 1);
  }, [maxLaneUsed]);

  // Ambil baris lomba khusus untuk lintasan tertentu
  const getLaneEntries = (laneNum: number) => {
    const entries: Array<{
      compOrderNo: number | string;
      compName: string;
      gender: string;
      ageGroup: string;
      heatNumber: number;
      laneNumber: number;
      athleteName: string;
      schoolName: string;
      seedTimeMs: number | null | undefined;
    }> = [];

    exportData.forEach((ce) => {
      const matchingAssigns = (ce.heat_assignments || [])
        .filter((ha) => ha.lane_number === laneNum)
        .sort((a, b) => a.heat_number - b.heat_number);

      matchingAssigns.forEach((ha) => {
        entries.push({
          compOrderNo: ce.order_no ?? '-',
          compName: ce.name || '-',
          gender: ce.gender || '-',
          ageGroup: ce.age_group || '-',
          heatNumber: ha.heat_number,
          laneNumber: ha.lane_number,
          athleteName: ha.registrations?.athletes?.full_name || '-',
          schoolName: ha.registrations?.athletes?.schools?.name || 'Perorangan',
          seedTimeMs: ha.registrations?.seed_time_ms,
        });
      });
    });

    return entries;
  };

  // Format data untuk ekspor Excel Buku Acara Lengkap
  const handleExportExcel = async () => {
    const flatRows: Record<string, string | number>[] = [];

    exportData.forEach((ce) => {
      ce.heat_assignments?.forEach((ha) => {
        flatRows.push({
          'No Acara': ce.order_no != null ? String(ce.order_no) : '-',
          'Nomor Lomba': ce.name || '-',
          Kategori: `${ce.gender || '-'} - ${ce.age_group || '-'}`,
          Acara: ha.heat_number,
          Lintasan: ha.lane_number,
          'Nama Atlet': ha.registrations?.athletes?.full_name || '-',
          'Klub / Sekolah': ha.registrations?.athletes?.schools?.name || 'Perorangan',
          'Waktu Entry': formatMsToTime(ha.registrations?.seed_time_ms),
        });
      });
    });

    await exportToExcel(flatRows, `Buku_Acara_${activeEventName.replace(/\s+/g, '_')}`);
  };

  // Format data untuk ekspor Excel Lembar Wasit / Timekeeper
  const handleExportExcelWasit = async () => {
    const flatRows: Record<string, string | number>[] = [];
    const lanesToExport = selectedLane === 'all' ? availableLanes : [Number(selectedLane)];

    lanesToExport.forEach((lNum) => {
      const entries = getLaneEntries(lNum);
      entries.forEach((e) => {
        flatRows.push({
          'Wasit / Timer': `Wasit Lintasan ${lNum}`,
          Lintasan: lNum,
          'No Acara': String(e.compOrderNo),
          'Nomor Lomba': e.compName,
          Seri: e.heatNumber,
          'Nama Atlet': e.athleteName,
          'Sekolah / Klub': e.schoolName,
          'Seed Time': formatMsToTime(e.seedTimeMs),
          'Stopwatch 1': '',
          'Stopwatch 2': '',
          'Waktu Resmi': '',
          'Catatan / DQ': '',
        });
      });
    });

    await exportToExcel(
      flatRows,
      `Lembar_Wasit_${selectedLane === 'all' ? `Lintasan_1-${maxLaneUsed}` : `Lintasan_${selectedLane}`}_${activeEventName.replace(/\s+/g, '_')}`
    );
  };

  return (
    <div className="space-y-6">
      {/* Control Bar (Disembunyikan saat cetak PDF / Print) */}
      <div className="flex flex-col gap-4 bg-muted/40 p-4 rounded-2xl border print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {showEventSelector ? (
            <div className="w-full sm:w-72">
              <label className="text-xs font-semibold block mb-1">Pilih Kejuaraan / Event</label>
              <Select value={selectedEventId} onValueChange={handleEventChange}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Pilih Event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)] font-black">
                {viewMode === 'buku_acara' ? <BookOpen className="h-5 w-5" /> : <Timer className="h-5 w-5" />}
              </span>
              <div>
                <h3 className="font-heading font-bold text-sm text-[var(--m-ink)]">
                  {viewMode === 'buku_acara'
                    ? 'Susunan Seri & Lintasan Lomba (Buku Acara)'
                    : `Lembar Wasit / Timekeeper Lintasan (1 s/d ${maxLaneUsed})`}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {viewMode === 'buku_acara'
                    ? 'Lembar start list menyeluruh untuk seluruh nomor lomba, seri, dan lintasan.'
                    : `Format khusus wasit lintasan (Wasit 1 s/d ${maxLaneUsed}). Setiap wasit hanya mencatat atlet pada lintasannya.`}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons: Export & Cetak */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button
              variant="outline"
              onClick={viewMode === 'buku_acara' ? handleExportExcel : handleExportExcelWasit}
              className="gap-1.5 border-emerald-600 text-emerald-700 hover:bg-emerald-50 text-xs font-bold cursor-pointer"
            >
              <Download className="w-4 h-4" /> Export Excel (.xlsx)
            </Button>
            <Button
              onClick={printPage}
              className="gap-1.5 bg-primary hover:bg-primary/90 text-xs font-bold cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" /> Cetak / Save PDF
            </Button>
          </div>
        </div>

        {/* ── Sub-Bar: Mode Toggle & Filter Wasit ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-slate-200/80">
          <div className="flex items-center gap-1.5 bg-slate-200/70 p-1 rounded-xl w-fit">
            <button
              type="button"
              onClick={() => setViewMode('buku_acara')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'buku_acara'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <BookOpen className="h-3.5 w-3.5" /> Buku Acara Lengkap
            </button>
            <button
              type="button"
              onClick={() => setViewMode('wasit')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5',
                viewMode === 'wasit'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Timer className="h-3.5 w-3.5" /> Lembar Wasit / Timekeeper
            </button>
          </div>

          {/* Opsi Pilihan Wasit (Hanya muncul jika mode Lembar Wasit aktif) */}
          {viewMode === 'wasit' && (
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                Pilih Wasit:
              </label>
              <Select value={selectedLane} onValueChange={setSelectedLane}>
                <SelectTrigger className="w-64 h-9 text-xs font-bold bg-white rounded-xl shadow-2xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs font-bold text-blue-700">
                    ⭐ Semua Wasit (Wasit 1 s/d Wasit {maxLaneUsed})
                  </SelectItem>
                  {availableLanes.map((laneNum) => (
                    <SelectItem key={laneNum} value={String(laneNum)} className="text-xs">
                      Wasit {laneNum} (Khusus Lintasan {laneNum})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      {/* ── TAMPILAN 1: BUKU ACARA LENGKAP (A4 Printer Friendly) ── */}
      {viewMode === 'buku_acara' && (
        <div className="space-y-8 print:space-y-6">
          {exportData.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground print:hidden rounded-2xl">
              Belum ada data susunan acara/lintasan untuk diekspor. Pastikan Anda telah menjalankan <b>Auto-Acara Generator</b>.
            </Card>
          ) : (
            exportData.map((ce) => (
              <div
                key={ce.id}
                className="bg-background border p-6 rounded-2xl print:border-black print:p-0 print:rounded-none break-inside-avoid print:break-inside-avoid"
              >
                <div className="border-b-2 border-primary pb-2 mb-4 flex justify-between items-baseline print:border-black">
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-slate-900">
                      ACARA {ce.order_no != null ? ce.order_no : '-'}: {ce.name?.toUpperCase()}
                    </h2>
                    <p className="text-xs text-muted-foreground font-semibold print:text-black">
                      Kategori: {ce.gender} | Kelompok Umur: {ce.age_group}
                    </p>
                  </div>
                </div>

                {/* Tabel Acara & Lintasan */}
                <table className="w-full text-sm text-left border-collapse border border-slate-300 print:border-black">
                  <thead>
                    <tr className="bg-muted/50 print:bg-slate-100">
                      <th className="border border-slate-300 print:border-black px-3 py-1.5 text-center w-12 font-bold">
                        Acara
                      </th>
                      <th className="border border-slate-300 print:border-black px-3 py-1.5 text-center w-16 font-bold">
                        Ltsn
                      </th>
                      <th className="border border-slate-300 print:border-black px-3 py-1.5 font-bold">
                        Nama Atlet
                      </th>
                      <th className="border border-slate-300 print:border-black px-3 py-1.5 font-bold">
                        Sekolah / Klub
                      </th>
                      <th className="border border-slate-300 print:border-black px-3 py-1.5 text-center w-28 font-bold">
                        Seed Time
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ce.heat_assignments && ce.heat_assignments.length > 0 ? (
                      [...ce.heat_assignments]
                        .sort((a, b) => a.heat_number - b.heat_number || a.lane_number - b.lane_number)
                        .map((ha, idx: number) => (
                          <tr key={idx} className="hover:bg-muted/20">
                            <td className="border border-slate-300 print:border-black px-3 py-1 text-center font-bold">
                              {ha.heat_number}
                            </td>
                            <td className="border border-slate-300 print:border-black px-3 py-1 text-center font-semibold">
                              {ha.lane_number}
                            </td>
                            <td className="border border-slate-300 print:border-black px-3 py-1 font-medium">
                              {ha.registrations?.athletes?.full_name || '-'}
                            </td>
                            <td className="border border-slate-300 print:border-black px-3 py-1 text-muted-foreground print:text-black">
                              {ha.registrations?.athletes?.schools?.name || 'Perorangan'}
                            </td>
                            <td className="border border-slate-300 print:border-black px-3 py-1 text-center font-mono text-xs">
                              {formatMsToTime(ha.registrations?.seed_time_ms)}
                            </td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="text-center py-2 text-xs text-muted-foreground border border-slate-300">
                          Belum ada susunan lintasan
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── TAMPILAN 2: LEMBAR WASIT / TIMEKEEPER (PER LINTASAN 1 S/D 12) ── */}
      {viewMode === 'wasit' && (
        <div className="space-y-8 print:space-y-0">
          {(selectedLane === 'all' ? availableLanes : [Number(selectedLane)]).map((laneNum, wasitIdx, arr) => {
            const entries = getLaneEntries(laneNum);
            const isLast = wasitIdx === arr.length - 1;

            return (
              <div
                key={laneNum}
                className={cn(
                  'bg-background border p-6 rounded-2xl print:border-black print:p-0 print:rounded-none shadow-xs',
                  !isLast ? 'print:break-after-page mb-8 print:mb-0 print:pb-8' : ''
                )}
              >
                {/* Header Lembar Wasit Lintasan Resmi */}
                <div className="border-b-2 border-slate-900 pb-3 mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 print:border-black">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-600 text-white font-black text-xs px-3 py-1 rounded-md uppercase tracking-wider print:bg-black print:text-white">
                        Wasit Lintasan {laneNum}
                      </span>
                      <span className="text-xs font-bold text-slate-700 print:text-black">
                        {activeEventName}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 mt-1.5">
                      LEMBAR PENCATAT WAKTU (TIMER SLIP) — LINTASAN {laneNum}
                    </h2>
                    <p className="text-xs text-slate-600 print:text-black font-medium">
                      Khusus mencatat atlet pada <b>Lintasan {laneNum}</b> untuk seluruh Acara &amp; Seri perlombaan.
                    </p>
                  </div>

                  <div className="text-right text-xs font-mono font-bold text-slate-800 print:text-black border border-slate-300 print:border-black p-2.5 rounded-xl bg-slate-50 print:bg-white min-w-[220px]">
                    <div>Petugas: Wasit Lintasan {laneNum}</div>
                    <div className="text-[11px] font-sans font-normal text-slate-600 mt-1">
                      Nama Petugas: ____________________
                    </div>
                  </div>
                </div>

                {/* Tabel Lembar Catatan Waktu Wasit */}
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse border border-slate-300 print:border-black">
                    <thead>
                      <tr className="bg-slate-100 print:bg-slate-200 text-slate-900 font-bold">
                        <th className="border border-slate-300 print:border-black px-2 py-2 text-center w-12">
                          Acara
                        </th>
                        <th className="border border-slate-300 print:border-black px-2 py-2">
                          Nomor Lomba
                        </th>
                        <th className="border border-slate-300 print:border-black px-2 py-2 text-center w-12">
                          Seri
                        </th>
                        <th className="border border-slate-300 print:border-black px-2 py-2 text-center w-12 bg-blue-100/80 font-black">
                          Ltsn
                        </th>
                        <th className="border border-slate-300 print:border-black px-3 py-2 min-w-[150px]">
                          Nama Atlet
                        </th>
                        <th className="border border-slate-300 print:border-black px-3 py-2 min-w-[130px]">
                          Sekolah / Klub
                        </th>
                        <th className="border border-slate-300 print:border-black px-2 py-2 text-center w-20">
                          Seed Time
                        </th>
                        <th className="border border-slate-300 print:border-black px-2 py-2 text-center w-24 bg-amber-50/70 font-bold">
                          Stopwatch 1
                        </th>
                        <th className="border border-slate-300 print:border-black px-2 py-2 text-center w-24 bg-amber-50/70 font-bold">
                          Stopwatch 2
                        </th>
                        <th className="border border-slate-300 print:border-black px-2 py-2 text-center w-28 bg-emerald-50/70 font-black">
                          Waktu Resmi
                        </th>
                        <th className="border border-slate-300 print:border-black px-2 py-2 text-center w-24">
                          Paraf / DQ
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {entries.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="text-center py-4 text-xs text-muted-foreground border border-slate-300">
                            Tidak ada jadwal perenang di Lintasan {laneNum}
                          </td>
                        </tr>
                      ) : (
                        entries.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/70">
                            <td className="border border-slate-300 print:border-black px-2 py-2 text-center font-bold">
                              {item.compOrderNo}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2 py-2 font-semibold">
                              {item.compName}
                              <span className="text-[10px] block text-slate-500 font-normal">
                                {item.gender === 'female' ? 'Putri' : 'Putra'} · {item.ageGroup}
                              </span>
                            </td>
                            <td className="border border-slate-300 print:border-black px-2 py-2 text-center font-bold">
                              {item.heatNumber}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2 py-2 text-center font-black bg-blue-50/60">
                              {item.laneNumber}
                            </td>
                            <td className="border border-slate-300 print:border-black px-3 py-2 font-bold text-slate-900">
                              {item.athleteName}
                            </td>
                            <td className="border border-slate-300 print:border-black px-3 py-2 text-slate-600">
                              {item.schoolName}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2 py-2 text-center font-mono">
                              {formatMsToTime(item.seedTimeMs)}
                            </td>
                            <td className="border border-slate-300 print:border-black px-2 py-2 text-center bg-amber-50/30"></td>
                            <td className="border border-slate-300 print:border-black px-2 py-2 text-center bg-amber-50/30"></td>
                            <td className="border border-slate-300 print:border-black px-2 py-2 text-center bg-emerald-50/30 font-mono font-bold"></td>
                            <td className="border border-slate-300 print:border-black px-2 py-2 text-center"></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Tanda Tangan & Verifikasi Wasit Lintasan */}
                <div className="mt-6 pt-4 border-t border-slate-200 print:border-black flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs">
                  <div>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Lembar resmi Rajendra Swim System · Standar Kejuaraan Akuatik Nasional
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Wasit wajib memeriksa nomor lintasan dan mencatat hasil stopwatch secara presisi.
                    </p>
                  </div>
                  <div className="text-center min-w-[200px] self-end sm:self-auto">
                    <p className="text-[11px] font-semibold text-slate-700">Tanda Tangan Wasit Lintasan {laneNum}</p>
                    <div className="h-12"></div>
                    <p className="border-t border-slate-400 font-bold text-slate-900 pt-1">
                      ( _______________________ )
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
