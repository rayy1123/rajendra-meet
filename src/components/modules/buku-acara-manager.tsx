'use client';

import { useState, useMemo } from 'react';
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
} from 'lucide-react';
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
      laneNumber: number;
      athleteName: string;
      athleteNumber: string;
      schoolName: string;
      seedTimeMs: number | null;
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

  // State Pengaturan Halaman & Cetak Acara / Seri
  const [eventFilterMode, setEventFilterMode] = useState<'all' | 'count' | 'range'>('all');
  const [eventLimitCount, setEventLimitCount] = useState<number>(bukuEvents.length || 10);
  const [eventStartNo, setEventStartNo] = useState<number>(1);
  const [eventEndNo, setEventEndNo] = useState<number>(bukuEvents.length || 10);
  const [maxHeatsPerEvent, setMaxHeatsPerEvent] = useState<number>(0); // 0 = semua seri
  const [showCoverPage, setShowCoverPage] = useState<boolean>(true);
  const [pageBreakPerEvent, setPageBreakPerEvent] = useState<boolean>(false);
  const [openSettingsModal, setOpenSettingsModal] = useState<boolean>(false);

  // Temporary State for Settings Dialog
  const [tempEventFilterMode, setTempEventFilterMode] = useState<'all' | 'count' | 'range'>('all');
  const [tempEventLimitCount, setTempEventLimitCount] = useState<number>(bukuEvents.length || 10);
  const [tempEventStartNo, setTempEventStartNo] = useState<number>(1);
  const [tempEventEndNo, setTempEventEndNo] = useState<number>(bukuEvents.length || 10);
  const [tempMaxHeatsPerEvent, setTempMaxHeatsPerEvent] = useState<number>(0);
  const [tempShowCoverPage, setTempShowCoverPage] = useState<boolean>(true);
  const [tempPageBreakPerEvent, setTempPageBreakPerEvent] = useState<boolean>(false);

  const handleOpenSettings = () => {
    setTempEventFilterMode(eventFilterMode);
    setTempEventLimitCount(eventLimitCount);
    setTempEventStartNo(eventStartNo);
    setTempEventEndNo(eventEndNo);
    setTempMaxHeatsPerEvent(maxHeatsPerEvent);
    setTempShowCoverPage(showCoverPage);
    setTempPageBreakPerEvent(pageBreakPerEvent);
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

    return list;
  }, [bukuEvents, eventFilterMode, eventLimitCount, eventStartNo, eventEndNo, maxHeatsPerEvent]);

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

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenSettings}
              className="gap-1.5 text-xs font-semibold h-9 border-blue-200 bg-blue-50/50 hover:bg-blue-100/60 text-blue-900"
            >
              <Sliders className="h-3.5 w-3.5 text-blue-600" />
              Pengaturan Halaman & Seri
            </Button>

            <Link href={`/juknis?event=${event.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold h-9">
                <FileText className="h-4 w-4 text-emerald-600" /> Juknis »
              </Button>
            </Link>

            <Button onClick={handlePrint} className="gap-2 text-xs font-bold h-9">
              <Printer className="h-4 w-4" /> Cetak Start List / PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ringkasan Konfigurasi Halaman & Filter Cetak Aktif */}
      <div className="no-print flex flex-wrap items-center justify-between gap-2.5 p-3 px-4 rounded-xl border border-blue-100 bg-blue-50/40 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-900 flex items-center gap-1.5">
            <Sliders className="h-3.5 w-3.5 text-blue-600" /> Konfigurasi Cetak:
          </span>
          <Badge variant="secondary" className="font-medium text-[11px] bg-white border border-slate-200">
            {eventFilterMode === 'all'
              ? `Semua Acara (${filteredEvents.length} Acara)`
              : eventFilterMode === 'count'
              ? `${filteredEvents.length} Acara Pertama`
              : `Acara #${eventStartNo} s/d #${eventEndNo} (${filteredEvents.length} Acara)`}
          </Badge>
          <Badge variant="secondary" className="font-medium text-[11px] bg-white border border-slate-200">
            {maxHeatsPerEvent === 0
              ? 'Semua Seri per Acara'
              : `Maksimal ${maxHeatsPerEvent} Seri per Acara`}
          </Badge>
          <Badge variant="secondary" className="font-medium text-[11px] bg-white border border-slate-200">
            Total {totalFilteredHeats} Seri
          </Badge>
          <Badge variant="outline" className="font-medium text-[11px] bg-white">
            Cover: {showCoverPage ? 'Aktif' : 'Dilewati'}
          </Badge>
          {pageBreakPerEvent && (
            <Badge variant="outline" className="font-medium text-[11px] bg-white text-indigo-700 border-indigo-200">
              1 Acara / Halaman
            </Badge>
          )}
        </div>

        <button
          type="button"
          onClick={handleOpenSettings}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2"
        >
          Ubah Pengaturan
        </button>
      </div>

      {/* Dokumen Buku Acara (Printable) */}
      <div id="buku-acara-print-area" className="space-y-8">
        {/* COVER HALAMAN UTAMA (Dengan Logo Rajendra & Logo Sponsor) */}
        {showCoverPage && (
          <div className="buku-page-break rounded-2xl border border-slate-200 print:border-none print:shadow-none bg-white p-8 sm:p-12 text-center shadow-xs space-y-6">
            {/* Header Logos */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo.png" alt="Rajendra SCMS" className="h-12 w-auto object-contain" />
              <div className="text-center">
                <span className="font-mono text-xs font-black tracking-widest text-slate-800 uppercase block">
                  OFFICIAL MEET PROGRAM
                </span>
                <p className="text-[10px] text-slate-500 font-semibold">STANDAR FINA / AKUATIK INDONESIA</p>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo.png" alt="Emblem" className="h-12 w-auto object-contain" />
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
              <div className="w-20 sm:w-24 flex items-center justify-start">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/logo.png" alt="Event Logo" className="h-12 sm:h-14 w-auto object-contain" />
              </div>

              <div className="text-center flex-1">
                <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-950 font-serif leading-tight">
                  {event.name}
                </h2>
                <p className="text-xs sm:text-sm font-bold tracking-widest text-slate-700 uppercase mt-0.5">
                  SPORT SCHOOL SERIES · OFFICIAL START LIST
                </p>
              </div>

              <div className="w-20 sm:w-24 flex items-center justify-end">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/logo.png" alt="Mascot / Badge" className="h-12 sm:h-14 w-auto object-contain" />
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
              filteredEvents.map((eventItem) => (
                <div
                  key={eventItem.id}
                  className={cn(
                    'rounded-xl border border-slate-200 print:border-none print:shadow-none overflow-hidden',
                    pageBreakPerEvent && 'buku-event-page-break'
                  )}
                >
                  {/* Event Section Header (Sesuai Format: Event 103, Freestyle SD/MI 3-4 - Man 100meter - Final) */}
                  <div className="border-b-2 border-slate-900 pb-1.5 pt-2 px-3 bg-slate-50/50">
                    <h3 className="text-xs sm:text-sm font-black text-slate-950 uppercase tracking-tight">
                      Event {eventItem.orderNo || '—'}, {eventItem.stroke} {eventItem.name} - {eventItem.gender === 'female' ? 'Women' : 'Men'} {eventItem.distanceMeters}meter - Time Final
                    </h3>
                  </div>

                  <div className="p-3 space-y-4">
                    {eventItem.heats.map((heat) => (
                      <div key={heat.id} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-blue-950 bg-blue-50/90 px-3 py-1 rounded">
                          <span className="uppercase">SERI {heat.heatNumber}</span>
                          <span className="text-[11px] font-mono text-blue-800 font-semibold">{heat.assignments.length} Perenang</span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-xs border-collapse">
                            <thead>
                              <tr className="border-b border-slate-300 text-slate-600 text-[11px] font-bold">
                                <th className="py-2 px-2 w-14 text-center">Lin.</th>
                                <th className="py-2 px-2 font-bold">Nama Atlet</th>
                                <th className="py-2 px-2 font-semibold">Klub / Sekolah (Team)</th>
                                <th className="py-2 px-2 text-right font-bold w-28">Seed Time</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                              {heat.assignments.map((assign) => (
                                <tr key={assign.laneNumber} className="hover:bg-slate-50/60">
                                  <td className="py-2 px-2 text-center font-black font-mono text-slate-900">
                                    {assign.laneNumber}
                                  </td>
                                  <td className="py-2 px-2 font-bold text-slate-950">
                                    {assign.athleteName}
                                  </td>
                                  <td className="py-2 px-2 text-slate-700">
                                    {assign.schoolName || '—'}
                                  </td>
                                  <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">
                                    {assign.seedTimeMs ? formatMsToTime(assign.seedTimeMs) : 'NT'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
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
