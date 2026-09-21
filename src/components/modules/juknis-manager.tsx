'use client';

import { useState, useRef, useEffect } from 'react';
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
  FileText,
  Calendar,
  Waves,
  Trophy,
  Medal,
  Phone,
  Edit3,
  RotateCcw,
  BookOpen,
  Save,
  Check,
  Bold,
  Italic,
  Underline,
  Pencil,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { type SponsorItem, getCachedSponsors } from '@/lib/data/sponsors';
import { SponsorLogosStrip } from './sponsor-logos-strip';
import Link from 'next/link';

export interface JuknisConfig {
  title: string;
  penanggungJawab: string;
  hariPelaksanaan: string;
  tanggalPelaksanaan: string;
  waktuPelaksanaan: string;
  tempat: string;
  batasPendaftaran: string;
  hotline1: string;
  hotline2: string;
  biayaPaket: string;
  biayaTambahan: string;
  rekeningBank: string;
  depositBanding: string;
  jadwalTM: string;
  waktuTM: string;
  linkZoomTM: string;
  linkWAG: string;
}

/**
 * Ornamen Pita Gelombang Modern Khas Haornas Swim Fest (Sudut Kanan Atas)
 * Warna: Navy (#0f172a), Biru Royal (#1d4ed8), Biru Langit (#0284c7), dan Emas (#f59e0b)
 */
function HaornasTopRightWave() {
  return (
    <div contentEditable={false} className="pointer-events-none absolute -top-1 -right-1 z-0 h-28 w-14 overflow-hidden sm:h-36 sm:w-18">
      <svg
        viewBox="0 0 100 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full object-cover"
        aria-hidden="true"
      >
        <path d="M40 0 C65 45 90 110 100 180 L100 0 Z" fill="#0f172a" />
        <path d="M58 0 C78 50 94 120 98 195 L100 195 L100 0 Z" fill="#1d4ed8" />
        <path d="M72 0 C84 55 96 125 99 200 L100 200 L100 0 Z" fill="#0284c7" />
        <path d="M84 0 C92 52 97 112 100 165 L100 0 Z" fill="#f59e0b" />
      </svg>
    </div>
  );
}

/**
 * Ornamen Pita Gelombang Modern Khas Haornas Swim Fest (Sudut Kiri Bawah)
 */
function HaornasBottomLeftWave() {
  return (
    <div contentEditable={false} className="pointer-events-none absolute -bottom-1 -left-1 z-0 h-28 w-14 overflow-hidden sm:h-36 sm:w-18">
      <svg
        viewBox="0 0 100 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full rotate-180 object-cover"
        aria-hidden="true"
      >
        <path d="M40 0 C65 45 90 110 100 180 L100 0 Z" fill="#0f172a" />
        <path d="M58 0 C78 50 94 120 98 195 L100 195 L100 0 Z" fill="#1d4ed8" />
        <path d="M72 0 C84 55 96 125 99 200 L100 200 L100 0 Z" fill="#0284c7" />
        <path d="M84 0 C92 52 97 112 100 165 L100 0 Z" fill="#f59e0b" />
      </svg>
    </div>
  );
}

/**
 * Header Lembar Juknis Resmi (Template Haornas Swim Fest)
 * - Sisi Kiri: Logo Rajendra Meet (proporsional & ringkas)
 * - Tengah: Judul Event, Tempat, dan Tanggal (Luas & Rapi)
 * - Sisi Kanan: Logo Rajendra Swimming Organizer (Aman & Bebas Halangan)
 */
function HaornasSheetHeader({
  title,
  venue,
  dates,
}: {
  title: string;
  venue: string;
  dates: string;
}) {
  return (
    <div className="relative z-10 flex items-center justify-between border-b-2 border-slate-900 pb-3 gap-3">
      {/* SISI KIRI: Logo Rajendra Meet */}
      <div contentEditable={false} className="relative z-20 flex shrink-0 items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/logo.png"
          alt="Rajendra Meet"
          className="h-7 w-auto sm:h-8 max-w-[105px] object-contain"
        />
      </div>

      {/* TENGAH: Event Title, Tempat, Tanggal */}
      <div className="flex-1 px-3 text-center min-w-0">
        <h2 className="text-xs font-black uppercase tracking-tight text-slate-950 sm:text-sm md:text-base leading-snug font-sans">
          {title}
        </h2>
        <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-800 sm:text-[11px]">
          {venue}
        </p>
        <p className="text-[9px] font-semibold uppercase text-slate-600 sm:text-[10px]">
          {dates}
        </p>
      </div>

      {/* SISI KANAN: Logo Rajendra Swimming Organizer (Bebas dari elemen gelombang) */}
      <div contentEditable={false} className="relative z-20 flex shrink-0 items-center justify-end mr-6 sm:mr-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/brand/rajendra-organizer-logo.png"
          alt="Rajendra Swimming Organizer"
          className="h-6 w-auto sm:h-7.5 max-w-[110px] object-contain"
        />
      </div>
    </div>
  );
}

/**
 * Footer Lembar Juknis Resmi (Template Haornas Swim Fest)
 * - Kontak Person: Hotline 1 & Hotline 2 (Tebal, font-black)
 * - Row Logo Sponsor / Media Partner Full Color di Paling Bawah
 */
function HaornasSheetFooter({
  hotline1,
  hotline2,
  sponsors,
}: {
  hotline1: string;
  hotline2: string;
  sponsors: SponsorItem[];
}) {
  return (
    <div className="relative z-10 mt-auto pt-2 border-t border-slate-300 print:pt-1.5 print:mt-auto">
      {/* Kontak Person */}
      <div className="flex items-center justify-between pb-1 text-[11px] sm:text-xs">
        <span className="hidden sm:inline-block font-semibold uppercase tracking-wider text-[9px] text-slate-400">
          Official Technical Handbook · Rajendra Meet
        </span>
        <p className="ml-auto text-right font-black tracking-tight text-slate-950 text-xs sm:text-[13px]">
          Kontak Person :{' '}
          <span className="font-mono text-slate-900">{hotline1}</span>
          {hotline2 && (
            <>
              {' / '}
              <span className="font-mono text-slate-900">{hotline2}</span>
            </>
          )}
        </p>
      </div>

      {/* Row Logo Sponsor & Media Partner Full Color */}
      <div contentEditable={false} className="border-t border-slate-200/80 pt-1">
        <SponsorLogosStrip
          sponsors={sponsors}
          title=""
          size="sm"
          grayscale={false}
        />
      </div>
    </div>
  );
}

export function JuknisManager({
  event,
  eventsList,
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
  sponsors: SponsorItem[];
}) {
  const [sponsorsList] = useState<SponsorItem[]>(() => getCachedSponsors(sponsors));
  const [openEditModal, setOpenEditModal] = useState(false);

  const defaultJuknis: JuknisConfig = {
    title: event?.name || 'FESTIVAL RENANG PELAJAR 2026',
    penanggungJawab: event?.organizer || 'Rajendra Swimming Organizer',
    hariPelaksanaan: 'Sabtu s/d Minggu',
    tanggalPelaksanaan: event?.startDate
      ? new Date(event.startDate).toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '12-13 September 2026',
    waktuPelaksanaan: '07.30 WIB s/d Selesai',
    tempat: event?.location || 'KR Tirta Abinaya Rindam Jaya, Jakarta Timur',
    batasPendaftaran: '31 Agustus 2026',
    hotline1: '08877151189',
    hotline2: '088999151189',
    biayaPaket: 'Rp. 125.000 / Nomor',
    biayaTambahan: 'Rp. 75.000 Per Nomor Tambahan',
    rekeningBank: 'Seabank No. 901947057209 a/n Suviani',
    depositBanding: 'Rp. 2.500.000 (Dua Juta Lima Ratus Ribu Rupiah)',
    jadwalTM: 'Sabtu, 5 September 2026',
    waktuTM: '19.30 WIB s/d Selesai',
    linkZoomTM: 'Menyusul di Grup WhatsApp Peserta',
    linkWAG: 'https://chat.whatsapp.com/CkKuzAEanbq4FAyJ84L87A',
  };

  const [config, setConfig] = useState<JuknisConfig>(() => {
    if (typeof window !== 'undefined' && event?.id) {
      try {
        const saved = localStorage.getItem(`scms_juknis_config_${event.id}`);
        if (saved) return { ...defaultJuknis, ...JSON.parse(saved) };
      } catch {}
    }
    return defaultJuknis;
  });

  const [tempConfig, setTempConfig] = useState<JuknisConfig>(config);

  // State untuk Mode Edit Langsung (WYSIWYG Inline Editing)
  const printAreaRef = useRef<HTMLDivElement>(null);
  const [isDirectEdit, setIsDirectEdit] = useState(false);
  const [customHtml, setCustomHtml] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && event?.id) {
      try {
        const savedHtml = localStorage.getItem(`scms_juknis_custom_html_${event.id}`);
        setCustomHtml(savedHtml || null);
      } catch {}
    }
  }, [event?.id]);

  const handleSaveDirectEdit = () => {
    if (printAreaRef.current && event?.id) {
      const html = printAreaRef.current.innerHTML;
      try {
        localStorage.setItem(`scms_juknis_custom_html_${event.id}`, html);
        setCustomHtml(html);
        toast.success('Perubahan teks juknis berhasil disimpan!');
      } catch {
        toast.error('Gagal menyimpan perubahan');
      }
    }
  };

  const handleResetDirectEdit = () => {
    if (confirm('Kembalikan seluruh teks juknis ke template awal bawaan sistem? Semua editan teks langsung akan dihapus.')) {
      if (event?.id) {
        try {
          localStorage.removeItem(`scms_juknis_custom_html_${event.id}`);
        } catch {}
      }
      setCustomHtml(null);
      setIsDirectEdit(false);
      toast.info('Juknis telah dikembalikan ke template awal.');
    }
  };

  const handleFormat = (command: 'bold' | 'italic' | 'underline') => {
    if (typeof document !== 'undefined') {
      document.execCommand(command, false);
    }
  };

  const handleOpenEdit = () => {
    setTempConfig(config);
    setOpenEditModal(true);
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    setConfig(tempConfig);
    if (typeof window !== 'undefined' && event?.id) {
      try {
        localStorage.setItem(`scms_juknis_config_${event.id}`, JSON.stringify(tempConfig));
      } catch {}
    }
    setOpenEditModal(false);
  };

  const handleResetConfig = () => {
    if (confirm('Kembalikan petunjuk teknis ke format standar default Rajendra?')) {
      setConfig(defaultJuknis);
      setTempConfig(defaultJuknis);
      if (typeof window !== 'undefined' && event?.id) {
        localStorage.removeItem(`scms_juknis_config_${event.id}`);
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!event) {
    return (
      <Card className="border-dashed p-12 text-center">
        <FileText className="mx-auto mb-3 h-12 w-12 text-muted-foreground/30" />
        <h4 className="text-base font-bold text-foreground">Belum ada event kejuaraan aktif</h4>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Print & Editing Stylesheet */}
      <style jsx global>{`
        .juknis-editing-active [contenteditable="true"] {
          outline: 1.5px dashed rgba(37, 99, 235, 0.45);
          outline-offset: 3px;
          border-radius: 4px;
          cursor: text;
          transition: outline 0.15s, background-color 0.15s, box-shadow 0.15s;
        }
        .juknis-editing-active [contenteditable="true"]:hover {
          outline: 1.5px dashed rgba(37, 99, 235, 0.85);
          background-color: rgba(239, 246, 255, 0.5);
        }
        .juknis-editing-active [contenteditable="true"]:focus {
          outline: 2px solid #2563eb;
          background-color: #ffffff;
          box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.15);
        }

        @media print {
          aside,
          header,
          nav,
          .no-print,
          footer,
          .breadcrumb-container {
            display: none !important;
          }

          .juknis-editing-active [contenteditable="true"],
          [contenteditable] {
            outline: none !important;
            border: none !important;
            box-shadow: none !important;
            background-color: transparent !important;
          }

          @page {
            size: A4 portrait;
            margin: 6mm 8mm;
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

          #juknis-print-area {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .juknis-page {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            height: 284mm !important;
            max-height: 284mm !important;
            min-height: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            background: #ffffff !important;
            padding: 10px 14px 6px 14px !important;
            border: none !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
            position: relative !important;
            overflow: hidden !important;
          }
        }
      `}</style>

      {/* Control Bar (No Print) */}
      <Card className="no-print border-slate-200 shadow-xs">
        <CardContent className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="flex items-center gap-2 text-base font-bold text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                Petunjuk Teknis Perlombaan (Template Haornas Swim Fest)
              </h3>
              {customHtml && (
                <Badge variant="outline" className="border-amber-300 bg-amber-50 text-amber-800 text-[10px] font-bold">
                  Teks Kustom Aktif
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Format buku juknis resmi standar nasional: Logo Rajendra Meet di kiri & Logo Rajendra Organizer di kanan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={event.id}
              onValueChange={(val) => {
                window.location.assign(`/juknis?event=${val}`);
              }}
            >
              <SelectTrigger className="h-9 w-[200px] text-xs">
                <SelectValue placeholder="Pilih Event" />
              </SelectTrigger>
              <SelectContent>
                {eventsList.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Link href={`/buku-acara?event=${event.id}`}>
              <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs font-semibold">
                <BookOpen className="h-4 w-4 text-blue-600" /> Buku Acara (Start List)
              </Button>
            </Link>

            {/* Tombol Mode Edit Langsung (WYSIWYG) */}
            <Button
              variant={isDirectEdit ? 'default' : 'outline'}
              size="sm"
              onClick={() => {
                if (isDirectEdit) {
                  handleSaveDirectEdit();
                  setIsDirectEdit(false);
                } else {
                  setIsDirectEdit(true);
                }
              }}
              className={`h-9 gap-1.5 text-xs font-bold transition-all ${
                isDirectEdit
                  ? 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm ring-2 ring-amber-400/40'
                  : 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100'
              }`}
            >
              <Pencil className="h-4 w-4" />
              {isDirectEdit ? 'Keluar Mode Edit' : 'Edit Juknis Langsung'}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenEdit}
              className="h-9 gap-1.5 text-xs font-semibold"
            >
              <Edit3 className="h-4 w-4 text-primary" /> Sesuaikan Juknis
            </Button>

            <Button onClick={handlePrint} className="h-9 gap-2 text-xs font-bold">
              <Printer className="h-4 w-4" /> Cetak Juknis / PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Floating Sticky Toolbar Saat Mode Edit Langsung Aktif */}
      {isDirectEdit && (
        <div className="no-print sticky top-3 z-50 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-blue-500 bg-slate-900/95 p-3.5 text-white shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-emerald-500"></span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-400">
                  Mode Edit Dokumen Langsung Aktif
                </span>
                <span className="rounded bg-blue-800/80 px-2 py-0.5 text-[10px] font-semibold text-blue-200">
                  WYSIWYG Live
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Klik teks judul, butir peraturan, tabel, atau nomor mana pun pada lembar di bawah untuk langsung mengedit.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center rounded-lg border border-slate-700 bg-slate-800 p-0.5">
              <button
                type="button"
                onClick={() => handleFormat('bold')}
                className="rounded p-1.5 hover:bg-slate-700 text-slate-200 hover:text-white"
                title="Tebal (Ctrl+B)"
              >
                <Bold className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleFormat('italic')}
                className="rounded p-1.5 hover:bg-slate-700 text-slate-200 hover:text-white"
                title="Miring (Ctrl+I)"
              >
                <Italic className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleFormat('underline')}
                className="rounded p-1.5 hover:bg-slate-700 text-slate-200 hover:text-white"
                title="Garis Bawah (Ctrl+U)"
              >
                <Underline className="h-3.5 w-3.5" />
              </button>
            </div>

            <Button
              size="sm"
              onClick={handleSaveDirectEdit}
              className="h-8 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs"
            >
              <Save className="h-3.5 w-3.5" /> Simpan Juknis
            </Button>

            {customHtml && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetDirectEdit}
                className="h-8 gap-1.5 border-slate-700 bg-slate-800 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Reset Default
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                handleSaveDirectEdit();
                setIsDirectEdit(false);
              }}
              className="h-8 text-xs font-semibold text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <Check className="h-3.5 w-3.5 mr-1" /> Selesai
            </Button>
          </div>
        </div>
      )}

      {/* DOKUMEN PETUNJUK TEKNIS (JUKNIS RESMI HAORNAS SWIM FEST TEMPLATE - PRINTABLE) */}
      {customHtml ? (
        <div
          ref={printAreaRef}
          id="juknis-print-area"
          className={`mx-auto max-w-4xl space-y-8 ${isDirectEdit ? 'juknis-editing-active' : ''}`}
          contentEditable={isDirectEdit}
          suppressContentEditableWarning={true}
          dangerouslySetInnerHTML={{ __html: customHtml }}
        />
      ) : (
        <div
          ref={printAreaRef}
          id="juknis-print-area"
          className={`mx-auto max-w-4xl space-y-8 ${isDirectEdit ? 'juknis-editing-active' : ''}`}
          contentEditable={isDirectEdit}
          suppressContentEditableWarning={true}
        >
          {/* ========================================================= */}
          {/* 1. COVER JUKNIS RESMI                                     */}
          {/* ========================================================= */}
          <div className="juknis-page relative flex min-h-[240mm] sm:min-h-[255mm] flex-col justify-between overflow-hidden rounded-2xl border border-slate-300 bg-white p-5 sm:p-6 text-slate-900 shadow-sm print:border-none print:shadow-none print:p-0">
            <HaornasTopRightWave />
            <HaornasBottomLeftWave />

            {/* Watermark Grid Titik-Titik Sisi Kiri (Aman di bawah header) */}
            <div
              contentEditable={false}
              className="pointer-events-none absolute bottom-20 left-0 top-28 z-0 w-20 opacity-25"
              style={{
                backgroundImage: 'radial-gradient(circle, #94a3b8 1.2px, transparent 1.2px)',
                backgroundSize: '14px 14px',
              }}
            />

            {/* Header Bar Cover: Rajendra Meet (Kiri) & Rajendra Organizer (Kanan) */}
            <div className="relative z-10 flex items-center justify-between border-b-2 border-slate-900 pb-2.5 gap-3">
              <div contentEditable={false} className="relative z-20 flex shrink-0 items-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/logo.png"
                  alt="Rajendra Meet"
                  className="h-7.5 w-auto sm:h-8.5 max-w-[115px] object-contain"
                />
              </div>

              <div className="flex-1 px-3 text-center min-w-0">
                <span className="block font-mono text-[11px] sm:text-xs font-black uppercase tracking-widest text-slate-800">
                  OFFICIAL TECHNICAL HANDBOOK
                </span>
                <p className="text-[9px] sm:text-[10px] font-semibold text-slate-500">
                  STANDAR FINA / AKUATIK INDONESIA
                </p>
              </div>

              <div contentEditable={false} className="relative z-20 flex shrink-0 items-center justify-end mr-6 sm:mr-10">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/rajendra-organizer-logo.png"
                  alt="Rajendra Swimming Organizer"
                  className="h-6.5 w-auto sm:h-7.5 max-w-[120px] object-contain"
                />
              </div>
            </div>

          {/* Konten Utama Cover */}
          <div className="relative z-10 my-auto py-3 text-center space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3.5 py-1 text-[11px] font-black uppercase tracking-widest text-blue-900 shadow-2xs">
              <Waves className="h-3.5 w-3.5 text-blue-600" /> BUKU PETUNJUK TEKNIS (JUKNIS)
            </div>

            <h1 className="mx-auto max-w-2xl font-heading text-2xl font-black uppercase leading-tight tracking-tight text-slate-950 sm:text-4xl">
              {config.title}
            </h1>

            <p className="mx-auto max-w-xl text-xs font-semibold text-slate-600 sm:text-sm">
              Peraturan Perlombaan, Tata Tertib, Alokasi Seri & Ketentuan Umum Pelaksanaan Kejuaraan Renang
            </p>

            {/* 2-Column Metadata Box */}
            <div className="mx-auto mt-3.5 grid max-w-2xl grid-cols-1 gap-x-6 gap-y-2 rounded-xl border border-slate-200 bg-slate-50/90 p-3 text-left text-xs sm:grid-cols-2">
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="w-24 font-bold text-slate-600">Place:</span>
                  <span className="font-semibold text-slate-950">{config.tempat}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="w-24 font-bold text-slate-600">Pool:</span>
                  <span className="font-semibold text-slate-950">
                    {event?.poolLengthMeters || 50}m · {event?.laneCount || 8} Lintasan
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="w-32 font-bold text-slate-600">Organizer:</span>
                  <span className="font-semibold text-slate-950">{config.penanggungJawab}</span>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="w-32 font-bold text-slate-600">Competition Date:</span>
                  <span className="font-semibold text-slate-950">{config.tanggalPelaksanaan}</span>
                </div>
              </div>
            </div>

            {/* Ornamen Trofi & Medali */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-800 shadow-2xs">
                <Trophy className="h-4.5 w-4.5 text-amber-600" />
                <div className="text-left">
                  <span className="block font-black text-xs">PIALA & JUARA UMUM</span>
                  <span className="text-[9px] text-amber-700">Best Contingent & Swimmer</span>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-1.5 text-xs font-bold text-slate-700 shadow-2xs">
                <Medal className="h-4.5 w-4.5 text-blue-600" />
                <div className="text-left">
                  <span className="block font-black text-xs">MEDALI & SERTIFIKAT</span>
                  <span className="text-[9px] text-slate-600">Seluruh Atlet Peserta</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Cover */}
          <HaornasSheetFooter
            hotline1={config.hotline1}
            hotline2={config.hotline2}
            sponsors={sponsorsList}
          />
        </div>

        {/* ========================================================= */}
        {/* 2. LEMBAR 1: BUTIR 1 - 5 (INFORMASI UMUM & PESERTA)        */}
        {/* ========================================================= */}
        <div className="juknis-page relative flex min-h-[240mm] sm:min-h-[255mm] flex-col justify-between overflow-hidden rounded-2xl border border-slate-300 bg-white p-5 sm:p-6 text-slate-900 shadow-sm print:border-none print:shadow-none print:p-0">
          <HaornasTopRightWave />
          <HaornasBottomLeftWave />

          <HaornasSheetHeader
            title={config.title}
            venue={config.tempat}
            dates={config.tanggalPelaksanaan}
          />

          {/* Sub-Header Poin Lembar */}
          <div className="relative z-10 mt-1 flex items-center justify-between border-b border-slate-200 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Petunjuk Teknis Kejuaraan
            </span>
            <span className="font-mono text-[10px] font-black uppercase tracking-widest text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded shadow-2xs">
              POIN 1 – 5
            </span>
          </div>

          <div className="relative z-10 flex-1 space-y-2.5 sm:space-y-3 py-2 text-xs leading-normal">
            <section className="space-y-1">
              <h3 className="text-xs sm:text-sm font-black uppercase text-slate-950">1. PENANGGUNG JAWAB</h3>
              <p className="text-slate-700">
                Penanggung Jawab kegiatan ini adalah <b>{config.penanggungJawab}</b>.
              </p>
            </section>

            <section className="space-y-1">
              <h3 className="text-xs sm:text-sm font-black uppercase text-slate-950">2. WAKTU PELAKSANAAN</h3>
              <div className="grid grid-cols-1 gap-1.5 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 sm:grid-cols-2">
                <p><b>Hari:</b> {config.hariPelaksanaan}</p>
                <p><b>Tanggal:</b> {config.tanggalPelaksanaan}</p>
                <p><b>Waktu:</b> {config.waktuPelaksanaan}</p>
                <p><b>Tempat:</b> {config.tempat}</p>
              </div>
            </section>

            <section className="space-y-1">
              <h3 className="text-xs sm:text-sm font-black uppercase text-slate-950">3. PEMONDOKAN DAN AKOMODASI</h3>
              <p className="text-slate-700">
                Pemondokan dan akomodasi peserta merupakan tanggung jawab masing-masing peserta / kontingen.
              </p>
            </section>

            <section className="space-y-1">
              <h3 className="text-xs sm:text-sm font-black uppercase text-slate-950">4. TRANSPORTASI</h3>
              <p className="text-slate-700">
                Transportasi peserta merupakan tanggung jawab masing-masing peserta / kontingen.
              </p>
            </section>

            <section className="space-y-1">
              <h3 className="text-xs sm:text-sm font-black uppercase text-slate-950">5. PERSYARATAN PESERTA</h3>
              <ul className="list-disc space-y-0.5 pl-5 text-slate-700">
                <li>Peserta merupakan perenang yang mewakili perkumpulan renang, satuan pendidikan atau perorangan.</li>
                <li>Klub renang atau satuan pendidikan yang bersangkutan bertanggung jawab penuh atas keabsahan data peserta. Pemalsuan data peserta akan dikenakan sanksi diskualifikasi.</li>
                <li>Peserta yang dikenakan diskualifikasi biaya pendaftaran tidak dikembalikan.</li>
              </ul>
            </section>
          </div>

          <HaornasSheetFooter
            hotline1={config.hotline1}
            hotline2={config.hotline2}
            sponsors={sponsorsList}
          />
        </div>

        {/* ========================================================= */}
        {/* 3. LEMBAR 2: BUTIR 6 - 7 (KELOMPOK USIA & NOMOR LOMBA)     */}
        {/* ========================================================= */}
        <div className="juknis-page relative flex min-h-[240mm] sm:min-h-[255mm] flex-col justify-between overflow-hidden rounded-2xl border border-slate-300 bg-white p-5 sm:p-6 text-slate-900 shadow-sm print:border-none print:shadow-none print:p-0">
          <HaornasTopRightWave />
          <HaornasBottomLeftWave />

          <HaornasSheetHeader
            title={config.title}
            venue={config.tempat}
            dates={config.tanggalPelaksanaan}
          />

          {/* Sub-Header Poin Lembar */}
          <div className="relative z-10 mt-1 flex items-center justify-between border-b border-slate-200 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Petunjuk Teknis Kejuaraan
            </span>
            <span className="font-mono text-[10px] font-black uppercase tracking-widest text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded shadow-2xs">
              POIN 6 – 7
            </span>
          </div>

          <div className="relative z-10 flex-1 space-y-2.5 sm:space-y-3 py-2 text-xs leading-normal">
            <section className="space-y-1.5">
              <h3 className="text-xs sm:text-sm font-black uppercase text-slate-950">6. PENGELOMPOKAN USIA</h3>
              <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 shadow-2xs">
                <div className="space-y-0.5 pl-1.5">
                  <p className="font-bold text-slate-900 text-[11px]">Kelompok Usia Dini:</p>
                  <ul className="list-disc space-y-0.5 pl-4 text-slate-700">
                    <li>U4 (Usia 4 Tahun)</li>
                    <li>U5 (Usia 5 Tahun)</li>
                    <li>U6 (Usia 6 Tahun)</li>
                    <li>U7 (Usia 7 Tahun)</li>
                    <li>U8 (Usia 8 Tahun)</li>
                    <li>U9 (Usia 9 Tahun)</li>
                  </ul>
                </div>
                <div className="space-y-0.5 pl-1.5">
                  <p className="font-bold text-slate-900 text-[11px]">Kelompok Usia Standar:</p>
                  <ul className="list-disc space-y-0.5 pl-4 text-slate-700">
                    <li>U10 (Usia 10 Tahun)</li>
                    <li>U11-12 (Usia 11-12 Tahun)</li>
                    <li>U13-14 (Usia 13-14 Tahun)</li>
                    <li>U15-16 (Usia 15-16 Tahun)</li>
                    <li>U17-18 (Usia 17-18 Tahun)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section className="space-y-1.5">
              <h3 className="text-xs sm:text-sm font-black uppercase text-slate-950">7. NOMOR PERLOMBAAN</h3>
              <div className="overflow-hidden rounded-xl border border-slate-300 shadow-xs">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-300 bg-blue-50/80 font-black text-slate-900">
                      <th className="border-r border-slate-300 p-2 text-center w-12">No</th>
                      <th className="border-r border-slate-300 p-2">Gaya & Jarak Perlombaan</th>
                      <th className="p-2 text-center w-36">Kategori Gender</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr>
                      <td className="border-r border-slate-200 p-1.5 text-center font-bold">1</td>
                      <td className="border-r border-slate-200 p-1.5 font-semibold">25m Gaya Dada (Breaststroke)</td>
                      <td className="p-1.5 text-center">Putra & Putri</td>
                    </tr>
                    <tr>
                      <td className="border-r border-slate-200 p-1.5 text-center font-bold">2</td>
                      <td className="border-r border-slate-200 p-1.5 font-semibold">25m Gaya Bebas (Freestyle)</td>
                      <td className="p-1.5 text-center">Putra & Putri</td>
                    </tr>
                    <tr>
                      <td className="border-r border-slate-200 p-1.5 text-center font-bold">3</td>
                      <td className="border-r border-slate-200 p-1.5 font-semibold">25m Gaya Punggung (Backstroke)</td>
                      <td className="p-1.5 text-center">Putra & Putri</td>
                    </tr>
                    <tr>
                      <td className="border-r border-slate-200 p-1.5 text-center font-bold">4</td>
                      <td className="border-r border-slate-200 p-1.5 font-semibold">25m Gaya Kupu-kupu (Butterfly)</td>
                      <td className="p-1.5 text-center">Putra & Putri</td>
                    </tr>
                    <tr>
                      <td className="border-r border-slate-200 p-1.5 text-center font-bold">5</td>
                      <td className="border-r border-slate-200 p-1.5 font-semibold">50m Gaya Bebas & Gaya Dada</td>
                      <td className="p-1.5 text-center">Putra & Putri</td>
                    </tr>
                    <tr>
                      <td className="border-r border-slate-200 p-1.5 text-center font-bold">6</td>
                      <td className="border-r border-slate-200 p-1.5 font-semibold">100m Gaya Bebas & Estafet</td>
                      <td className="p-1.5 text-center">Putra & Putri</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <HaornasSheetFooter
            hotline1={config.hotline1}
            hotline2={config.hotline2}
            sponsors={sponsorsList}
          />
        </div>

        {/* ========================================================= */}
        {/* 4. LEMBAR 3: BUTIR 8 - 11 (PELAKSANAAN, BIAYA, SANKSI)    */}
        {/* ========================================================= */}
        <div className="juknis-page relative flex min-h-[240mm] sm:min-h-[255mm] flex-col justify-between overflow-hidden rounded-2xl border border-slate-300 bg-white p-5 sm:p-6 text-slate-900 shadow-sm print:border-none print:shadow-none print:p-0">
          <HaornasTopRightWave />
          <HaornasBottomLeftWave />

          <HaornasSheetHeader
            title={config.title}
            venue={config.tempat}
            dates={config.tanggalPelaksanaan}
          />

          {/* Sub-Header Poin Lembar */}
          <div className="relative z-10 mt-1 flex items-center justify-between border-b border-slate-200 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Petunjuk Teknis Kejuaraan
            </span>
            <span className="font-mono text-[10px] font-black uppercase tracking-widest text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded shadow-2xs">
              POIN 8 – 11
            </span>
          </div>

          <div className="relative z-10 flex-1 space-y-2.5 sm:space-y-3 py-2 text-xs leading-normal">
            {/* Poin 8 */}
            <section className="space-y-1">
              <h3 className="text-xs sm:text-sm font-black uppercase text-slate-950">8. PELAKSANAAN ACARA PERLOMBAAN</h3>
              <ul className="space-y-0.5 text-slate-800">
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Peraturan perlombaan menggunakan peraturan Akuatik Indonesia terbaru yang disesuaikan.</span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Semua nomor perlombaan dilaksanakan dengan format <b>Time Final</b>.</span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Kategori Fun Swimming menggunakan 3 (Tiga) Lintasan 25M SCM Per Seri.</span>
                </li>
              </ul>
            </section>

            {/* Poin 9 */}
            <section className="space-y-1">
              <h3 className="text-xs sm:text-sm font-black uppercase text-slate-950">9. METODE PENDAFTARAN</h3>
              <p className="text-slate-800">
                Pendaftaran dilakukan melalui Sistem SCMS Resmi Rajendra Meet pada tautan portal resmi pendaftaran kejuaraan atau Formulir Digital resmi yang disediakan oleh panitia.
              </p>
            </section>

            {/* Poin 10 */}
            <section className="space-y-1">
              <h3 className="text-xs sm:text-sm font-black uppercase text-slate-950">10. BIAYA REGISTRASI</h3>
              <ul className="space-y-1 text-slate-800">
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Biaya Registrasi sebesar <b>{config.biayaPaket}</b></span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Pembayaran paling lambat <b>{config.batasPendaftaran}</b></span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Pembayaran melalui transfer ke Rekening <b>{config.rekeningBank}</b></span>
                </li>
                <li className="flex items-baseline gap-2 font-bold text-rose-700">
                  <span>•</span>
                  <span>Panitia TIDAK menerima pembayaran secara tunai di lokasi perlombaan.</span>
                </li>
              </ul>
            </section>

            {/* Poin 11 */}
            <section className="space-y-1">
              <h3 className="text-xs sm:text-sm font-black uppercase text-slate-950">11. SANKSI</h3>
              <ul className="space-y-0.5 text-slate-800">
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Peserta yang terbukti melakukan pemalsuan data akan dikenakan sanksi diskualifikasi.</span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Peserta yang terlambat atau tidak hadir dianggap mengundurkan diri (DNS).</span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Peserta yang dikenakan sanksi diskualifikasi ataupun mengundurkan diri uang pendaftaran tidak dikembalikan.</span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Peserta yang dikenakan diskualifikasi ataupun tidak hadir tetap berhak mendapatkan medali dan sertifikat peserta.</span>
                </li>
              </ul>
            </section>
          </div>

          <HaornasSheetFooter
            hotline1={config.hotline1}
            hotline2={config.hotline2}
            sponsors={sponsorsList}
          />
        </div>

        {/* ========================================================= */}
        {/* 5. LEMBAR 4: BUTIR 12 - 14 (HADIAH DAN PENGHARGAAN)       */}
        {/* PERSIS MODELING HAORNAS SWIM FEST 2026                    */}
        {/* ========================================================= */}
        <div className="juknis-page relative flex min-h-[240mm] sm:min-h-[255mm] flex-col justify-between overflow-hidden rounded-2xl border border-slate-300 bg-white p-5 sm:p-6 text-slate-900 shadow-sm print:border-none print:shadow-none print:p-0">
          <HaornasTopRightWave />
          <HaornasBottomLeftWave />

          <HaornasSheetHeader
            title={config.title}
            venue={config.tempat}
            dates={config.tanggalPelaksanaan}
          />

          {/* Sub-Header Poin Lembar */}
          <div className="relative z-10 mt-1 flex items-center justify-between border-b border-slate-200 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Petunjuk Teknis Kejuaraan
            </span>
            <span className="font-mono text-[10px] font-black uppercase tracking-widest text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded shadow-2xs">
              POIN 12 – 14
            </span>
          </div>

          <div className="relative z-10 flex-1 space-y-2.5 sm:space-y-3 py-2 text-xs leading-normal">
            {/* Poin 12: HADIAH DAN PENGHARGAAN (TABULAR FORMAT MIRIP HAORNAS SWIM FEST) */}
            <section className="space-y-1.5">
              <h3 className="text-xs sm:text-sm font-black uppercase tracking-tight text-slate-950">
                12. HADIAH DAN PENGHARGAAN
              </h3>

              <div className="space-y-1.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 text-xs">
                {/* Best Contingent */}
                <div className="grid grid-cols-[130px_1fr] items-start gap-1 sm:grid-cols-[150px_1fr]">
                  <span className="font-bold text-slate-900">• Best Contingent</span>
                  <div className="space-y-0.5 text-slate-800">
                    <div>: - Uang Pembinaan & Piala Tetap</div>
                    <div>&nbsp;&nbsp;- Prizeboard & Sertifikat Eksklusif</div>
                  </div>
                </div>

                {/* Best Swimmer */}
                <div className="grid grid-cols-[130px_1fr] items-start gap-1 sm:grid-cols-[150px_1fr]">
                  <span className="font-bold text-slate-900">• Best Swimmer</span>
                  <div className="space-y-0.5 text-slate-800">
                    <div>: - Uang Pembinaan & Piala Tetap</div>
                    <div>&nbsp;&nbsp;- Prizeboard & Sertifikat Eksklusif</div>
                  </div>
                </div>

                {/* Best Time Acara */}
                <div className="grid grid-cols-[130px_1fr] items-start gap-1 sm:grid-cols-[150px_1fr]">
                  <span className="font-bold text-slate-900">• Best Time Acara</span>
                  <div className="space-y-0.5 text-slate-800">
                    <div>: - Piala Tetap & Sertifikat Eksklusif</div>
                  </div>
                </div>

                {/* Peserta */}
                <div className="grid grid-cols-[130px_1fr] items-start gap-1 sm:grid-cols-[150px_1fr]">
                  <span className="font-bold text-slate-900">• Peserta</span>
                  <div className="space-y-0.5 text-slate-800">
                    <div>: - Medali Eksklusif & Sertifikat</div>
                  </div>
                </div>
              </div>
            </section>

            {/* Poin 13 */}
            <section className="space-y-1">
              <h3 className="text-xs sm:text-sm font-black uppercase text-slate-950">13. KETENTUAN BEST SWIMMER</h3>
              <ul className="space-y-0.5 text-slate-800">
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Best Swimmer diberikan kepada Setiap Kelompok Usia Putra dan Putri.</span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Best Swimmer ditentukan dari jumlah perolehan Best Time Acara 1, 2 dan 3 dari seluruh acara yang ada pada Kelompok Usianya.</span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Jika perolehan Best Time Acara sama besarnya maka akan diambil perenang dengan usia termuda.</span>
                </li>
              </ul>
            </section>

            {/* Poin 14 */}
            <section className="space-y-1">
              <h3 className="text-xs sm:text-sm font-black uppercase text-slate-950">14. KETENTUAN BEST CONTINGENT</h3>
              <p className="text-slate-800">
                Best Contingent (Juara Umum Perkumpulan/Sekolah) ditentukan dari banyaknya jumlah perolehan Best Time Acara 1, 2 dan 3 yang didapat oleh kontingen dari seluruh nomor perlombaan.
              </p>
            </section>
          </div>

          <HaornasSheetFooter
            hotline1={config.hotline1}
            hotline2={config.hotline2}
            sponsors={sponsorsList}
          />
        </div>

        {/* ========================================================= */}
        {/* 6. LEMBAR 5: BUTIR 15 - 18 (HASIL, WITHDRAWAL, BANDING, TM)*/}
        {/* ========================================================= */}
        <div className="juknis-page relative flex min-h-[240mm] sm:min-h-[255mm] flex-col justify-between overflow-hidden rounded-2xl border border-slate-300 bg-white p-5 sm:p-6 text-slate-900 shadow-sm print:border-none print:shadow-none print:p-0">
          <HaornasTopRightWave />
          <HaornasBottomLeftWave />

          <HaornasSheetHeader
            title={config.title}
            venue={config.tempat}
            dates={config.tanggalPelaksanaan}
          />

          {/* Sub-Header Poin Lembar */}
          <div className="relative z-10 mt-1 flex items-center justify-between border-b border-slate-200 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Petunjuk Teknis Kejuaraan
            </span>
            <span className="font-mono text-[10px] font-black uppercase tracking-widest text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded shadow-2xs">
              POIN 15 – 18
            </span>
          </div>

          <div className="relative z-10 flex-1 space-y-2.5 sm:space-y-3 py-2 text-xs leading-normal">
            {/* Poin 15 */}
            <section className="space-y-1">
              <h3 className="text-xs sm:text-sm font-black uppercase text-slate-950">15. HASIL PERLOMBAAN DAN PENGHARGAAN</h3>
              <ul className="space-y-0.5 text-slate-800">
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Hasil perlombaan akan dirilis secara real-time pada Live Scoreboard SCMS dan dibagikan ke WhatsApp Grup Resmi.</span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Peserta akan diberikan medali dan sertifikat begitu menyelesaikan nomor lomba (finish).</span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Untuk Best Time Acara sertifikat akan tersedia maksimal 2 jam setelah hasil rilis resmi.</span>
                </li>
              </ul>
            </section>

            {/* Poin 16 */}
            <section className="space-y-1">
              <h3 className="text-xs sm:text-sm font-black uppercase text-slate-950">16. PENGUNDURAN DIRI / DNS / WITHDRAWAL</h3>
              <ul className="space-y-0.5 text-slate-800">
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Pengunduran Diri / Refund paling lambat diajukan 30 hari sebelum kegiatan berlangsung.</span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Peserta yang mengundurkan diri saat ataupun setelah Technical Meeting berlangsung tidak ada pengembalian biaya pendaftaran.</span>
                </li>
              </ul>
            </section>

            {/* Poin 17 */}
            <section className="space-y-1">
              <h3 className="text-xs sm:text-sm font-black uppercase text-slate-950">17. BANDING / PROTES</h3>
              <ul className="space-y-0.5 text-slate-800">
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Banding atau protes pada hasil perlombaan harus diajukan oleh Tim Manajer atau Official Kontingen yang mengikuti technical meeting.</span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Pengajuan banding atau protes harus secara tertulis dengan mengisi form protes yang disediakan serta menyerahkan deposit sebesar <b>{config.depositBanding}</b>.</span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Banding atau protes harus diajukan paling lambat <b>30 (Tiga Puluh) menit</b> setelah hasil perlombaan diumumkan.</span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Jika banding atau protes diterima maka uang deposit akan dikembalikan utuh, namun jika ditolak maka uang deposit dianggap hangus.</span>
                </li>
              </ul>
            </section>

            {/* Poin 18 */}
            <section className="space-y-1">
              <h3 className="text-xs sm:text-sm font-black uppercase text-slate-950">18. TECHNICAL MEETING (TM)</h3>
              <div className="space-y-0.5 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5 text-slate-800">
                <p>• Hari/Tanggal: <b>{config.jadwalTM}</b></p>
                <p>• Waktu: <b>{config.waktuTM}</b></p>
                <p>• Media: <b>Online Virtual Meeting (Zoom)</b> ({config.linkZoomTM})</p>
              </div>
            </section>
          </div>

          <HaornasSheetFooter
            hotline1={config.hotline1}
            hotline2={config.hotline2}
            sponsors={sponsorsList}
          />
        </div>

        {/* ========================================================= */}
        {/* 7. LEMBAR 6: BUTIR 19 - 20 (HAL LAINNYA & PEMBAGIAN SESI)  */}
        {/* ========================================================= */}
        <div className="juknis-page relative flex min-h-[240mm] sm:min-h-[255mm] flex-col justify-between overflow-hidden rounded-2xl border border-slate-300 bg-white p-5 sm:p-6 text-slate-900 shadow-sm print:border-none print:shadow-none print:p-0">
          <HaornasTopRightWave />
          <HaornasBottomLeftWave />

          <HaornasSheetHeader
            title={config.title}
            venue={config.tempat}
            dates={config.tanggalPelaksanaan}
          />

          {/* Sub-Header Poin Lembar */}
          <div className="relative z-10 mt-1 flex items-center justify-between border-b border-slate-200 pb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Petunjuk Teknis Kejuaraan
            </span>
            <span className="font-mono text-[10px] font-black uppercase tracking-widest text-blue-900 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded shadow-2xs">
              POIN 19 – 20
            </span>
          </div>

          <div className="relative z-10 flex-1 space-y-2.5 sm:space-y-3 py-2 text-xs leading-normal">
            {/* Poin 19 */}
            <section className="space-y-1">
              <h3 className="text-xs sm:text-sm font-black uppercase text-slate-950">19. HAL-HAL LAINNYA</h3>
              <ul className="space-y-0.5 text-slate-800">
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Hal-hal yang belum tercantum pada juknis kegiatan akan dibahas pada Technical Meeting.</span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Panitia menyediakan Buku Acara digital yang dapat diunduh melalui platform SCMS.</span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>Tim Medis yang disediakan oleh panitia meliputi 1 Unit Ambulance, 1 Dokter dan Paramedis di arena.</span>
                </li>
                <li className="flex items-baseline gap-2">
                  <span>•</span>
                  <span>
                    Peserta wajib bergabung ke Grup WhatsApp Peserta:{' '}
                    <span className="font-mono font-bold text-primary">{config.linkWAG}</span>
                  </span>
                </li>
              </ul>
            </section>

            {/* Poin 20 */}
            <section className="space-y-1.5">
              <h3 className="text-xs sm:text-sm font-black uppercase text-slate-950">20. PEMBAGIAN SESI PERLOMBAAN</h3>
              <div className="overflow-hidden rounded-xl border border-slate-300 shadow-xs">
                <table className="w-full border-collapse text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-300 bg-amber-300 text-center font-black text-slate-950">
                      <th className="w-1/2 border-r border-slate-300 p-2">HARI PERTAMA (SESI 1)</th>
                      <th className="w-1/2 p-2">HARI KEDUA (SESI 2)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="divide-x divide-slate-200 align-top">
                      <td className="bg-slate-50/50 p-2">
                        <ul className="list-disc space-y-0.5 pl-4 font-semibold text-slate-800">
                          <li>U4 (Usia 4 Tahun)</li>
                          <li>U5 (Usia 5 Tahun)</li>
                          <li>U8 (Usia 8 Tahun)</li>
                          <li>U9 (Usia 9 Tahun)</li>
                          <li>U15-16 (Usia 15-16 Tahun)</li>
                          <li>U17-18 (Usia 17-18 Tahun)</li>
                        </ul>
                      </td>
                      <td className="bg-white p-2">
                        <ul className="list-disc space-y-0.5 pl-4 font-semibold text-slate-800">
                          <li>U6 (Usia 6 Tahun)</li>
                          <li>U7 (Usia 7 Tahun)</li>
                          <li>U10 (Usia 10 Tahun)</li>
                          <li>U11-12 (Usia 11-12 Tahun)</li>
                          <li>U13-14 (Usia 13-14 Tahun)</li>
                        </ul>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-center text-[10px] sm:text-[11px] italic text-slate-500">
                *Jika kuota peserta disesuaikan untuk 1 hari, maka seluruh sesi akan dilaksanakan pada hari Minggu.
              </p>
            </section>
          </div>

          <HaornasSheetFooter
            hotline1={config.hotline1}
            hotline2={config.hotline2}
            sponsors={sponsorsList}
          />
        </div>
      </div>
    )}

      {/* ========================================================= */}
      {/* MODAL KUSTOMISASI DATA JUKNIS                             */}
      {/* ========================================================= */}
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent className="max-h-[85vh] overflow-y-auto p-6 sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Edit3 className="h-5 w-5 text-primary" /> Sesuaikan Data Petunjuk Teknis (Juknis)
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveConfig} className="space-y-4 pt-2 text-xs">
            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Judul Kejuaraan</label>
              <Input
                value={tempConfig.title}
                onChange={(e) => setTempConfig((s) => ({ ...s, title: e.target.value }))}
                className="h-9 text-xs"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Penanggung Jawab</label>
                <Input
                  value={tempConfig.penanggungJawab}
                  onChange={(e) => setTempConfig((s) => ({ ...s, penanggungJawab: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Tempat / Venue Kolam</label>
                <Input
                  value={tempConfig.tempat}
                  onChange={(e) => setTempConfig((s) => ({ ...s, tempat: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Tanggal Pelaksanaan</label>
                <Input
                  value={tempConfig.tanggalPelaksanaan}
                  onChange={(e) => setTempConfig((s) => ({ ...s, tanggalPelaksanaan: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Waktu Pelaksanaan</label>
                <Input
                  value={tempConfig.waktuPelaksanaan}
                  onChange={(e) => setTempConfig((s) => ({ ...s, waktuPelaksanaan: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Batas Waktu Pendaftaran</label>
                <Input
                  value={tempConfig.batasPendaftaran}
                  onChange={(e) => setTempConfig((s) => ({ ...s, batasPendaftaran: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Biaya Registrasi Paket</label>
                <Input
                  value={tempConfig.biayaPaket}
                  onChange={(e) => setTempConfig((s) => ({ ...s, biayaPaket: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Biaya Tambahan Nomor</label>
                <Input
                  value={tempConfig.biayaTambahan}
                  onChange={(e) => setTempConfig((s) => ({ ...s, biayaTambahan: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Rekening Transfer Panitia</label>
                <Input
                  value={tempConfig.rekeningBank}
                  onChange={(e) => setTempConfig((s) => ({ ...s, rekeningBank: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Hotline WhatsApp 1</label>
                <Input
                  value={tempConfig.hotline1}
                  onChange={(e) => setTempConfig((s) => ({ ...s, hotline1: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Hotline WhatsApp 2</label>
                <Input
                  value={tempConfig.hotline2}
                  onChange={(e) => setTempConfig((s) => ({ ...s, hotline2: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Deposit Banding / Protes</label>
                <Input
                  value={tempConfig.depositBanding}
                  onChange={(e) => setTempConfig((s) => ({ ...s, depositBanding: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-foreground">Jadwal Technical Meeting</label>
                <Input
                  value={tempConfig.jadwalTM}
                  onChange={(e) => setTempConfig((s) => ({ ...s, jadwalTM: e.target.value }))}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-bold text-foreground">Tautan WhatsApp Group Peserta</label>
              <Input
                value={tempConfig.linkWAG}
                onChange={(e) => setTempConfig((s) => ({ ...s, linkWAG: e.target.value }))}
                className="h-9 text-xs"
              />
            </div>

            <DialogFooter className="flex items-center justify-between border-t pt-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetConfig}
                className="text-xs text-rose-600"
              >
                <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset Default
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setOpenEditModal(false)}>
                  Batal
                </Button>
                <Button type="submit" size="sm" className="text-xs font-bold">
                  Simpan Perubahan
                </Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
