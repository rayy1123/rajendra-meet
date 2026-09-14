'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  ShieldCheck,
  Trophy,
  Medal,
  Phone,
  Edit3,
  RotateCcw,
  BookOpen,
  Upload,
  Trash2,
} from 'lucide-react';
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
  mainSponsorLogo?: string;
  mainSponsorName?: string;
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
    title: event?.name || 'BHARADUTA FUN SWIMMING SERIES III',
    penanggungJawab: event?.organizer || 'Yayasan Bharaduta D’Pandiaga Nusantara',
    hariPelaksanaan: 'Sabtu s/d Minggu',
    tanggalPelaksanaan: event?.startDate
      ? new Date(event.startDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
      : '14-15 November 2026',
    waktuPelaksanaan: '07.30 WIB s/d Selesai',
    tempat: event?.location || 'Kolam Renang GOR Ciracas, Jakarta Timur',
    batasPendaftaran: '30 Oktober 2026',
    hotline1: '088 77 151189',
    hotline2: '088 999 151189',
    biayaPaket: 'Rp. 275.000 Per Siswa Untuk 3 Nomor Perlombaan',
    biayaTambahan: 'Rp. 80.000 Per Nomor Lomba',
    rekeningBank: 'BNI 557681155 a.n Sutrisno',
    depositBanding: 'Rp. 2.500.000 (Dua Juta Lima Ratus Ribu Rupiah)',
    jadwalTM: 'Sabtu, 27 Juni 2026',
    waktuTM: '19.30 WIB s/d Selesai',
    linkZoomTM: 'Menyusul di Grup WhatsApp Peserta',
    linkWAG: 'https://chat.whatsapp.com/CkKuzAEanbq4FAyJ84L87A',
    mainSponsorLogo: '',
    mainSponsorName: '',
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

  const handleMainSponsorUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      alert('Ukuran gambar sponsor maksimal 1MB!');
      return;
    }
    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      const updated = { ...config, mainSponsorLogo: dataUrl };
      setConfig(updated);
      setTempConfig(updated);
      if (typeof window !== 'undefined' && event?.id) {
        try {
          localStorage.setItem(`scms_juknis_config_${event.id}`, JSON.stringify(updated));
        } catch {}
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMainSponsor = () => {
    const updated = { ...config, mainSponsorLogo: '', mainSponsorName: '' };
    setConfig(updated);
    setTempConfig(updated);
    if (typeof window !== 'undefined' && event?.id) {
      try {
        localStorage.setItem(`scms_juknis_config_${event.id}`, JSON.stringify(updated));
      } catch {}
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
      <Card className="p-12 text-center border-dashed">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
        <h4 className="text-base font-bold text-foreground">Belum ada event kejuaraan aktif</h4>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Print Stylesheet */}
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
            margin: 12mm;
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
          }

          .juknis-page {
            page-break-after: always !important;
            break-after: page !important;
            min-height: 265mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: #ffffff !important;
            padding: 20px 0 !important;
            border: none !important;
            box-shadow: none !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>

      {/* Control Bar (No Print) */}
      <Card className="no-print border-slate-200 shadow-xs">
        <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Petunjuk Teknis Perlombaan (Juknis 20 Poin)
            </h3>
            <p className="text-xs text-muted-foreground">
              Dokumen regulasi resmi kejuaraan renang sesuai format standar 20 poin kejuaraan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={event.id}
              onValueChange={(val) => {
                window.location.assign(`/juknis?event=${val}`);
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

            <Link href={`/buku-acara?event=${event.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold h-9">
                <BookOpen className="h-4 w-4 text-blue-600" /> Buku Acara (Start List)
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenEdit}
              className="gap-1.5 text-xs font-semibold h-9"
            >
              <Edit3 className="h-4 w-4 text-primary" /> Sesuaikan Juknis
            </Button>

            <Button onClick={handlePrint} className="gap-2 text-xs font-bold h-9">
              <Printer className="h-4 w-4" /> Cetak Juknis / PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* DOKUMEN PETUNJUK TEKNIS (JUKNIS RESMI RAJENDRA - PRINTABLE) */}
      <div id="juknis-print-area" className="space-y-8 max-w-4xl mx-auto">
        {/* ========================================================= */}
        {/* 1. COVER JUKNIS RESMI                                     */}
        {/* ========================================================= */}
        <div className="juknis-page relative rounded-2xl border border-slate-200 print:border-none print:shadow-none bg-white p-8 sm:p-12 text-center shadow-md space-y-6 overflow-hidden">
          {/* Header Bar: Sponsor Utama & Logo Kejuaraan (Template Header Resmi) */}
          <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4 gap-4">
            {/* Slot Sponsor Utama Kejuaraan */}
            <div className="flex items-center gap-3">
              {config.mainSponsorLogo ? (
                <div className="flex items-center gap-2 relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={config.mainSponsorLogo}
                    alt={config.mainSponsorName || 'Sponsor Utama'}
                    className="h-12 sm:h-14 max-w-[180px] object-contain"
                  />
                  <div className="no-print hidden group-hover:flex items-center gap-1.5 ml-2">
                    <label className="cursor-pointer text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2 py-1 rounded border shadow-xs">
                      Ganti Logo
                      <input type="file" accept="image/*" className="hidden" onChange={handleMainSponsorUpload} />
                    </label>
                    <button
                      type="button"
                      onClick={handleRemoveMainSponsor}
                      className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold px-2 py-1 rounded border border-rose-200 shadow-xs flex items-center gap-0.5"
                    >
                      <Trash2 className="h-3 w-3" /> Hapus
                    </button>
                  </div>
                </div>
              ) : sponsorsList.find((s) => s.tier === 'title')?.logoUrl ? (
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sponsorsList.find((s) => s.tier === 'title')!.logoUrl}
                    alt="Sponsor Utama"
                    className="h-12 sm:h-14 max-w-[180px] object-contain"
                  />
                  <label className="no-print cursor-pointer text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold px-2 py-1 rounded border shadow-xs ml-2">
                    Upload Logo Lain
                    <input type="file" accept="image/*" className="hidden" onChange={handleMainSponsorUpload} />
                  </label>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/brand/logo.png" alt="Logo Kejuaraan" className="h-12 sm:h-14 w-auto object-contain" />
                  <label className="no-print cursor-pointer border border-dashed border-slate-300 hover:border-blue-500 rounded-lg px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:bg-blue-50/50 flex items-center gap-1">
                    <Upload className="h-3.5 w-3.5 text-blue-600" />
                    + Sponsor
                    <input type="file" accept="image/*" className="hidden" onChange={handleMainSponsorUpload} />
                  </label>
                </div>
              )}
            </div>

            {/* Judul Tengah Header Bar */}
            <div className="text-center flex-1 px-4">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Official Technical Handbook
              </h2>
            </div>

            {/* Logo Kejuaraan Saja di Sisi Kanan */}
            <div className="flex items-center text-right">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo.png" alt="Logo Kejuaraan" className="h-12 sm:h-14 w-auto object-contain" />
            </div>
          </div>

          {/* Judul Besar Kejuaraan */}
          <div className="py-5 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-900 font-black text-xs uppercase tracking-widest">
              <Waves className="h-4 w-4 text-blue-600" /> BUKU PETUNJUK TEKNIS (JUKNIS)
            </div>

            <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-slate-950 font-serif leading-tight">
              {config.title}
            </h1>

            <p className="text-sm font-semibold text-slate-600 max-w-xl mx-auto">
              Peraturan Perlombaan, Tata Tertib, Alokasi Seri & Ketentuan Umum Pelaksanaan Kejuaraan
            </p>
          </div>

          {/* 2-Column Metadata Grid (Sesuai Template Header Resmi) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2 max-w-2xl mx-auto rounded-xl border border-slate-200 bg-slate-50/90 p-4 text-xs text-left">
            <div className="space-y-1.5">
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
            <div className="space-y-1.5">
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

          {/* Trofi & Medali Ornamen Visual */}
          <div className="py-2 flex items-center justify-center gap-6">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl">
              <Trophy className="h-5 w-5 text-amber-600" />
              <div className="text-left">
                <span className="block font-black">PIALA & JUARA UMUM</span>
                <span className="text-[10px] text-amber-800">Best Contingent & Swimmer</span>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl">
              <Medal className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <span className="block font-black">MEDALI & SERTIFIKAT</span>
                <span className="text-[10px] text-slate-600">Seluruh Atlet Peserta</span>
              </div>
            </div>
          </div>

          {/* Bottom Bar Cover Resmi */}
          <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div className="flex items-center gap-2 font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-blue-600" />
              Buku Panduan & Petunjuk Teknis Resmi Kejuaraan Renang (Juknis)
            </div>
            <div className="font-semibold text-slate-700">
              Diselenggarakan oleh {config.penanggungJawab}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 2. LEMBAR 1: BUTIR 1 - 5 (INFORMASI UMUM & PESERTA)        */}
        {/* ========================================================= */}
        <div className="juknis-page rounded-2xl border border-slate-300 bg-white p-8 sm:p-10 shadow-sm space-y-6 text-slate-900">
          <div className="border-b pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-base font-black uppercase tracking-tight text-slate-900">
                {config.title}
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">POIN 1 – 5</span>
          </div>

          <div className="space-y-4 text-xs leading-relaxed">
            {/* Poin 1 */}
            <section className="space-y-1">
              <h3 className="font-black text-sm text-slate-950 uppercase">1. PENANGGUNG JAWAB</h3>
              <p className="text-slate-700">
                Penanggung Jawab kegiatan ini Adalah <b>{config.penanggungJawab}</b>.
              </p>
            </section>

            {/* Poin 2 */}
            <section className="space-y-1.5">
              <h3 className="font-black text-sm text-slate-950 uppercase">2. WAKTU PELAKSANAAN</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p><b>Hari:</b> {config.hariPelaksanaan}</p>
                <p><b>Tanggal:</b> {config.tanggalPelaksanaan}</p>
                <p><b>Waktu:</b> {config.waktuPelaksanaan}</p>
                <p><b>Tempat:</b> {config.tempat}</p>
              </div>
            </section>

            {/* Poin 3 */}
            <section className="space-y-1">
              <h3 className="font-black text-sm text-slate-950 uppercase">3. PEMONDOKAN DAN AKOMODASI</h3>
              <p className="text-slate-700">
                Pemondokan dan akomodasi peserta merupakan tanggung jawab masing-masing peserta / kontingen.
              </p>
            </section>

            {/* Poin 4 */}
            <section className="space-y-1">
              <h3 className="font-black text-sm text-slate-950 uppercase">4. TRANSPORTASI</h3>
              <p className="text-slate-700">
                Transportasi peserta merupakan tanggung jawab masing-masing peserta / kontingen.
              </p>
            </section>

            {/* Poin 5 */}
            <section className="space-y-1.5">
              <h3 className="font-black text-sm text-slate-950 uppercase">5. PERSYARATAN PESERTA</h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>Peserta merupakan perenang yang mewakili perkumpulan renang, satuan Pendidikan atau Pribadi.</li>
                <li>Klub renang atau satuan Pendidikan yang bersangkutan bertanggung jawab penuh atas keabsahan data peserta. Pemalsuan data peserta akan dikenakan sanksi diskualifikasi.</li>
                <li>Peserta yang dikenakan diskualifikasi biaya pendaftaran tidak dikembalikan.</li>
              </ul>
            </section>
          </div>

          {/* Footer Bar Batas Pendaftaran & Kontak */}
          <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Calendar className="h-4 w-4 text-primary" /> Batas Pendaftaran: {config.batasPendaftaran}
            </div>
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Phone className="h-4 w-4 text-emerald-600" /> Hotline: {config.hotline1} | {config.hotline2}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 3. LEMBAR 2: BUTIR 6 - 7 (KELOMPOK USIA & NOMOR LOMBA)     */}
        {/* ========================================================= */}
        <div className="juknis-page rounded-2xl border border-slate-300 bg-white p-8 sm:p-10 shadow-sm space-y-6 text-slate-900">
          <div className="border-b pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-base font-black uppercase tracking-tight text-slate-900">
                {config.title}
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">POIN 6 – 7</span>
          </div>

          <div className="space-y-5 text-xs">
            {/* Poin 6 */}
            <section className="space-y-2">
              <h3 className="font-black text-sm text-slate-950 uppercase">6. PENGELOMPOKAN USIA</h3>
              <div className="grid grid-cols-2 gap-4 border border-slate-300 rounded-xl p-3 bg-white">
                <div className="space-y-1 pl-2">
                  <p className="font-bold text-slate-800">Kelompok Usia Dini:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                    <li>U4 (Usia 4 Tahun)</li>
                    <li>U5 (Usia 5 Tahun)</li>
                    <li>U6 (Usia 6 Tahun)</li>
                    <li>U7 (Usia 7 Tahun)</li>
                    <li>U8 (Usia 8 Tahun)</li>
                    <li>U9 (Usia 9 Tahun)</li>
                    <li>U10 (Usia 10 Tahun)</li>
                  </ul>
                </div>
                <div className="space-y-1 pl-2 border-l border-slate-200">
                  <p className="font-bold text-slate-800">Kelompok Pelajar & Lanjutan:</p>
                  <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                    <li>U11-12 (Usia 11-12 Tahun)</li>
                    <li>U13-14 (Usia 13-14 Tahun)</li>
                    <li>U15-16 (Usia 15-16 Tahun)</li>
                    <li>U17-18 (Usia 17-18 Tahun)</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Poin 7 */}
            <section className="space-y-2">
              <h3 className="font-black text-sm text-slate-950 uppercase">7. NOMOR PERLOMBAAN</h3>
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-amber-300 text-slate-950 font-black border-b border-slate-300">
                      <th className="p-2.5 w-1/3 border-r border-slate-300">KELOMPOK USIA (PUTRA / PUTRI)</th>
                      <th className="p-2.5">NOMOR PERLOMBAAN</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    <tr className="align-top">
                      <td className="p-2.5 font-semibold bg-slate-50/50 border-r border-slate-200">
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                          <li>U4 (Usia 4 Tahun)</li>
                          <li>U5 (Usia 5 Tahun)</li>
                          <li>U6 (Usia 6 Tahun)</li>
                          <li>U7 (Usia 7 Tahun)</li>
                          <li>U8 (Usia 8 Tahun)</li>
                          <li>U9 (Usia 9 Tahun)</li>
                          <li>U10 (Usia 10 Tahun)</li>
                        </ul>
                      </td>
                      <td className="p-2.5">
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-800 font-medium">
                          <li>25M Papan Kaki Bebas</li>
                          <li>25M Papan Kaki Bebas Fins</li>
                          <li>25M Gaya Bebas</li>
                          <li>25M Gaya Bebas Fins</li>
                          <li>25M Gaya Dada</li>
                          <li>25M Gaya Kupu Fins</li>
                          <li>25M Gaya Punggung</li>
                        </ul>
                      </td>
                    </tr>
                    <tr className="align-top">
                      <td className="p-2.5 font-semibold bg-slate-50/50 border-r border-slate-200">
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                          <li>U11-12 (Usia 11-12 Tahun)</li>
                          <li>U13-14 (Usia 13-14 Tahun)</li>
                          <li>U15-16 (Usia 15-16 Tahun)</li>
                          <li>U17-18 (Usia 17-18 Tahun)</li>
                        </ul>
                      </td>
                      <td className="p-2.5">
                        <ul className="list-disc pl-4 space-y-0.5 text-slate-800 font-medium">
                          <li>25M Gaya Bebas</li>
                          <li>25M Gaya Dada</li>
                          <li>25M Gaya Kupu-Kupu</li>
                          <li>25M Gaya Punggung</li>
                          <li>50M Gaya Bebas Fins</li>
                          <li>50M Gaya Dada</li>
                          <li>50M Gaya Kupu Fins</li>
                        </ul>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          {/* Footer Bar */}
          <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Calendar className="h-4 w-4 text-primary" /> Batas Pendaftaran: {config.batasPendaftaran}
            </div>
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Phone className="h-4 w-4 text-emerald-600" /> Hotline: {config.hotline1} | {config.hotline2}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 4. LEMBAR 3: BUTIR 8 - 11 (PELAKSANAAN, BIAYA, SANKSI)    */}
        {/* ========================================================= */}
        <div className="juknis-page rounded-2xl border border-slate-300 bg-white p-8 sm:p-10 shadow-sm space-y-6 text-slate-900">
          <div className="border-b pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-base font-black uppercase tracking-tight text-slate-900">
                {config.title}
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">POIN 8 – 11</span>
          </div>

          <div className="space-y-4 text-xs leading-relaxed">
            {/* Poin 8 */}
            <section className="space-y-1">
              <h3 className="font-black text-sm text-slate-950 uppercase">8. PELAKSANAAN ACARA PERLOMBAAN</h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>Peraturan perlombaan menggunakan peraturan Akuatik Indonesia terbaru yang disesuaikan.</li>
                <li>Semua nomor perlombaan dilaksanakan dengan format <b>Time Final</b>.</li>
                <li>Perlombaan menggunakan 3 (Tiga) Lintasan 25M SCM Per Seri.</li>
              </ul>
            </section>

            {/* Poin 9 */}
            <section className="space-y-1">
              <h3 className="font-black text-sm text-slate-950 uppercase">9. METODE PENDAFTARAN</h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>Melalui Sistem SCMS Resmi / Form Online Resmi.</li>
                <li>Form Excel (Khusus Perkumpulan / Satuan Pendidikan Minimal 5 Siswa).</li>
              </ul>
            </section>

            {/* Poin 10 */}
            <section className="space-y-1.5">
              <h3 className="font-black text-sm text-slate-950 uppercase">10. BIAYA REGISTRASI</h3>
              <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 space-y-1 text-slate-800">
                <p>• Biaya Registrasi: <b>{config.biayaPaket}</b></p>
                <p>• Tambahan Nomor Perlombaan: <b>{config.biayaTambahan}</b></p>
                <p>• Pembayaran paling lambat: <b>{config.batasPendaftaran}</b></p>
                <p>• Pembayaran melalui transfer ke Rekening: <b>{config.rekeningBank}</b></p>
                <p className="text-rose-700 font-bold">• Panitia TIDAK menerima pembayaran secara tunai di lokasi.</p>
              </div>
            </section>

            {/* Poin 11 */}
            <section className="space-y-1.5">
              <h3 className="font-black text-sm text-slate-950 uppercase">11. SANKSI</h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>Peserta yang terbukti melakukan pemalsuan data akan dikenakan sanksi diskualifikasi.</li>
                <li>Peserta yang terlambat atau tidak hadir dianggap mengundurkan diri (DNS).</li>
                <li>Peserta yang dikenakan sanksi diskualifikasi ataupun mengundurkan diri uang pendaftaran tidak dikembalikan.</li>
                <li>Peserta yang dikenakan diskualifikasi ataupun tidak hadir tetap mendapatkan medali dan Sertifikat Peserta.</li>
              </ul>
            </section>
          </div>

          {/* Footer Bar */}
          <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Calendar className="h-4 w-4 text-primary" /> Batas Pendaftaran: {config.batasPendaftaran}
            </div>
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Phone className="h-4 w-4 text-emerald-600" /> Hotline: {config.hotline1} | {config.hotline2}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 5. LEMBAR 4: BUTIR 12 - 14 (HADIAH & BEST SWIMMER)        */}
        {/* ========================================================= */}
        <div className="juknis-page rounded-2xl border border-slate-300 bg-white p-8 sm:p-10 shadow-sm space-y-6 text-slate-900">
          <div className="border-b pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-base font-black uppercase tracking-tight text-slate-900">
                {config.title}
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">POIN 12 – 14</span>
          </div>

          <div className="space-y-4 text-xs leading-relaxed">
            {/* Poin 12 */}
            <section className="space-y-2">
              <h3 className="font-black text-sm text-slate-950 uppercase">12. HADIAH DAN PENGHARGAAN</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div className="p-3 rounded-lg border border-amber-300 bg-amber-50/50 space-y-1">
                  <p className="font-black text-amber-900 flex items-center gap-1.5">
                    <Trophy className="h-4 w-4 text-amber-600" /> Best Contingent (Juara Umum):
                  </p>
                  <p className="text-slate-700 pl-5">:- Uang Pembinaan</p>
                  <p className="text-slate-700 pl-5">:- Piala Tetap</p>
                  <p className="text-slate-700 pl-5">:- Prizeboard</p>
                  <p className="text-slate-700 pl-5">:- Sertifikat Eksklusif</p>
                </div>

                <div className="p-3 rounded-lg border border-blue-300 bg-blue-50/50 space-y-1">
                  <p className="font-black text-blue-900 flex items-center gap-1.5">
                    <Medal className="h-4 w-4 text-blue-600" /> Best Swimmer (Perenang Terbaik):
                  </p>
                  <p className="text-slate-700 pl-5">:- Uang Pembinaan</p>
                  <p className="text-slate-700 pl-5">:- Piala Tetap</p>
                  <p className="text-slate-700 pl-5">:- Prizeboard</p>
                  <p className="text-slate-700 pl-5">:- Sertifikat Eksklusif</p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                  <p className="font-black text-slate-900">• Best Time Acara:</p>
                  <p className="text-slate-700 pl-5">:- Sertifikat Eksklusif Pemenang Seri</p>
                </div>

                <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 space-y-1">
                  <p className="font-black text-slate-900">• Seluruh Peserta:</p>
                  <p className="text-slate-700 pl-5">:- Medali Eksklusif</p>
                  <p className="text-slate-700 pl-5">:- Sertifikat Peserta</p>
                </div>
              </div>
            </section>

            {/* Poin 13 */}
            <section className="space-y-1.5">
              <h3 className="font-black text-sm text-slate-950 uppercase">13. KETENTUAN BEST SWIMMER</h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>Best Swimmer diberikan kepada Setiap Kelompok Usia Putra dan Putri.</li>
                <li>Best Swimmer ditentukan dari jumlah perolehan Best Time Acara 1, 2 dan 3 dari seluruh acara yang ada pada Kelompok Usianya.</li>
                <li>Jika perolehan Best Time Acara sama besarnya maka akan diambil usia termuda.</li>
              </ul>
            </section>

            {/* Poin 14 */}
            <section className="space-y-1.5">
              <h3 className="font-black text-sm text-slate-950 uppercase">14. KETENTUAN BEST CONTINGENT</h3>
              <p className="text-slate-700">
                Best Contingent ditentukan dari banyaknya jumlah perolehan Best Time Acara 1, 2 dan 3 yang didapat oleh Contingent dari seluruh nomor perlombaan.
              </p>
            </section>
          </div>

          {/* Footer Bar */}
          <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Calendar className="h-4 w-4 text-primary" /> Batas Pendaftaran: {config.batasPendaftaran}
            </div>
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Phone className="h-4 w-4 text-emerald-600" /> Hotline: {config.hotline1} | {config.hotline2}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 6. LEMBAR 5: BUTIR 15 - 18 (HASIL, WITHDRAWAL, BANDING, TM)*/}
        {/* ========================================================= */}
        <div className="juknis-page rounded-2xl border border-slate-300 bg-white p-8 sm:p-10 shadow-sm space-y-6 text-slate-900">
          <div className="border-b pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-base font-black uppercase tracking-tight text-slate-900">
                {config.title}
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">POIN 15 – 18</span>
          </div>

          <div className="space-y-4 text-xs leading-relaxed">
            {/* Poin 15 */}
            <section className="space-y-1">
              <h3 className="font-black text-sm text-slate-950 uppercase">15. HASIL PERLOMBAAN DAN PENGHARGAAN</h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>Hasil perlombaan akan dishare di grup peserta & Live Scoreboard SCMS.</li>
                <li>Peserta akan diberikan medali dan sertifikat begitu finish.</li>
                <li>Untuk Best Time Acara sertifikat akan tersedia maksimal 2 jam setelah hasil rilis.</li>
              </ul>
            </section>

            {/* Poin 16 */}
            <section className="space-y-1">
              <h3 className="font-black text-sm text-slate-950 uppercase">16. PENGUNDURAN DIRI / DNS / WITHDRAWAL</h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>Pengunduran Diri / Refund paling lambat diajukan 30 hari sebelum kegiatan.</li>
                <li>Peserta yang mengundurkan diri saat ataupun setelah Technical Meeting berlangsung tidak ada pengembalian biaya pendaftaran.</li>
              </ul>
            </section>

            {/* Poin 17 */}
            <section className="space-y-1.5">
              <h3 className="font-black text-sm text-slate-950 uppercase">17. BANDING / PROTES</h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>Banding atau protes pada hasil perlombaan harus diajukan oleh Tim Manajer atau Official Kontingen yang mengikuti technical meeting.</li>
                <li>Pengajuan banding atau protes harus secara tertulis dengan mengisi form protes yang disediakan serta menyerahkan deposit sebesar <b>{config.depositBanding}</b>.</li>
                <li>Banding atau Protes harus diajukan paling lambat <b>30 (Tiga Puluh) menit</b> setelah hasil perlombaan diumumkan.</li>
                <li>Jika banding atau protes diterima maka uang deposit akan dikembalikan, namun jika ditolak maka uang deposit dianggap hangus.</li>
                <li>Banding atau protes dapat diajukan tanpa uang deposit jika hal yang diprotes merupakan murni kesalahan administrasi ataupun panitia.</li>
              </ul>
            </section>

            {/* Poin 18 */}
            <section className="space-y-1.5">
              <h3 className="font-black text-sm text-slate-950 uppercase">18. TECHNICAL MEETING (TM)</h3>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1 text-slate-800">
                <p>• Hari/Tanggal: <b>{config.jadwalTM}</b></p>
                <p>• Waktu: <b>{config.waktuTM}</b></p>
                <p>• Media: <b>Online Virtual Meeting (Zoom)</b> ({config.linkZoomTM})</p>
              </div>
            </section>
          </div>

          {/* Footer Bar */}
          <div className="pt-4 border-t flex flex-col sm:flex-row items-center justify-between gap-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Calendar className="h-4 w-4 text-primary" /> Batas Pendaftaran: {config.batasPendaftaran}
            </div>
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Phone className="h-4 w-4 text-emerald-600" /> Hotline: {config.hotline1} | {config.hotline2}
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 7. LEMBAR 6: BUTIR 19 - 20 (HAL LAINNYA & PEMBAGIAN SESI)  */}
        {/* ========================================================= */}
        <div className="juknis-page rounded-2xl border border-slate-300 bg-white p-8 sm:p-10 shadow-sm space-y-6 text-slate-900 overflow-hidden">
          <div className="border-b pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h2 className="text-base font-black uppercase tracking-tight text-slate-900">
                {config.title}
              </h2>
            </div>
            <span className="text-xs font-mono font-bold text-slate-500">POIN 19 – 20</span>
          </div>

          <div className="space-y-4 text-xs leading-relaxed">
            {/* Poin 19 */}
            <section className="space-y-1.5">
              <h3 className="font-black text-sm text-slate-950 uppercase">19. HAL-HAL LAINNYA</h3>
              <ul className="list-disc pl-5 space-y-1 text-slate-700">
                <li>Hal-hal yang belum tercantum pada juknis kegiatan akan dibahas pada technical meeting.</li>
                <li>Panitia tidak menyediakan hardcopy Buku Acara (peserta dapat mengunduh secara digital melalui platform SCMS).</li>
                <li>Tim Medis yang disediakan oleh panitia hanya 1 Unit Ambulance, 1 Dokter dan 2 Paramedis. Jika terdapat peserta yang harus dirujuk ke rumah sakit maka biaya pengobatan merupakan tanggung jawab masing-masing peserta.</li>
                <li>
                  Agar tidak tertinggal informasi, peserta wajib bergabung ke dalam Group WhatsApp Peserta melalui tautan:
                  <span className="font-mono text-primary font-bold block mt-0.5">{config.linkWAG}</span>
                </li>
              </ul>
            </section>

            {/* Poin 20 */}
            <section className="space-y-2">
              <h3 className="font-black text-sm text-slate-950 uppercase">20. PEMBAGIAN SESI PERLOMBAAN</h3>
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-amber-300 text-slate-950 font-black border-b border-slate-300 text-center">
                      <th className="p-2.5 w-1/2 border-r border-slate-300">HARI PERTAMA (SESI 1)</th>
                      <th className="p-2.5 w-1/2">HARI KEDUA (SESI 2)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="align-top divide-x divide-slate-200">
                      <td className="p-3 bg-slate-50/50">
                        <ul className="list-disc pl-5 space-y-1 font-semibold text-slate-800">
                          <li>U4 (Usia 4 Tahun)</li>
                          <li>U5 (Usia 5 Tahun)</li>
                          <li>U8 (Usia 8 Tahun)</li>
                          <li>U9 (Usia 9 Tahun)</li>
                          <li>U15-16 (Usia 15-16 Tahun)</li>
                          <li>U17-18 (Usia 17-18 Tahun)</li>
                        </ul>
                      </td>
                      <td className="p-3 bg-white">
                        <ul className="list-disc pl-5 space-y-1 font-semibold text-slate-800">
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
              <p className="text-[11px] italic text-slate-500 text-center">
                *Jika kuota peserta tidak mencukupi untuk dilaksanakan selama 2 (Dua) hari, maka kegiatan akan dijadikan 1 (Satu) hari pada Hari Minggu.
              </p>
            </section>
          </div>

          {/* ========================================================= */}
          {/* FOOTER PENUTUP PALING BELAKANG (FULL-BLEED EDGE-TO-EDGE)  */}
          {/* ========================================================= */}
          <div className="pt-6 -mx-8 sm:-mx-10 -mb-8 sm:-mb-10 space-y-4 bg-slate-50/70 border-t border-slate-300 print:bg-white print:border-none">
            {/* Banner Rajendra Meet & Champion Sports - Penuh ke Tepi Kiri & Kanan */}
            <div className="w-full overflow-hidden border-b border-slate-200">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/banner-rajendra.jpg"
                alt="Rajendra Meet Swimming System - Champion Sports (Mascot Rajen & Dara)"
                className="w-full h-auto object-cover max-h-28 sm:max-h-36 block"
              />
            </div>

            {/* Sponsor Strip Cover Belakang */}
            <div className="px-6 sm:px-10 pb-1">
              <SponsorLogosStrip
                sponsors={sponsorsList}
                title="TERIMA KASIH KEPADA MITRA & SPONSOR RESMI KEJUARAAN"
                size="lg"
              />
            </div>

            {/* Bottom Bar Batas Pendaftaran & Hotline */}
            <div className="border-t border-slate-300 bg-white px-6 sm:px-10 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Calendar className="h-4 w-4 text-primary" /> Batas Pendaftaran: {config.batasPendaftaran}
              </div>
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <Phone className="h-4 w-4 text-emerald-600" /> Hotline: {config.hotline1} | {config.hotline2}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODAL KUSTOMISASI DATA JUKNIS                             */}
      {/* ========================================================= */}
      <Dialog open={openEditModal} onOpenChange={setOpenEditModal}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto p-6">
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <DialogFooter className="pt-3 border-t flex items-center justify-between">
              <Button type="button" variant="ghost" size="sm" onClick={handleResetConfig} className="text-xs text-rose-600">
                <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset Default
              </Button>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setOpenEditModal(false)}>
                  Batal
                </Button>
                <Button type="submit" size="sm" className="font-bold text-xs">
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
