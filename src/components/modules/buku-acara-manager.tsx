'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Printer,
  BookOpen,
  FileText,
  Sliders,
  RotateCcw,
  Check,
  Search,
  X,
  RefreshCw,
  Trophy,
  CheckCircle2,
  Medal,
  ArrowDownWideNarrow,
  Layers,
} from 'lucide-react';
import { toast } from 'sonner';
import { type SponsorItem, getCachedSponsors } from '@/lib/data/sponsors';
import { SponsorLogosStrip } from './sponsor-logos-strip';
import { formatMsToTime, cn } from '@/lib/utils';
import Link from 'next/link';

export interface BukuEventItem {
  id: string;
  orderNo?: number | null;
  name: string;
  stroke: string;
  distanceMeters: number;
  gender: string;
  heats: Array<{
    id: string;
    heatNumber: number;
    assignments: Array<{
      id?: string;
      laneNumber: number;
      athleteName: string;
      athleteNumber: string;
      schoolName: string;
      seedTimeMs: number | null;
      finalTimeMs?: number | null;
      resultStatus?: string | null;
    }>;
  }>;
}

export function BukuAcaraManager({
  event,
  eventsList,
  bukuEvents,
  sponsors,
}: {
  event: {
    id: string;
    name: string;
    organizer: string;
    location: string;
    startDate: string;
    endDate: string;
    poolType: string;
    poolLengthMeters: number;
    laneCount: number;
  } | null;
  eventsList: { id: string; name: string }[];
  bukuEvents: BukuEventItem[];
  sponsors: SponsorItem[];
}) {
  const [sponsorsList] = useState<SponsorItem[]>(() => getCachedSponsors(sponsors));

  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  // Hitung total hasil lomba yang sudah terekam di buku acara ini
  const totalResultsCount = useMemo(() => {
    return bukuEvents.reduce(
      (acc, e) =>
        acc +
        e.heats.reduce(
          (hAcc, h) =>
            hAcc +
            h.assignments.filter((a) => a.finalTimeMs && a.finalTimeMs > 0).length,
          0
        ),
      0
    );
  }, [bukuEvents]);

  const handleSyncResults = () => {
    setIsSyncing(true);
    router.refresh();
    setTimeout(() => {
      setIsSyncing(false);
      toast.success('Buku Acara berhasil disinkronkan dengan data hasil lomba terkini!');
    }, 600);
  };

  // State Pengaturan Halaman & Cetak Acara / Seri
  const [eventFilterMode, setEventFilterMode] = useState<'all' | 'count' | 'range'>('all');
  const [eventLimitCount, setEventLimitCount] = useState<number>(bukuEvents.length || 10);
  const [eventStartNo, setEventStartNo] = useState<number>(1);
  const [eventEndNo, setEventEndNo] = useState<number>(bukuEvents.length || 10);
  const [maxHeatsPerEvent, setMaxHeatsPerEvent] = useState<number>(0); // 0 = semua seri
  const [showCoverPage, setShowCoverPage] = useState<boolean>(true);
  const [pageBreakPerEvent, setPageBreakPerEvent] = useState<boolean>(false);
  const [autoSortByResult, setAutoSortByResult] = useState<boolean>(true); // Otomatis urutkan tercepat di atas saat final time ada
  const [viewLayoutMode, setViewLayoutMode] = useState<'heats' | 'combined'>('heats'); // 'heats' (per seri) atau 'combined' (rekap gabungan)
  const [openSettingsModal, setOpenSettingsModal] = useState<boolean>(false);
  const [athleteSearch, setAthleteSearch] = useState<string>('');

  // Temporary State for Settings Dialog
  const [tempEventFilterMode, setTempEventFilterMode] = useState<'all' | 'count' | 'range'>('all');
  const [tempEventLimitCount, setTempEventLimitCount] = useState<number>(bukuEvents.length || 10);
  const [tempEventStartNo, setTempEventStartNo] = useState<number>(1);
  const [tempEventEndNo, setTempEventEndNo] = useState<number>(bukuEvents.length || 10);
  const [tempMaxHeatsPerEvent, setTempMaxHeatsPerEvent] = useState<number>(0);
  const [tempShowCoverPage, setTempShowCoverPage] = useState<boolean>(true);
  const [tempPageBreakPerEvent, setTempPageBreakPerEvent] = useState<boolean>(false);
  const [tempAutoSortByResult, setTempAutoSortByResult] = useState<boolean>(true);
  const [tempViewLayoutMode, setTempViewLayoutMode] = useState<'heats' | 'combined'>('heats');

  const handleOpenSettings = () => {
    setTempEventFilterMode(eventFilterMode);
    setTempEventLimitCount(eventLimitCount);
    setTempEventStartNo(eventStartNo);
    setTempEventEndNo(eventEndNo);
    setTempMaxHeatsPerEvent(maxHeatsPerEvent);
    setTempShowCoverPage(showCoverPage);
    setTempPageBreakPerEvent(pageBreakPerEvent);
    setTempAutoSortByResult(autoSortByResult);
    setTempViewLayoutMode(viewLayoutMode);
    setOpenSettingsModal(true);
  };

  const handleApplySettings = () => {
    setEventFilterMode(tempEventFilterMode);
    setEventLimitCount(tempEventLimitCount);
    setEventStartNo(tempEventStartNo);
    setEventEndNo(tempEventEndNo);
    setMaxHeatsPerEvent(tempMaxHeatsPerEvent);
    setShowCoverPage(tempShowCoverPage);
    setPageBreakPerEvent(tempPageBreakPerEvent);
    setAutoSortByResult(tempAutoSortByResult);
    setViewLayoutMode(tempViewLayoutMode);
    setOpenSettingsModal(false);
  };

  const handleResetSettings = () => {
    setTempEventFilterMode('all');
    setTempEventLimitCount(bukuEvents.length || 10);
    setTempEventStartNo(1);
    setTempEventEndNo(bukuEvents.length || 10);
    setTempMaxHeatsPerEvent(0);
    setTempShowCoverPage(true);
    setTempPageBreakPerEvent(false);
    setTempAutoSortByResult(true);
    setTempViewLayoutMode('heats');
  };

  // Filtered Events and Heats
  const filteredEvents = useMemo(() => {
    let list = [...bukuEvents];

    if (eventFilterMode === 'count') {
      list = list.slice(0, Math.max(1, eventLimitCount));
    } else if (eventFilterMode === 'range') {
      list = list.filter((e) => {
        const no = e.orderNo || 0;
        return no >= eventStartNo && no <= eventEndNo;
      });
    }

    if (maxHeatsPerEvent > 0) {
      list = list.map((e) => ({
        ...e,
        heats: e.heats.slice(0, maxHeatsPerEvent),
      }));
    }

    if (athleteSearch.trim()) {
      const q = athleteSearch.trim().toLowerCase();
      list = list
        .map((e) => {
          const matchingHeats = e.heats.filter((h) =>
            h.assignments.some(
              (a) =>
                a.athleteName.toLowerCase().includes(q) ||
                a.schoolName?.toLowerCase().includes(q) ||
                a.athleteNumber?.toLowerCase().includes(q)
            )
          );
          if (matchingHeats.length > 0) {
            return {
              ...e,
              heats: matchingHeats,
            };
          }
          if (e.name.toLowerCase().includes(q)) {
            return e;
          }
          return null;
        })
        .filter(Boolean) as BukuEventItem[];
    }

    return list;
  }, [bukuEvents, eventFilterMode, eventLimitCount, eventStartNo, eventEndNo, maxHeatsPerEvent, athleteSearch]);

  const totalFilteredHeats = useMemo(() => {
    return filteredEvents.reduce((acc, e) => acc + e.heats.length, 0);
  }, [filteredEvents]);

  const formattedDates = useMemo(() => {
    if (!event?.startDate) return '2026';
    const start = new Date(event.startDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    if (!event.endDate || event.startDate === event.endDate) return start;
    const end = new Date(event.endDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return `${start} s/d ${end}`;
  }, [event]);

  const handlePrint = () => {
    window.print();
  };

  if (!event) {
    return (
      <Card className="p-12 text-center border-dashed">
        <BookOpen className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <h4 className="text-base font-bold text-foreground">Belum ada event kejuaraan aktif</h4>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Print stylesheet - Tanpa border tebal agar cetakan bersih & profesional */}
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

          #buku-acara-print-area {
            display: block !important;
            width: 100% !important;
          }

          /* Hilangkan border tebal dan bayangan pada dokumen cetak */
          #buku-acara-print-area div,
          #buku-acara-print-area .rounded-2xl,
          #buku-acara-print-area .rounded-xl,
          .buku-page-break {
            border: none !important;
            box-shadow: none !important;
          }

          .buku-page-break {
            page-break-after: always !important;
            break-after: page !important;
          }

          .buku-event-page-break {
            page-break-after: always !important;
            break-after: page !important;
          }

          table {
            border-collapse: collapse !important;
          }
        }
      `}</style>

      {/* Action Bar (No Print) */}
      <Card className="no-print border-slate-200/80 shadow-xs">
        <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground">Buku Acara & Start List</h2>
              <p className="text-xs text-muted-foreground">
                Daftar susunan nomor acara, seri heat, dan penempatan lintasan atlet perenang.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={event.id}
              onValueChange={(val) => {
                window.location.assign(`/buku-acara?event=${val}`);
              }}
            >
              <SelectTrigger className="h-9 text-xs w-[200px]">
                <SelectValue placeholder="Pilih Event" />
              </SelectTrigger>
              <SelectContent>
                {eventsList.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Tombol Sinkronkan Hasil Lomba */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncResults}
              disabled={isSyncing}
              className="gap-1.5 text-xs font-semibold h-9 border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-2xs"
              title="Perbarui data waktu & peringkat hasil lomba secara realtime"
            >
              <RefreshCw className={cn('h-3.5 w-3.5 text-blue-600', isSyncing && 'animate-spin')} />
              {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Hasil'}
            </Button>

            {/* Tombol Menuju Input Hasil Lomba */}
            <Link href={`/results?eventId=${event.id}`}>
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs font-bold h-9 border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100 shadow-2xs"
              >
                <Trophy className="h-3.5 w-3.5 text-amber-600" />
                Input Hasil Lomba
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenSettings}
              className="gap-1.5 text-xs font-semibold h-9 border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-blue-900"
            >
              <Sliders className="h-3.5 w-3.5 text-blue-600" />
              Pengaturan Halaman
            </Button>

            <Link href={`/juknis?event=${event.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold h-9">
                <FileText className="h-4 w-4 text-emerald-600" /> Juknis »
              </Button>
            </Link>

            <Button onClick={handlePrint} className="gap-2 text-xs font-bold h-9 bg-primary text-primary-foreground">
              <Printer className="h-4 w-4" /> Cetak Start List / PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ringkasan Konfigurasi Halaman & Status Hasil Lomba */}
      <div className="no-print flex flex-wrap items-center justify-between gap-3 p-3 px-4 rounded-xl border border-blue-100 bg-blue-50/40 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          {totalResultsCount > 0 ? (
            <Badge className="font-bold text-[11px] bg-emerald-600 text-white border-0 gap-1 shadow-2xs">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {totalResultsCount} Hasil Lomba Terhubung
            </Badge>
          ) : (
            <Badge variant="outline" className="font-medium text-[11px] bg-white text-slate-500">
              Belum Ada Hasil (Start List Kosong)
            </Badge>
          )}

          {/* Tombol Toggle Urutan Tercepat Otomatis */}
          <button
            type="button"
            onClick={() => {
              const next = !autoSortByResult;
              setAutoSortByResult(next);
              toast.info(
                next
                  ? 'Urutan diatur otomatis: Perenang tercepat di posisi paling atas'
                  : 'Urutan diatur sesuai nomor lintasan (Start List asli 1-8)'
              );
            }}
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all border shadow-2xs cursor-pointer',
              autoSortByResult
                ? 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            )}
            title="Klik untuk mengubah mode urutan (Tercepat di atas vs Nomor lintasan)"
          >
            <ArrowDownWideNarrow className="h-3.5 w-3.5" />
            <span>Urutan: {autoSortByResult ? 'Tercepat di Atas (Otomatis)' : 'Nomor Lintasan (1-8)'}</span>
          </button>

          {/* Toggle Tampilan Per Seri vs Peringkat Terpadu */}
          <div className="flex items-center rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => setViewLayoutMode('heats')}
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all',
                viewLayoutMode === 'heats'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <Layers className="h-3 w-3" />
              Per Seri
            </button>
            <button
              type="button"
              onClick={() => setViewLayoutMode('combined')}
              className={cn(
                'flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold transition-all',
                viewLayoutMode === 'combined'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              )}
              title="Rekap terpadu seluruh seri diurutkan dari tercepat ke terlambat"
            >
              <Trophy className="h-3 w-3 text-amber-300" />
              Peringkat Terpadu
            </button>
          </div>

          <span className="font-semibold text-slate-900 flex items-center gap-1 ml-1 text-[11px]">
            <Sliders className="h-3 w-3 text-blue-600" /> Filter:
          </span>
          <Badge variant="secondary" className="font-medium text-[11px] bg-white border border-slate-200">
            {eventFilterMode === 'all'
              ? `Semua Acara (${filteredEvents.length})`
              : eventFilterMode === 'count'
              ? `${filteredEvents.length} Acara`
              : `#${eventStartNo} s/d #${eventEndNo}`}
          </Badge>
          <Badge variant="secondary" className="font-medium text-[11px] bg-white border border-slate-200">
            {maxHeatsPerEvent === 0
              ? 'Semua Seri'
              : `Maks ${maxHeatsPerEvent} Seri`}
          </Badge>
        </div>

        <button
          type="button"
          onClick={handleOpenSettings}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2 shrink-0"
        >
          Ubah Pengaturan
        </button>
      </div>

      {/* Search Bar Nama Atlet (No-Print) */}
      <div className="no-print flex flex-col sm:flex-row items-center justify-between gap-3 p-3 px-4 rounded-xl border border-slate-200 bg-white shadow-xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={athleteSearch}
            onChange={(e) => setAthleteSearch(e.target.value)}
            placeholder="Cari nama atlet perenang atau sekolah / klub..."
            className="pl-9 pr-9 h-9 text-xs border-slate-200"
          />
          {athleteSearch && (
            <button
              type="button"
              onClick={() => setAthleteSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
        {athleteSearch && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-semibold text-slate-700">
              Menampilkan {filteredEvents.length} acara cocok
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAthleteSearch('')}
              className="h-7 px-2 text-xs text-blue-600 hover:text-blue-800"
            >
              Reset
            </Button>
          </div>
        )}
      </div>

      {/* Dokumen Buku Acara (Printable) */}
      <div id="buku-acara-print-area" className="space-y-8">
        {/* COVER HALAMAN UTAMA (Dengan Logo Rajendra & Logo Sponsor) */}
        {showCoverPage && (
          <div className="buku-page-break rounded-2xl border border-slate-200 print:border-none print:shadow-none bg-white p-8 sm:p-12 text-center shadow-xs space-y-6">
            {/* Header Logos: Rajendra Meet di Kiri & Rajendra Swimming Organizer di Kanan */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-3 gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo.png" alt="Rajendra Meet" className="h-8 sm:h-9 w-auto max-w-[120px] object-contain shrink-0" />
              <div className="text-center px-3 flex-1 min-w-0">
                <span className="font-mono text-xs font-black tracking-widest text-slate-800 uppercase block">
                  OFFICIAL MEET PROGRAM
                </span>
                <p className="text-[10px] text-slate-500 font-semibold">STANDAR FINA / AKUATIK INDONESIA</p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/rajendra-organizer-logo.png" alt="Rajendra Swimming Organizer" className="h-7 sm:h-8 w-auto max-w-[125px] object-contain shrink-0" />
            </div>

            {/* Judul Besar */}
            <div className="py-8 space-y-3">
              <Badge className="bg-blue-600 text-white font-bold text-xs uppercase tracking-widest px-3 py-1">
                BUKU ACARA PERLOMBAAN (START LIST)
              </Badge>

              <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight text-slate-950 font-serif leading-tight">
                {event.name}
              </h1>

              <p className="text-sm font-semibold text-slate-700 max-w-xl mx-auto">
                Buku Panduan Teknis Pelaksanaan & Daftar Susunan Seri Lintasan Atlet Renang (Start List)
              </p>
            </div>

            {/* 2-Column Info Waktu & Kolam (Sesuai Template Header) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 max-w-xl mx-auto rounded-xl border border-slate-200 bg-slate-50/80 p-4 text-xs text-left">
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="w-24 font-bold text-slate-600">Place:</span>
                  <span className="font-semibold text-slate-900">{event.location || 'Kolam Renang Resmi'}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="w-24 font-bold text-slate-600">Pool:</span>
                  <span className="font-semibold text-slate-900">{event.poolLengthMeters}m · {event.laneCount} Lintasan</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="w-32 font-bold text-slate-600">Organizer:</span>
                  <span className="font-semibold text-slate-900">{event.organizer || 'Panitia Pelaksana'}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="w-32 font-bold text-slate-600">Competition Date:</span>
                  <span className="font-semibold text-slate-900">{formattedDates}</span>
                </div>
              </div>
            </div>

            {/* FOOTER BANNER CHAMPION SPORTS & MASCOT RAJEN & DARA DI COVER */}
            <div className="pt-8 border-t border-slate-200 space-y-4">
              <div className="w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm print:rounded-none print:shadow-none">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/banner-rajendra.jpg"
                  alt="Rajendra Meet Swimming System - Champion Sports (Mascot Rajen & Dara)"
                  className="w-full h-auto object-cover max-h-28"
                />
              </div>

              {/* PITA SPONSOR RESMI */}
              <SponsorLogosStrip
                sponsors={sponsorsList}
                title="TERIMA KASIH KEPADA SELURUH MITRA & SPONSOR KEJUARAAN"
                size="lg"
              />
            </div>
          </div>
        )}

        {/* ISI START LIST (SUSUNAN SERI & LINTASAN ACARA LOMBA) */}
        <div className="rounded-2xl border border-slate-200 print:border-none print:shadow-none bg-white p-6 sm:p-10 shadow-xs space-y-6 overflow-hidden">
          {/* HEADER TEMPLATE OFFICIAL START LIST (Sesuai Referensi Pengguna) */}
          <div className="border-b border-slate-200 pb-5 space-y-4">
            {/* Top Row: Logo Kiri - Title Tengah - Logo/Maskot Kanan */}
            <div className="flex items-center justify-between gap-4">
              <div className="w-24 sm:w-32 flex items-center justify-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/logo.png" alt="Rajendra Meet" className="h-10 sm:h-12 w-auto max-w-[120px] object-contain" />
              </div>

              <div className="text-center flex-1">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950 font-serif leading-tight">
                  {event.name}
                </h2>
                <p className="text-xs sm:text-sm font-bold tracking-widest text-slate-700 uppercase mt-0.5">
                  SPORT SCHOOL SERIES · OFFICIAL START LIST
                </p>
              </div>

              <div className="w-24 sm:w-32 flex items-center justify-end">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/rajendra-organizer-logo.png" alt="Rajendra Swimming Organizer" className="h-10 sm:h-12 w-auto max-w-[130px] object-contain" />
              </div>
            </div>

            {/* Document Title Center */}
            <div className="text-center pt-2">
              <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                Official Start List
              </h1>
              <p className="text-xs sm:text-sm font-bold text-slate-600 mt-0.5">
                {event.name}
              </p>
            </div>

            {/* 2-Column Metadata Grid (Place, Pool, Organizer, Competition Date) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1.5 py-3 px-5 rounded-xl bg-slate-50/90 border border-slate-200 text-xs text-slate-800">
              <div className="space-y-1">
                <div className="flex items-center">
                  <span className="w-24 font-bold text-slate-600">Place:</span>
                  <span className="font-semibold text-slate-950">{event.location || 'Kolam Renang Resmi'}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-24 font-bold text-slate-600">Pool:</span>
                  <span className="font-semibold text-slate-950">{event.poolLengthMeters}m · {event.laneCount} Lintasan</span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-center">
                  <span className="w-32 font-bold text-slate-600">Organizer:</span>
                  <span className="font-semibold text-slate-950">{event.organizer || 'Panitia Pelaksana'}</span>
                </div>
                <div className="flex items-center">
                  <span className="w-32 font-bold text-slate-600">Competition Date:</span>
                  <span className="font-semibold text-slate-950">{formattedDates}</span>
                </div>
              </div>
            </div>
          </div>

          {/* DAFTAR NOMOR ACARA & SERI */}
          <div className="space-y-6">
            {filteredEvents.length === 0 ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Tidak ada acara yang cocok dengan kriteria pengaturan halaman yang dipilih.
              </div>
            ) : (
              filteredEvents.map((eventItem) => {
                // Perhitungan peringkat Time Final per nomor acara untuk semua perenang yang selesai (finished)
                const finishedAthletes = eventItem.heats
                  .flatMap((h) => h.assignments)
                  .filter(
                    (a) =>
                      typeof a.finalTimeMs === 'number' &&
                      a.finalTimeMs > 0 &&
                      (!a.resultStatus || a.resultStatus === 'finished')
                  )
                  .sort((a, b) => (a.finalTimeMs || 0) - (b.finalTimeMs || 0));

                const winnerTimeMs = finishedAthletes.length > 0 ? finishedAthletes[0].finalTimeMs || null : null;

                const rankMap = new Map<string, number>();
                let currentRank = 1;
                finishedAthletes.forEach((a, idx) => {
                  const key = a.id || `${a.athleteNumber}_${a.athleteName}_${a.laneNumber}`;
                  if (idx > 0) {
                    const prev = finishedAthletes[idx - 1];
                    if (prev.finalTimeMs === a.finalTimeMs) {
                      const prevKey = prev.id || `${prev.athleteNumber}_${prev.athleteName}_${prev.laneNumber}`;
                      rankMap.set(key, rankMap.get(prevKey) || currentRank);
                      return;
                    }
                  }
                  currentRank = idx + 1;
                  rankMap.set(key, currentRank);
                });

                // Gabungan semua perenang di acara ini jika dalam mode combined
                const allEventAssignments = eventItem.heats.flatMap((h) =>
                  h.assignments.map((a) => ({
                    ...a,
                    heatNumber: h.heatNumber,
                  }))
                );

                const sortedCombined = !autoSortByResult
                  ? [...allEventAssignments].sort(
                      (a, b) => a.heatNumber - b.heatNumber || a.laneNumber - b.laneNumber
                    )
                  : [...allEventAssignments].sort((a, b) => {
                      const hasTimeA =
                        typeof a.finalTimeMs === 'number' &&
                        a.finalTimeMs > 0 &&
                        (!a.resultStatus || a.resultStatus === 'finished');
                      const hasTimeB =
                        typeof b.finalTimeMs === 'number' &&
                        b.finalTimeMs > 0 &&
                        (!b.resultStatus || b.resultStatus === 'finished');

                      if (hasTimeA && hasTimeB) {
                        if (a.finalTimeMs !== b.finalTimeMs) {
                          return (a.finalTimeMs || 0) - (b.finalTimeMs || 0);
                        }
                        return a.laneNumber - b.laneNumber;
                      }
                      if (hasTimeA) return -1;
                      if (hasTimeB) return 1;

                      const hasStatusA = Boolean(a.resultStatus && a.resultStatus !== 'finished');
                      const hasStatusB = Boolean(b.resultStatus && b.resultStatus !== 'finished');
                      if (hasStatusA && !hasStatusB) return -1;
                      if (!hasStatusA && hasStatusB) return 1;

                      return a.heatNumber - b.heatNumber || a.laneNumber - b.laneNumber;
                    });

                return (
                  <div
                    key={eventItem.id}
                    className={cn(
                      'rounded-xl border border-slate-200 print:border-none print:shadow-none overflow-hidden',
                      pageBreakPerEvent && 'buku-event-page-break'
                    )}
                  >
                    {/* Event Section Header (Sesuai Format: Event 103, Freestyle SD/MI 3-4 - Man 100meter - Final) */}
                    <div className="border-b-2 border-slate-900 pb-1.5 pt-2 px-3 bg-slate-50/50 flex items-center justify-between">
                      <h3 className="text-xs sm:text-sm font-black text-slate-950 uppercase tracking-tight">
                        Event {eventItem.orderNo || '—'}, {eventItem.stroke} {eventItem.name} - {eventItem.gender === 'female' ? 'Women' : 'Men'} {eventItem.distanceMeters}meter - Time Final
                      </h3>
                      {autoSortByResult && finishedAthletes.length > 0 && (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded print:hidden flex items-center gap-1">
                          <ArrowDownWideNarrow className="h-3 w-3" /> Tercepat di Atas
                        </span>
                      )}
                    </div>

                    {/* Mode Tampilan Peringkat Terpadu (Semua Seri Digabung) */}
                    {viewLayoutMode === 'combined' ? (
                      <div className="p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs font-bold text-blue-950 bg-blue-50/90 px-3 py-1.5 rounded">
                          <span className="uppercase flex items-center gap-1.5">
                            <Trophy className="h-3.5 w-3.5 text-amber-600" />
                            HASIL PERINGKAT TERPADU (SELURUH SERI)
                          </span>
                          <span className="text-[11px] font-mono text-blue-800 font-semibold">
                            {allEventAssignments.length} Perenang · {eventItem.heats.length} Seri
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-300 text-slate-600 text-[11px] font-bold">
                                <th className="py-2 px-2 text-center font-bold w-24">Peringkat</th>
                                <th className="py-2 px-2 w-14 text-center">Seri</th>
                                <th className="py-2 px-2 w-12 text-center">Lin.</th>
                                <th className="py-2 px-2 font-bold">Nama Atlet</th>
                                <th className="py-2 px-2 font-semibold">Klub / Sekolah (Team)</th>
                                <th className="py-2 px-2 text-right font-bold w-24">Seed Time</th>
                                <th className="py-2 px-2 text-right font-bold w-24">Final Time</th>
                                <th className="py-2 px-2 text-right font-bold w-20">Selisih</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {sortedCombined.map((assign) => {
                                const q = athleteSearch.trim().toLowerCase();
                                const isMatch =
                                  Boolean(q) &&
                                  (assign.athleteName.toLowerCase().includes(q) ||
                                    assign.schoolName?.toLowerCase().includes(q) ||
                                    assign.athleteNumber?.toLowerCase().includes(q));

                                const athleteKey =
                                  assign.id || `${assign.athleteNumber}_${assign.athleteName}_${assign.laneNumber}`;
                                const athleteRank = rankMap.get(athleteKey);

                                const diffMs =
                                  winnerTimeMs && assign.finalTimeMs && assign.finalTimeMs > winnerTimeMs
                                    ? assign.finalTimeMs - winnerTimeMs
                                    : 0;

                                return (
                                  <tr
                                    key={`${assign.heatNumber}_${assign.laneNumber}`}
                                    className={
                                      isMatch
                                        ? 'bg-amber-100/70 font-semibold transition-colors'
                                        : 'hover:bg-slate-50/60'
                                    }
                                  >
                                    <td className="py-2 px-2 text-center font-mono">
                                      {athleteRank !== undefined ? (
                                        athleteRank === 1 ? (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-900 border border-amber-300">
                                            🥇 1 (Emas)
                                          </span>
                                        ) : athleteRank === 2 ? (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-black text-slate-800 border border-slate-400">
                                            🥈 2 (Perak)
                                          </span>
                                        ) : athleteRank === 3 ? (
                                          <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-black text-orange-900 border border-orange-300">
                                            🥉 3 (Perunggu)
                                          </span>
                                        ) : (
                                          <span className="font-bold text-slate-700 text-xs">
                                            #{athleteRank}
                                          </span>
                                        )
                                      ) : assign.resultStatus && assign.resultStatus !== 'finished' ? (
                                        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-black text-rose-800 uppercase">
                                          {assign.resultStatus}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 font-normal print:inline-block print:w-12 print:border-b print:border-slate-400">
                                          —
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-2 text-center font-mono font-semibold text-slate-700">
                                      Seri {assign.heatNumber}
                                    </td>
                                    <td className="py-2 px-2 text-center font-black font-mono text-slate-900">
                                      <span
                                        className={
                                          isMatch
                                            ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 font-bold text-white text-[10px]'
                                            : ''
                                        }
                                      >
                                        {assign.laneNumber}
                                      </span>
                                    </td>
                                    <td className="py-2 px-2 font-bold text-slate-950">
                                      {isMatch ? (
                                        <mark className="rounded bg-amber-200 px-1 py-0.5 font-bold text-amber-950">
                                          {assign.athleteName}
                                        </mark>
                                      ) : (
                                        assign.athleteName
                                      )}
                                    </td>
                                    <td className="py-2 px-2 text-slate-700">
                                      {assign.schoolName || '—'}
                                    </td>
                                    <td className="py-2 px-2 text-right font-mono font-semibold text-slate-700">
                                      {assign.seedTimeMs ? formatMsToTime(assign.seedTimeMs) : 'NT'}
                                    </td>
                                    <td className="py-2 px-2 text-right font-mono font-bold">
                                      {assign.finalTimeMs ? (
                                        <span className="text-blue-900 font-extrabold">
                                          {formatMsToTime(assign.finalTimeMs)}
                                        </span>
                                      ) : assign.resultStatus && assign.resultStatus !== 'finished' ? (
                                        <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-black text-rose-800 uppercase">
                                          {assign.resultStatus}
                                        </span>
                                      ) : (
                                        <span className="text-slate-400 font-normal print:inline-block print:w-16 print:border-b print:border-slate-400">
                                          —
                                        </span>
                                      )}
                                    </td>
                                    <td className="py-2 px-2 text-right font-mono text-[11px] text-slate-600">
                                      {assign.finalTimeMs && winnerTimeMs ? (
                                        diffMs === 0 ? (
                                          <span className="font-bold text-amber-700">Tercepat</span>
                                        ) : (
                                          `+${(diffMs / 1000).toFixed(2)}s`
                                        )
                                      ) : (
                                        '—'
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ) : (
                      /* Mode Tampilan Standar Per Seri (Heats) */
                      <div className="p-3 space-y-4">
                        {eventItem.heats.map((heat) => {
                          // Urutkan perenang di seri ini: tercepat paling atas jika finalTimeMs tersedia
                          const sortedAssignments = !autoSortByResult
                            ? [...heat.assignments].sort((a, b) => a.laneNumber - b.laneNumber)
                            : [...heat.assignments].sort((a, b) => {
                                const hasTimeA =
                                  typeof a.finalTimeMs === 'number' &&
                                  a.finalTimeMs > 0 &&
                                  (!a.resultStatus || a.resultStatus === 'finished');
                                const hasTimeB =
                                  typeof b.finalTimeMs === 'number' &&
                                  b.finalTimeMs > 0 &&
                                  (!b.resultStatus || b.resultStatus === 'finished');

                                if (hasTimeA && hasTimeB) {
                                  if (a.finalTimeMs !== b.finalTimeMs) {
                                    return (a.finalTimeMs || 0) - (b.finalTimeMs || 0);
                                  }
                                  return a.laneNumber - b.laneNumber;
                                }
                                if (hasTimeA) return -1;
                                if (hasTimeB) return 1;

                                const hasStatusA = Boolean(a.resultStatus && a.resultStatus !== 'finished');
                                const hasStatusB = Boolean(b.resultStatus && b.resultStatus !== 'finished');
                                if (hasStatusA && !hasStatusB) return -1;
                                if (!hasStatusA && hasStatusB) return 1;

                                return a.laneNumber - b.laneNumber;
                              });

                          return (
                            <div key={heat.id} className="space-y-1.5">
                              <div className="flex items-center justify-between text-xs font-bold text-blue-950 bg-blue-50/90 px-3 py-1 rounded">
                                <span className="uppercase">SERI {heat.heatNumber}</span>
                                <span className="text-[11px] font-mono text-blue-800 font-semibold">{heat.assignments.length} Perenang</span>
                              </div>

                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-300 text-slate-600 text-[11px] font-bold">
                                      <th className="py-2 px-2 w-12 text-center">Lin.</th>
                                      <th className="py-2 px-2 font-bold">Nama Atlet</th>
                                      <th className="py-2 px-2 font-semibold">Klub / Sekolah (Team)</th>
                                      <th className="py-2 px-2 text-right font-bold w-24">Seed Time</th>
                                      <th className="py-2 px-2 text-right font-bold w-24">Final Time</th>
                                      <th className="py-2 px-2 text-center font-bold w-28">Peringkat</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-200">
                                    {sortedAssignments.map((assign) => {
                                      const q = athleteSearch.trim().toLowerCase();
                                      const isMatch =
                                        Boolean(q) &&
                                        (assign.athleteName.toLowerCase().includes(q) ||
                                          assign.schoolName?.toLowerCase().includes(q) ||
                                          assign.athleteNumber?.toLowerCase().includes(q));

                                      const athleteKey =
                                        assign.id || `${assign.athleteNumber}_${assign.athleteName}_${assign.laneNumber}`;
                                      const athleteRank = rankMap.get(athleteKey);

                                      return (
                                        <tr
                                          key={assign.laneNumber}
                                          className={
                                            isMatch
                                              ? 'bg-amber-100/70 font-semibold transition-colors'
                                              : 'hover:bg-slate-50/60'
                                          }
                                        >
                                          <td className="py-2 px-2 text-center font-black font-mono text-slate-900">
                                            <span
                                              className={
                                                isMatch
                                                  ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 font-bold text-white text-[10px]'
                                                  : ''
                                              }
                                            >
                                              {assign.laneNumber}
                                            </span>
                                          </td>
                                          <td className="py-2 px-2 font-bold text-slate-950">
                                            {isMatch ? (
                                              <mark className="rounded bg-amber-200 px-1 py-0.5 font-bold text-amber-950">
                                                {assign.athleteName}
                                              </mark>
                                            ) : (
                                              assign.athleteName
                                            )}
                                          </td>
                                          <td className="py-2 px-2 text-slate-700">
                                            {assign.schoolName || '—'}
                                          </td>
                                          <td className="py-2 px-2 text-right font-mono font-semibold text-slate-700">
                                            {assign.seedTimeMs ? formatMsToTime(assign.seedTimeMs) : 'NT'}
                                          </td>
                                          <td className="py-2 px-2 text-right font-mono font-bold">
                                            {assign.finalTimeMs ? (
                                              <span className="text-blue-900 font-extrabold">
                                                {formatMsToTime(assign.finalTimeMs)}
                                              </span>
                                            ) : assign.resultStatus && assign.resultStatus !== 'finished' ? (
                                              <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-black text-rose-800 uppercase">
                                                {assign.resultStatus}
                                              </span>
                                            ) : (
                                              <span className="text-slate-400 font-normal print:inline-block print:w-16 print:border-b print:border-slate-400">
                                                —
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-2 px-2 text-center font-mono">
                                            {athleteRank !== undefined ? (
                                              athleteRank === 1 ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-black text-amber-900 border border-amber-300">
                                                  🥇 1 (Emas)
                                                </span>
                                              ) : athleteRank === 2 ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-2 py-0.5 text-[11px] font-black text-slate-800 border border-slate-400">
                                                  🥈 2 (Perak)
                                                </span>
                                              ) : athleteRank === 3 ? (
                                                <span className="inline-flex items-center gap-1 rounded-full bg-orange-100 px-2 py-0.5 text-[11px] font-black text-orange-900 border border-orange-300">
                                                  🥉 3 (Perunggu)
                                                </span>
                                              ) : (
                                                <span className="font-bold text-slate-700 text-xs">
                                                  #{athleteRank}
                                                </span>
                                              )
                                            ) : assign.resultStatus && assign.resultStatus !== 'finished' ? (
                                              <span className="rounded bg-rose-100 px-1.5 py-0.5 text-[10px] font-black text-rose-800 uppercase">
                                                {assign.resultStatus}
                                              </span>
                                            ) : (
                                              <span className="text-slate-400 font-normal print:inline-block print:w-12 print:border-b print:border-slate-400">
                                                —
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      );
                                    })}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* FOOTER BANNER CHAMPION SPORTS & MASCOT RAJEN & DARA */}
          <div className="pt-6 -mx-6 sm:-mx-10 -mb-6 sm:-mb-10 space-y-3 bg-slate-50/70 border-t border-slate-200 print:bg-white print:border-none">
            <div className="w-full overflow-hidden border-b border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/banner-rajendra.jpg"
                alt="Rajendra Meet Swimming System - Champion Sports (Mascot Rajen & Dara)"
                className="w-full h-auto object-cover max-h-24 sm:max-h-32 block"
              />
            </div>
            <div className="px-6 sm:px-10 pb-4">
              <SponsorLogosStrip sponsors={sponsorsList} size="sm" />
            </div>
          </div>
        </div>
      </div>

      {/* DIALOG PENGATURAN HALAMAN, JUMLAH ACARA & JUMLAH SERI */}
      <Dialog open={openSettingsModal} onOpenChange={setOpenSettingsModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Sliders className="h-5 w-5 text-primary" /> Pengaturan Halaman & Cetak
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-5 py-3 text-xs">
            {/* Bagian 1: Pengaturan Jumlah Acara */}
            <div className="space-y-2">
              <label className="font-bold text-slate-900 block text-xs">
                1. Pemilihan & Jumlah Acara
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTempEventFilterMode('all')}
                  className={cn(
                    'p-2.5 rounded-lg border text-center transition-all',
                    tempEventFilterMode === 'all'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  )}
                >
                  Semua Acara
                  <span className="block text-[10px] text-muted-foreground font-normal mt-0.5">
                    ({bukuEvents.length} Acara)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTempEventFilterMode('count')}
                  className={cn(
                    'p-2.5 rounded-lg border text-center transition-all',
                    tempEventFilterMode === 'count'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  )}
                >
                  Batasi Jumlah
                  <span className="block text-[10px] text-muted-foreground font-normal mt-0.5">
                    N Acara Pertama
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTempEventFilterMode('range')}
                  className={cn(
                    'p-2.5 rounded-lg border text-center transition-all',
                    tempEventFilterMode === 'range'
                      ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  )}
                >
                  Rentang Nomor
                  <span className="block text-[10px] text-muted-foreground font-normal mt-0.5">
                    Acara X s/d Y
                  </span>
                </button>
              </div>

              {tempEventFilterMode === 'count' && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 mt-2">
                  <span className="font-semibold text-slate-700 block">Jumlah Acara yang Dicetak:</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={bukuEvents.length}
                      value={tempEventLimitCount}
                      onChange={(e) => setTempEventLimitCount(Number(e.target.value) || 1)}
                      className="h-8 text-xs w-28 font-bold"
                    />
                    <span className="text-slate-500">acara (dari total {bukuEvents.length})</span>
                  </div>
                </div>
              )}

              {tempEventFilterMode === 'range' && (
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5 mt-2">
                  <span className="font-semibold text-slate-700 block">Rentang Nomor Acara:</span>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">Dari Acara #</span>
                    <Input
                      type="number"
                      min={1}
                      value={tempEventStartNo}
                      onChange={(e) => setTempEventStartNo(Number(e.target.value) || 1)}
                      className="h-8 text-xs w-20 font-bold"
                    />
                    <span className="text-slate-500">sampai #</span>
                    <Input
                      type="number"
                      min={tempEventStartNo}
                      value={tempEventEndNo}
                      onChange={(e) => setTempEventEndNo(Number(e.target.value) || tempEventStartNo)}
                      className="h-8 text-xs w-20 font-bold"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Bagian 2: Pengaturan Jumlah Seri per Acara */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-900 block text-xs">
                2. Jumlah Seri per Acara
              </label>
              <div className="space-y-2">
                <Select
                  value={String(tempMaxHeatsPerEvent)}
                  onValueChange={(val) => setTempMaxHeatsPerEvent(Number(val))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih batasan seri" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Tampilkan Semua Seri (Lengkap)</SelectItem>
                    <SelectItem value="1">Hanya 1 Seri Pertama per Acara</SelectItem>
                    <SelectItem value="2">Maksimal 2 Seri per Acara</SelectItem>
                    <SelectItem value="3">Maksimal 3 Seri per Acara</SelectItem>
                    <SelectItem value="4">Maksimal 4 Seri per Acara</SelectItem>
                    <SelectItem value="5">Maksimal 5 Seri per Acara</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Gunakan untuk membatasi jumlah heat / seri yang dicetak (berguna saat gladi atau mencetak sesi khusus).
                </p>
              </div>
            </div>

            {/* Bagian 3: Format & Layout Cetak */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-900 block text-xs">
                3. Opsi Tampilan & Tata Letak Halaman
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempShowCoverPage}
                    onChange={(e) => setTempShowCoverPage(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <span>Sertakan Halaman Sampul (Cover Buku Acara & Sponsor)</span>
                </label>

                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempPageBreakPerEvent}
                    onChange={(e) => setTempPageBreakPerEvent(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <span>Pisahkan Halaman Tiap Acara (1 Acara per Lembar A4)</span>
                </label>
              </div>
            </div>

            {/* Bagian 4: Pengurutan & Format Tampilan Hasil */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <label className="font-bold text-slate-900 block text-xs">
                4. Urutan Baris & Format Tampilan Hasil
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={tempAutoSortByResult}
                    onChange={(e) => setTempAutoSortByResult(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-blue-600"
                  />
                  <span className="font-semibold text-slate-900">
                    Otomatis urutkan perenang tercepat di posisi paling atas setelah hasil masuk
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setTempViewLayoutMode('heats')}
                    className={cn(
                      'p-2 rounded-lg border text-center transition-all text-xs',
                      tempViewLayoutMode === 'heats'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    )}
                  >
                    Tampilan Per Seri (Heats)
                    <span className="block text-[10px] text-muted-foreground font-normal mt-0.5">
                      Tabel terpisah untuk Seri 1, Seri 2, dst.
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempViewLayoutMode('combined')}
                    className={cn(
                      'p-2 rounded-lg border text-center transition-all text-xs',
                      tempViewLayoutMode === 'combined'
                        ? 'border-blue-600 bg-blue-50 text-blue-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    )}
                  >
                    Peringkat Terpadu (Event)
                    <span className="block text-[10px] text-muted-foreground font-normal mt-0.5">
                      Semua seri digabung satu peringkat 1-N
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetSettings}
              className="text-xs text-muted-foreground gap-1"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Reset
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenSettingsModal(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleApplySettings}
                className="text-xs gap-1.5 font-bold"
              >
                <Check className="h-3.5 w-3.5" /> Terapkan Pengaturan
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
