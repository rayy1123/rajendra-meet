'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { CertificateCard } from './certificate-card';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Printer,
  Search,
  Trophy,
  SlidersHorizontal,
  CalendarDays,
  Medal,
  CheckSquare,
  Square,
  Eye,
  Table as TableIcon,
  LayoutGrid,
  Handshake,
  ScrollText,
  Star,
  Palette,
  Upload,
  Image as ImageIcon,
  RotateCcw,
  Sparkles,
  Check,
  Building2,
  Trash2,
  Layers,
} from 'lucide-react';
import Link from 'next/link';
import { type SponsorItem, getCachedSponsors } from '@/lib/data/sponsors';
import { printElement } from '@/lib/utils/print-helper';
import { formatKuDisplay } from '@/lib/age-category';
import { toast } from 'sonner';

export interface CertificateRecipient {
  id: string;
  rank: number;
  athleteId: string;
  athleteNumber: string;
  swimmerName: string;
  gender: string;
  ageGroup: string;
  schoolName: string;
  finishTimeMs: number | null;
  formattedTime: string;
  isNewRecord: boolean;
  recordType?: 'pribadi' | 'games' | 'daerah' | 'nasional' | string;
  status: string;
  competitionEventId: string;
  competitionEventName: string;
  stroke: string;
  distanceMeters: number;
  orderNo?: number | null;
  eventId: string;
  eventName: string;
  eventLocation: string;
  eventStartDate: string;
}

export interface CertificateSettings {
  // Nomor & Penerbitan
  skNumber: string;
  issuedCity: string;
  issuedDate: string;
  organizerChairman: string;
  organizerChairmanTitle: string;
  technicalDelegate: string;
  technicalDelegateTitle: string;
  certificateType: 'achievement' | 'participation' | 'auto';

  // Tiga Logo Header (Kiri: Rajendra Swim System, Tengah: Sponsor Utama, Kanan: Rajendra Organizer)
  leftLogoUrl?: string | null;
  leftLogoTitle?: string;
  leftLogoSubtitle?: string;
  mainSponsorLogoUrl?: string | null;
  mainSponsorTitle?: string;
  mainSponsorSubtitle?: string;
  showMainSponsor?: boolean;
  rightLogoUrl?: string | null;
  rightLogoTitle?: string;
  rightLogoSubtitle?: string;

  // Background & Desain
  backgroundTheme?: 'default' | 'classic_gold' | 'oceanic_blue' | 'pure_white';
  customBackgroundImage?: string | null;
  backgroundOpacity?: number;
  showWatermark?: boolean;
  borderStyle?: 'gold_classic' | 'navy_aquatic' | 'silver_modern' | 'none';

  // Teks & Gelar
  headerTitle?: string;
  headerSubtitle?: string;
  presentedText?: string;
  achievementText?: string;
  defaultRecordType?: 'pribadi' | 'games' | 'daerah' | 'nasional';

  // Footer Sponsorship
  showSponsors?: boolean;
}

export interface CompetitionEventOption {
  id: string;
  name: string;
  orderNo?: number | null;
  stroke: string;
  distanceMeters: number;
  gender: string;
}

const DEFAULT_SETTINGS: CertificateSettings = {
  skNumber: '028/SK-RM/X/2026',
  issuedCity: 'Bandung',
  issuedDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
  organizerChairman: 'Dr. H. Hendra Wijaya, M.Pd',
  organizerChairmanTitle: 'Ketua Panitia Pelaksana',
  technicalDelegate: 'Bambang S., S.Pd',
  technicalDelegateTitle: 'Technical Delegate / Referee',
  certificateType: 'auto',
  showSponsors: true,

  // 3 Logo Header
  leftLogoUrl: '/brand/logo.png',
  leftLogoTitle: 'RAJENDRA SWIM SYSTEM',
  leftLogoSubtitle: 'OFFICIAL SANCTIONED SYSTEM',
  mainSponsorLogoUrl: null,
  mainSponsorTitle: 'OFFICIAL MAIN SPONSOR',
  mainSponsorSubtitle: 'SPONSOR UTAMA RESMI',
  showMainSponsor: true,
  rightLogoUrl: '/brand/rajendra-organizer-logo.png',
  rightLogoTitle: 'RAJENDRA ORGANIZER',
  rightLogoSubtitle: 'CHAMPIONSHIP ORGANIZER',

  // Background & Bingkai
  backgroundTheme: 'default',
  customBackgroundImage: null,
  backgroundOpacity: 100,
  showWatermark: true,
  borderStyle: 'gold_classic',

  // Teks
  headerTitle: '',
  headerSubtitle: '',
  presentedText: 'Diberikan dengan bangga kepada / Proudly presented to:',
  achievementText: 'Atas prestasinya meraih pencapaian:',
  defaultRecordType: 'games',
};

export function CertificateManager({
  recipients,
  events,
  activeEventId,
  competitionEvents,
  sponsors = [],
}: {
  recipients: CertificateRecipient[];
  events: { id: string; name: string }[];
  activeEventId: string;
  competitionEvents: CompetitionEventOption[];
  sponsors?: SponsorItem[];
}) {
  const [recipientsState] = useState<CertificateRecipient[]>(recipients);
  const [selectedCompEventId, setSelectedCompEventId] = useState<string>('all');
  const [rankFilter, setRankFilter] = useState<'all' | 'podium' | 'records'>('podium');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const [sponsorsList] = useState<SponsorItem[]>(() => getCachedSponsors(sponsors));

  // Multi-select Checkbox State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal Pratinjau Tunggal
  const [previewRecipient, setPreviewRecipient] = useState<CertificateRecipient | null>(null);

  // List khusus untuk dicetak saat window.print() dipanggil
  const [printList, setPrintList] = useState<CertificateRecipient[]>([]);

  // Modal Pengaturan & Studio Desain Sertifikat
  const [openSettings, setOpenSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'logos' | 'background' | 'texts'>('logos');
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeUploadTarget, setActiveUploadTarget] = useState<keyof CertificateSettings | null>(null);

  const [settings, setSettings] = useState<CertificateSettings>(DEFAULT_SETTINGS);

  // Load saved settings from localStorage on client mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('scms-certificate-settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // ignore
    }
  }, []);

  // Filter penerima sertifikat
  const filteredRecipients = useMemo(() => {
    return recipientsState.filter((r) => {
      if (selectedCompEventId !== 'all' && r.competitionEventId !== selectedCompEventId) {
        return false;
      }
      if (rankFilter === 'podium' && r.rank > 3) {
        return false;
      }
      if (rankFilter === 'records' && !r.isNewRecord) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = r.swimmerName.toLowerCase().includes(q);
        const matchSchool = r.schoolName.toLowerCase().includes(q);
        const matchEvent = r.competitionEventName.toLowerCase().includes(q);
        const matchNum = r.athleteNumber.toLowerCase().includes(q);
        if (!matchName && !matchSchool && !matchEvent && !matchNum) {
          return false;
        }
      }
      return true;
    });
  }, [recipientsState, selectedCompEventId, rankFilter, searchQuery]);

  // Daftar yang dicentang / dipilih
  const selectedList = useMemo(() => {
    if (selectedIds.size > 0) {
      return filteredRecipients.filter((r) => selectedIds.has(r.id));
    }
    return filteredRecipients;
  }, [filteredRecipients, selectedIds]);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredRecipients.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecipients.map((r) => r.id)));
    }
  };

  // Cetak Semua / Pilihan
  const handlePrintAll = () => {
    setPreviewRecipient(null);
    const target = selectedList.length > 0 ? selectedList : filteredRecipients;
    setPrintList(target);
    setTimeout(() => {
      printElement('certificate-print-area', {
        title: `Sertifikat-Juara-Semua-${activeEventId}`,
        isLandscape: true,
        pageMargin: '0mm',
      });
    }, 150);
  };

  // Cetak Tunggal
  const handlePrintSingle = (rec: CertificateRecipient) => {
    setPreviewRecipient(null);
    setPrintList([rec]);
    setTimeout(() => {
      printElement('certificate-print-area', {
        title: `Sertifikat-Juara-${rec.swimmerName.replace(/\s+/g, '-')}`,
        isLandscape: true,
        pageMargin: '0mm',
      });
    }, 150);
  };

  // Upload Gambar
  const triggerFileUpload = (targetField: keyof CertificateSettings) => {
    setActiveUploadTarget(targetField);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeUploadTarget) return;

    setUploadingField(activeUploadTarget);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'certificates');

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok && data.url) {
        setSettings((s) => ({ ...s, [activeUploadTarget]: data.url }));
        toast.success('Gambar berhasil diunggah!');
      } else {
        toast.error(data.error || 'Gagal mengunggah gambar');
      }
    } catch {
      toast.error('Kesalahan jaringan saat mengunggah gambar');
    } finally {
      setUploadingField(null);
      setActiveUploadTarget(null);
    }
  };

  const handleSaveSettings = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      localStorage.setItem('scms-certificate-settings', JSON.stringify(settings));
    } catch {
      // ignore
    }
    setOpenSettings(false);
    toast.success('Desain & elemen sertifikat berhasil disimpan!');
  };

  const handleResetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
    try {
      localStorage.removeItem('scms-certificate-settings');
    } catch {
      // ignore
    }
    toast.info('Pengaturan sertifikat dikembalikan ke standar awal.');
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input for uploads */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Print Stylesheet Khusus untuk Sertifikat Landscape A4 */}
      <style jsx global>{`
        @media print {
          aside,
          header,
          nav,
          footer,
          .no-print {
            display: none !important;
          }

          body {
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          @page {
            size: A4 landscape;
            margin: 0;
          }

          #certificate-print-area {
            display: block !important;
            position: static !important;
            width: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
          }

          .certificate-sheet {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            box-sizing: border-box !important;
            width: 297mm !important;
            height: 209mm !important;
            max-width: 297mm !important;
            max-height: 209mm !important;
            min-height: 209mm !important;
            margin: 0 auto !important;
            padding: 8mm 12mm !important;
            border-radius: 0 !important;
            box-shadow: none !important;
            border: none !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            overflow: hidden !important;
            background: #ffffff !important;
          }
        }
      `}</style>

      {/* 4 STATS OVERVIEW CARDS */}
      <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Penerima */}
        <div className="glass-card p-4.5 flex items-center gap-3.5 border-l-4 border-l-blue-600 shadow-sm">
          <div className="h-11 w-11 rounded-xl bg-blue-100/90 text-blue-700 flex items-center justify-center shrink-0 shadow-2xs">
            <ScrollText className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Penerima</p>
            <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">
              {recipients.length} <span className="text-xs font-semibold text-muted-foreground">Atlet</span>
            </p>
          </div>
        </div>

        {/* Juara I Emas */}
        <div className="glass-card p-4.5 flex items-center gap-3.5 border-l-4 border-l-amber-500 shadow-sm">
          <div className="h-11 w-11 rounded-xl bg-amber-100/90 text-amber-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Juara I (Emas)</p>
            <p className="text-2xl font-black text-amber-600 font-mono mt-0.5">
              {recipients.filter((r) => r.rank === 1).length} <span className="text-xs font-semibold text-muted-foreground">Atlet</span>
            </p>
          </div>
        </div>

        {/* Podium 1-3 */}
        <div className="glass-card p-4.5 flex items-center gap-3.5 border-l-4 border-l-emerald-500 shadow-sm">
          <div className="h-11 w-11 rounded-xl bg-emerald-100/90 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Medal className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Podium (1–3)</p>
            <p className="text-2xl font-black text-emerald-600 font-mono mt-0.5">
              {recipients.filter((r) => r.rank <= 3).length} <span className="text-xs font-semibold text-muted-foreground">Atlet</span>
            </p>
          </div>
        </div>

        {/* Pemecah Rekor */}
        <div className="glass-card p-4.5 flex items-center gap-3.5 border-l-4 border-l-rose-500 shadow-sm">
          <div className="h-11 w-11 rounded-xl bg-rose-100/90 text-rose-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Star className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Rekor Baru</p>
            <p className="text-2xl font-black text-rose-600 font-mono mt-0.5">
              {recipients.filter((r) => r.isNewRecord).length} <span className="text-xs font-semibold text-muted-foreground">Rekor</span>
            </p>
          </div>
        </div>
      </div>

      {/* Baris Kontrol Utama */}
      <div className="no-print glass-card p-5 space-y-4 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Manajemen Cetak Sertifikat Kejuaraan
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Kustomisasi logo sponsor utama, background piagam, nama pejabat, dan cetak sertifikat juara.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenSettings(true)}
              className="gap-2 text-xs font-bold h-9 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-900 hover:bg-blue-100 shadow-2xs cursor-pointer"
            >
              <Palette className="h-4 w-4 text-blue-600" />
              <span>Edit Desain, Logo &amp; Background</span>
            </Button>

            <Link href="/sponsors">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold h-9 bg-white/80">
                <Handshake className="h-3.5 w-3.5 text-primary" />
                Mitra Sponsor ({sponsors.length})
              </Button>
            </Link>

            <Button
              onClick={handlePrintAll}
              disabled={filteredRecipients.length === 0}
              className="gap-1.5 font-bold shadow-xs h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              Cetak {selectedIds.size > 0 ? `${selectedIds.size} Pilihan` : `Semua (${filteredRecipients.length} Sertifikat)`}
            </Button>
          </div>
        </div>

        {/* Filter Kontrol */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-3 border-t border-slate-200/70">
          {/* Filter Event */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-primary" /> Event Kejuaraan
            </label>
            <Select
              value={activeEventId}
              onValueChange={(val) => {
                window.location.assign(`/sertifikat?event=${val}`);
              }}
            >
              <SelectTrigger className="h-9 text-xs bg-white/90">
                <SelectValue placeholder="Pilih Event" />
              </SelectTrigger>
              <SelectContent>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Nomor Lomba */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Medal className="h-3.5 w-3.5 text-primary" /> Nomor Lomba
            </label>
            <Select
              value={selectedCompEventId}
              onValueChange={(val) => setSelectedCompEventId(val)}
            >
              <SelectTrigger className="h-9 text-xs bg-white/90">
                <SelectValue placeholder="Semua Nomor Lomba" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">Semua Nomor Lomba ({recipients.length})</SelectItem>
                {competitionEvents.map((ce) => (
                  <SelectItem key={ce.id} value={ce.id}>{ce.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Kategori Peringkat */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-primary" /> Kategori Juara
            </label>
            <Select
              value={rankFilter}
              onValueChange={(val: any) => setRankFilter(val)}
            >
              <SelectTrigger className="h-9 text-xs bg-white/90">
                <SelectValue placeholder="Kategori Peringkat" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="podium">Juara 1–3 (Podium / Medali)</SelectItem>
                <SelectItem value="records">Pemecah Rekor Baru Saja</SelectItem>
                <SelectItem value="all">Seluruh Hasil (Semua Peringkat)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Search Box */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-primary" /> Cari Nama / Klub
            </label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Ketik nama atlet atau klub..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-9 pl-8 text-xs bg-background"
              />
            </div>
          </div>
        </div>

        {/* Baris Status Pilihan & Mode Tampilan */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t text-xs text-muted-foreground">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={selectAll}
              className="flex items-center gap-1.5 font-semibold text-primary hover:underline cursor-pointer"
            >
              {selectedIds.size === filteredRecipients.length && filteredRecipients.length > 0 ? (
                <>
                  <CheckSquare className="h-4 w-4" /> Batal Pilih Semua
                </>
              ) : (
                <>
                  <Square className="h-4 w-4" /> Pilih Semua Yang Tampil ({filteredRecipients.length})
                </>
              )}
            </button>
            {selectedIds.size > 0 && (
              <span className="font-bold text-amber-700">
                {selectedIds.size} atlet dipilih
              </span>
            )}
          </div>

          {/* Toggle Tampilan */}
          <div className="flex items-center gap-1 bg-muted p-0.5 rounded-lg">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                viewMode === 'table' ? 'bg-background text-foreground shadow-2xs font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <TableIcon className="h-3.5 w-3.5" /> Tabel Rekap
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cards')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-xs transition-colors cursor-pointer ${
                viewMode === 'cards' ? 'bg-background text-foreground shadow-2xs font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" /> Pratinjau Sertifikat
            </button>
          </div>
        </div>
      </div>

      {/* TAMPILAN DATA */}
      {filteredRecipients.length === 0 ? (
        <Card className="no-print p-12 text-center border-dashed">
          <Trophy className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <h4 className="text-base font-bold text-foreground">
            Belum ada hasil perlombaan yang selesai (Finished)
          </h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
            Pastikan operator telah memasukkan hasil catatan waktu pada menu <b>Input Hasil</b> atau sesuaikan filter nomor lomba yang dipilih.
          </p>
          <div className="mt-4 flex items-center justify-center gap-3">
            <Link href="/results">
              <Button size="sm" variant="outline" className="text-xs font-bold">
                Buka Input Hasil &rarr;
              </Button>
            </Link>
          </div>
        </Card>
      ) : viewMode === 'table' ? (
        /* Tabel Rekap Admin */
        <div className="no-print glass-card overflow-hidden p-0 border border-white/80 shadow-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200/70 bg-slate-100/80 backdrop-blur-md text-muted-foreground font-semibold">
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredRecipients.length && filteredRecipients.length > 0}
                      onChange={selectAll}
                      className="rounded border-slate-300"
                    />
                  </th>
                  <th className="p-3 w-16 text-center">Rank</th>
                  <th className="p-3">Nama Atlet</th>
                  <th className="p-3">Kontingen / Sekolah</th>
                  <th className="p-3">Nomor Lomba</th>
                  <th className="p-3 text-right">Waktu Resmi</th>
                  <th className="p-3 text-center">Rekor</th>
                  <th className="p-3 text-center w-36">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRecipients.map((r) => {
                  const isSelected = selectedIds.has(r.id);
                  const isGold = r.rank === 1;
                  const isSilver = r.rank === 2;
                  const isBronze = r.rank === 3;

                  return (
                    <tr
                      key={r.id}
                      className={`hover:bg-muted/40 transition-colors ${
                        isSelected ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(r.id)}
                          className="rounded border-slate-300 cursor-pointer"
                        />
                      </td>

                      <td className="p-3 text-center font-mono font-bold">
                        {isGold ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                            🥇 #1
                          </span>
                        ) : isSilver ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-300 text-slate-900 font-bold text-[10px]">
                            🥈 #2
                          </span>
                        ) : isBronze ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-700 text-white font-bold text-[10px]">
                            🥉 #3
                          </span>
                        ) : (
                          <span className="text-slate-600">#{r.rank}</span>
                        )}
                      </td>

                      <td className="p-3 font-bold text-foreground">
                        <div>
                          <span>{r.swimmerName}</span>
                          <span className="ml-2 font-mono text-[10px] text-muted-foreground font-normal">
                            (No: {r.athleteNumber || '-'})
                          </span>
                        </div>
                      </td>

                      <td className="p-3 text-muted-foreground">{r.schoolName || 'Mandiri / Umum'}</td>

                      <td className="p-3">
                        <span className="font-semibold text-slate-800">{r.competitionEventName}</span>
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-foreground">
                        {r.formattedTime} s
                      </td>

                      <td className="p-3 text-center">
                        {r.isNewRecord ? (
                          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-300 text-[10px] font-bold">
                            ★ REKOR BARU
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-[11px]">—</span>
                        )}
                      </td>

                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPreviewRecipient(r)}
                            className="h-7 px-2 text-xs font-semibold gap-1 cursor-pointer"
                            title="Pratinjau Sertifikat"
                          >
                            <Eye className="h-3 w-3 text-primary" /> Pratinjau
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handlePrintSingle(r)}
                            className="h-7 px-2 text-xs font-semibold gap-1 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                            title="Cetak Langsung 1 Halaman"
                          >
                            <Printer className="h-3 w-3" /> Cetak
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Grid Pratinjau Sertifikat di Layar */
        <div className="no-print grid grid-cols-1 gap-8">
          {filteredRecipients.map((r) => (
            <div key={r.id} className="space-y-2">
              <div className="flex items-center justify-between px-2">
                <span className="text-xs font-bold text-muted-foreground">
                  Peringkat #{r.rank} · {r.swimmerName} ({r.competitionEventName})
                </span>
                <Button
                  size="sm"
                  onClick={() => handlePrintSingle(r)}
                  className="h-7 text-xs font-bold gap-1 bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                >
                  <Printer className="h-3 w-3" /> Cetak Sertifikat Ini
                </Button>
              </div>
              <CertificateCard recipient={r} settings={settings} sponsors={sponsorsList} />
            </div>
          ))}
        </div>
      )}

      {/* AREA KHUSUS CETAK (@media print) */}
      <div id="certificate-print-area" className="only-print">
        {printList.map((r) => (
          <CertificateCard key={r.id} recipient={r} settings={settings} sponsors={sponsorsList} isPrintOnly />
        ))}
      </div>

      {/* DIALOG PRATINJAU TUNGGAL */}
      <Dialog open={!!previewRecipient} onOpenChange={(open) => !open && setPreviewRecipient(null)}>
        <DialogContent className="max-w-4xl p-6 no-print backdrop-blur-xl bg-white/95 border border-white/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Trophy className="h-5 w-5 text-amber-500" /> Pratinjau Sertifikat Penghargaan
            </DialogTitle>
          </DialogHeader>

          {previewRecipient && (
            <div className="space-y-4 pt-2">
              <div id="modal-admin-cert-preview-card" className="max-h-[75vh] overflow-y-auto p-1 rounded-xl border bg-slate-100/50">
                <CertificateCard recipient={previewRecipient} settings={settings} sponsors={sponsorsList} />
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Format cetak: Kertas <b>A4 Landscape</b> standar resmi.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewRecipient(null)}
                    className="text-xs cursor-pointer"
                  >
                    Tutup
                  </Button>
                  <Button
                    onClick={() => {
                      printElement('modal-admin-cert-preview-card', {
                        title: `Sertifikat-Juara-${previewRecipient.swimmerName.replace(/\s+/g, '-')}`,
                        isLandscape: true,
                        pageMargin: '0mm',
                      });
                    }}
                    size="sm"
                    className="gap-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white cursor-pointer"
                  >
                    <Printer className="h-4 w-4" /> Cetak Sekarang
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── DIALOG STUDIO DESAIN SERTIFIKAT LENGKAP ── */}
      <Dialog open={openSettings} onOpenChange={setOpenSettings}>
        <DialogContent className="max-w-2xl p-6 no-print backdrop-blur-xl bg-white/98 border border-white/90 shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-3">
            <div className="flex items-center justify-between">
              <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-900">
                <Palette className="h-5 w-5 text-blue-600" /> Studio Desain &amp; Kustomisasi Sertifikat
              </DialogTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResetSettings}
                className="h-8 px-2 text-[11px] text-muted-foreground hover:text-rose-600 gap-1 cursor-pointer"
                title="Kembalikan semua pengaturan ke standar awal"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset Standar</span>
              </Button>
            </div>

            {/* TAB NAVIGASI */}
            <div className="flex items-center gap-2 pt-3">
              <button
                type="button"
                onClick={() => setSettingsTab('logos')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  settingsTab === 'logos'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Building2 className="h-3.5 w-3.5" />
                <span>3 Logo Header</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsTab('background')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  settingsTab === 'background'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>Background &amp; Bingkai</span>
              </button>

              <button
                type="button"
                onClick={() => setSettingsTab('texts')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  settingsTab === 'texts'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span>Teks, Pejabat &amp; SK</span>
              </button>
            </div>
          </DialogHeader>

          <form onSubmit={handleSaveSettings} className="space-y-4 pt-3 text-xs">
            {/* ════ TAB 1: 3 LOGO HEADER (KIRI, SPONSOR UTAMA TENGAH, KANAN) ════ */}
            {settingsTab === 'logos' && (
              <div className="space-y-5">
                {/* 1. LOGO KIRI: Rajendra Swim System */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                      Logo Kiri: Rajendra Swim System
                    </span>
                    <button
                      type="button"
                      onClick={() => setSettings((s) => ({ ...s, leftLogoUrl: '/brand/logo.png', leftLogoTitle: 'RAJENDRA SWIM SYSTEM' }))}
                      className="text-[10px] text-blue-600 hover:underline cursor-pointer font-semibold"
                    >
                      Reset Logo Default
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 shrink-0 rounded-lg border bg-white p-1 flex items-center justify-center shadow-2xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={settings.leftLogoUrl || '/brand/logo.png'}
                        alt="Left Logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <Input
                        value={settings.leftLogoUrl || ''}
                        onChange={(e) => setSettings((s) => ({ ...s, leftLogoUrl: e.target.value }))}
                        placeholder="URL Logo (contoh: /brand/logo.png)"
                        className="h-8 text-xs bg-white"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => triggerFileUpload('leftLogoUrl')}
                          disabled={uploadingField === 'leftLogoUrl'}
                          className="h-7 px-2.5 text-[11px] gap-1 bg-white cursor-pointer"
                        >
                          <Upload className="h-3 w-3" />
                          <span>{uploadingField === 'leftLogoUrl' ? 'Mengunggah...' : 'Upload Logo Kiri'}</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500">Teks Judul Brand Kiri</label>
                      <Input
                        value={settings.leftLogoTitle || ''}
                        onChange={(e) => setSettings((s) => ({ ...s, leftLogoTitle: e.target.value }))}
                        placeholder="RAJENDRA SWIM SYSTEM"
                        className="h-7 text-xs bg-white mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500">Subteks Label Kiri</label>
                      <Input
                        value={settings.leftLogoSubtitle || ''}
                        onChange={(e) => setSettings((s) => ({ ...s, leftLogoSubtitle: e.target.value }))}
                        placeholder="OFFICIAL SANCTIONED SYSTEM"
                        className="h-7 text-xs bg-white mt-0.5"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. LOGO TENGAH: TEMPAT LOGO SPONSOR UTAMA (FITUR UTAMA PERMINTAAN USER) */}
                <div className="rounded-xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/70 via-yellow-50/40 to-white p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-white font-black text-[10px]">
                        ★
                      </span>
                      <span className="font-heading font-black text-xs text-amber-950 uppercase tracking-wide">
                        Tempat Logo Sponsor Utama (Pusat Header)
                      </span>
                    </div>
                    <label className="flex items-center gap-1.5 text-[11px] font-bold text-amber-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={settings.showMainSponsor !== false}
                        onChange={(e) => setSettings((s) => ({ ...s, showMainSponsor: e.target.checked }))}
                        className="rounded border-amber-300 text-amber-600"
                      />
                      <span>Tampilkan</span>
                    </label>
                  </div>

                  <p className="text-[11px] text-amber-800 leading-snug">
                    Area khusus tepat di tengah-tengah antara logo Rajendra Swim System dan Rajendra Organizer untuk memuat logo sponsor utama kejuaraan (seperti Title Sponsor, Bank, atau Apparel Resmi).
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="h-16 w-28 shrink-0 rounded-xl border-2 border-dashed border-amber-400 bg-white p-1 flex flex-col items-center justify-center text-center shadow-2xs">
                      {settings.mainSponsorLogoUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={settings.mainSponsorLogoUrl}
                          alt="Main Sponsor"
                          className="max-h-full max-w-full object-contain"
                        />
                      ) : (
                        <div className="space-y-0.5">
                          <ImageIcon className="h-4 w-4 mx-auto text-amber-400" />
                          <span className="text-[8px] font-bold text-amber-700 block uppercase">Belum Ada Logo</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 space-y-1.5">
                      <Input
                        value={settings.mainSponsorLogoUrl || ''}
                        onChange={(e) => setSettings((s) => ({ ...s, mainSponsorLogoUrl: e.target.value || null }))}
                        placeholder="URL Logo Sponsor Utama (contoh: /uploads/sponsor.png)"
                        className="h-8 text-xs bg-white border-amber-200"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => triggerFileUpload('mainSponsorLogoUrl')}
                          disabled={uploadingField === 'mainSponsorLogoUrl'}
                          className="h-7 px-2.5 text-[11px] font-bold bg-amber-600 hover:bg-amber-700 text-white gap-1 cursor-pointer border-0 shadow-2xs"
                        >
                          <Upload className="h-3 w-3" />
                          <span>{uploadingField === 'mainSponsorLogoUrl' ? 'Mengunggah...' : 'Upload Logo Sponsor'}</span>
                        </Button>

                        {settings.mainSponsorLogoUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setSettings((s) => ({ ...s, mainSponsorLogoUrl: null }))}
                            className="h-7 px-2 text-[11px] text-rose-600 hover:bg-rose-50 gap-1 cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>Hapus</span>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Pilihan Cepat dari Daftar Sponsor Aktif */}
                  {sponsorsList.length > 0 && (
                    <div className="space-y-1.5 pt-1 border-t border-amber-200/60">
                      <span className="text-[10px] font-bold text-amber-900 block">
                        Pilih Cepat dari Sponsor Kejuaraan:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {sponsorsList.map((sp) => (
                          <button
                            key={sp.id}
                            type="button"
                            onClick={() =>
                              setSettings((s) => ({
                                ...s,
                                mainSponsorLogoUrl: sp.logoUrl,
                                mainSponsorTitle: sp.name,
                              }))
                            }
                            className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-amber-300 bg-white hover:bg-amber-100 text-[10px] font-semibold text-slate-800 transition-colors cursor-pointer shadow-2xs"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={sp.logoUrl} alt={sp.name} className="h-3.5 w-auto object-contain" />
                            <span className="truncate max-w-[120px]">{sp.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-amber-200/60">
                    <div>
                      <label className="text-[10px] font-semibold text-amber-950">Nama / Judul Sponsor</label>
                      <Input
                        value={settings.mainSponsorTitle || ''}
                        onChange={(e) => setSettings((s) => ({ ...s, mainSponsorTitle: e.target.value }))}
                        placeholder="Contoh: BANK BJB / SPEEDO"
                        className="h-7 text-xs bg-white mt-0.5 border-amber-200"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-amber-950">Pita Badge Sponsor</label>
                      <Input
                        value={settings.mainSponsorSubtitle || ''}
                        onChange={(e) => setSettings((s) => ({ ...s, mainSponsorSubtitle: e.target.value }))}
                        placeholder="SPONSOR UTAMA RESMI"
                        className="h-7 text-xs bg-white mt-0.5 border-amber-200"
                      />
                    </div>
                  </div>
                </div>

                {/* 3. LOGO KANAN: Rajendra Organizer */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-indigo-600" />
                      Logo Kanan: Rajendra Organizer
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setSettings((s) => ({
                          ...s,
                          rightLogoUrl: '/brand/rajendra-organizer-logo.png',
                          rightLogoTitle: 'RAJENDRA ORGANIZER',
                        }))
                      }
                      className="text-[10px] text-blue-600 hover:underline cursor-pointer font-semibold"
                    >
                      Reset Logo Default
                    </button>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="h-14 w-14 shrink-0 rounded-lg border bg-white p-1 flex items-center justify-center shadow-2xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={settings.rightLogoUrl || '/brand/rajendra-organizer-logo.png'}
                        alt="Right Logo"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <Input
                        value={settings.rightLogoUrl || ''}
                        onChange={(e) => setSettings((s) => ({ ...s, rightLogoUrl: e.target.value }))}
                        placeholder="URL Logo (contoh: /brand/rajendra-organizer-logo.png)"
                        className="h-8 text-xs bg-white"
                      />
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => triggerFileUpload('rightLogoUrl')}
                          disabled={uploadingField === 'rightLogoUrl'}
                          className="h-7 px-2.5 text-[11px] gap-1 bg-white cursor-pointer"
                        >
                          <Upload className="h-3 w-3" />
                          <span>{uploadingField === 'rightLogoUrl' ? 'Mengunggah...' : 'Upload Logo Kanan'}</span>
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200/60">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500">Teks Judul Brand Kanan</label>
                      <Input
                        value={settings.rightLogoTitle || ''}
                        onChange={(e) => setSettings((s) => ({ ...s, rightLogoTitle: e.target.value }))}
                        placeholder="RAJENDRA ORGANIZER"
                        className="h-7 text-xs bg-white mt-0.5"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500">Subteks Label Kanan</label>
                      <Input
                        value={settings.rightLogoSubtitle || ''}
                        onChange={(e) => setSettings((s) => ({ ...s, rightLogoSubtitle: e.target.value }))}
                        placeholder="CHAMPIONSHIP ORGANIZER"
                        className="h-7 text-xs bg-white mt-0.5"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════ TAB 2: BACKGROUND & BINGKAI ════ */}
            {settingsTab === 'background' && (
              <div className="space-y-4">
                {/* Preset Warna Latar Belakang */}
                <div className="space-y-2">
                  <label className="font-bold text-slate-900 block">Tema Warna Latar Belakang</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'default', label: 'Aquatic Glass', desc: 'Gradien Putih Biru', border: 'border-blue-400', bg: 'bg-gradient-to-br from-white via-sky-50 to-blue-50' },
                      { id: 'classic_gold', label: 'Royal Gold', desc: 'Krem Emas Mewah', border: 'border-amber-400', bg: 'bg-gradient-to-br from-white via-amber-50 to-yellow-50' },
                      { id: 'oceanic_blue', label: 'Oceanic Blue', desc: 'Biru Laut Segar', border: 'border-cyan-400', bg: 'bg-gradient-to-br from-white via-cyan-50 to-sky-100' },
                      { id: 'pure_white', label: 'Pure White', desc: 'Putih Bersih Hemat Tinta', border: 'border-slate-300', bg: 'bg-white' },
                    ].map((thm) => (
                      <button
                        key={thm.id}
                        type="button"
                        onClick={() => setSettings((s) => ({ ...s, backgroundTheme: thm.id as any }))}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${thm.bg} ${
                          settings.backgroundTheme === thm.id
                            ? `${thm.border} ring-2 ring-blue-500/30 shadow-xs font-bold`
                            : 'border-slate-200 opacity-80 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-slate-900">{thm.label}</span>
                          {settings.backgroundTheme === thm.id && (
                            <Check className="h-3 w-3 text-blue-600" />
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 block mt-0.5">{thm.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Upload Gambar Background Kustom */}
                <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">Upload Gambar Background Kustom</span>
                    {settings.customBackgroundImage && (
                      <button
                        type="button"
                        onClick={() => setSettings((s) => ({ ...s, customBackgroundImage: null }))}
                        className="text-[10px] text-rose-600 hover:underline cursor-pointer"
                      >
                        Hapus Background
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600">
                    Gunakan file template sertifikat Anda sendiri (misal desain piagam dari Corel/Photoshop/Canva) untuk dijadikan gambar latar belakang.
                  </p>

                  <div className="flex items-center gap-3">
                    <div className="h-14 w-20 shrink-0 rounded-lg border bg-white p-1 flex items-center justify-center shadow-2xs overflow-hidden">
                      {settings.customBackgroundImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={settings.customBackgroundImage}
                          alt="Background Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <ImageIcon className="h-5 w-5 text-slate-300" />
                      )}
                    </div>
                    <div className="flex-1 space-y-1.5">
                      <Input
                        value={settings.customBackgroundImage || ''}
                        onChange={(e) => setSettings((s) => ({ ...s, customBackgroundImage: e.target.value || null }))}
                        placeholder="URL Gambar (/uploads/background.jpg atau http...)"
                        className="h-8 text-xs bg-white"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => triggerFileUpload('customBackgroundImage')}
                        disabled={uploadingField === 'customBackgroundImage'}
                        className="h-7 px-2.5 text-[11px] font-semibold gap-1 bg-white cursor-pointer"
                      >
                        <Upload className="h-3 w-3" />
                        <span>{uploadingField === 'customBackgroundImage' ? 'Mengunggah...' : 'Upload File Background'}</span>
                      </Button>
                    </div>
                  </div>

                  {settings.customBackgroundImage && (
                    <div className="pt-2 border-t border-slate-200">
                      <div className="flex items-center justify-between text-[11px] font-bold text-slate-700 mb-1">
                        <span>Transparansi Gambar Background (Opacity)</span>
                        <span>{settings.backgroundOpacity ?? 100}%</span>
                      </div>
                      <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={settings.backgroundOpacity ?? 100}
                        onChange={(e) => setSettings((s) => ({ ...s, backgroundOpacity: Number(e.target.value) }))}
                        className="w-full accent-blue-600 cursor-pointer"
                      />
                    </div>
                  )}
                </div>

                {/* Gaya Bingkai & Watermark */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900 block">Gaya Bingkai (Border Frame)</label>
                    <select
                      value={settings.borderStyle || 'gold_classic'}
                      onChange={(e) => setSettings((s) => ({ ...s, borderStyle: e.target.value as any }))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold"
                    >
                      <option value="gold_classic">👑 Emas Klasik (Guilloche Corners)</option>
                      <option value="navy_aquatic">🌊 Biru Laut Akuatik Modern</option>
                      <option value="silver_modern">🥈 Perak Elegan (Silver)</option>
                      <option value="none">🚫 Tanpa Bingkai (Full Bleed)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-900 block">Watermark Segel Resmi</label>
                    <div className="flex items-center gap-2 pt-2">
                      <input
                        type="checkbox"
                        id="show-watermark-check"
                        checked={settings.showWatermark !== false}
                        onChange={(e) => setSettings((s) => ({ ...s, showWatermark: e.target.checked }))}
                        className="h-4 w-4 rounded border-slate-300 text-primary cursor-pointer"
                      />
                      <label htmlFor="show-watermark-check" className="font-semibold text-slate-700 cursor-pointer">
                        Aktifkan Segel Watermark Tengah
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ════ TAB 3: TEKS, PEJABAT & SK ════ */}
            {settingsTab === 'texts' && (
              <div className="space-y-3.5">
                <div className="space-y-1">
                  <label className="font-bold text-slate-900">Nomor Surat Keputusan / SK Panitia</label>
                  <Input
                    value={settings.skNumber}
                    onChange={(e) => setSettings((s) => ({ ...s, skNumber: e.target.value }))}
                    placeholder="Contoh: 028/SK-RM/X/2026"
                    className="h-8 text-xs bg-white"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-900">Judul Utama Piagam</label>
                    <Input
                      value={settings.headerTitle || ''}
                      onChange={(e) => setSettings((s) => ({ ...s, headerTitle: e.target.value }))}
                      placeholder="PIAGAM PENGHARGAAN"
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-900">Sub-Judul Bahasa Inggris</label>
                    <Input
                      value={settings.headerSubtitle || ''}
                      onChange={(e) => setSettings((s) => ({ ...s, headerSubtitle: e.target.value }))}
                      placeholder="CERTIFICATE OF ACHIEVEMENT"
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-900">Kalimat Pengantar Nama</label>
                    <Input
                      value={settings.presentedText || ''}
                      onChange={(e) => setSettings((s) => ({ ...s, presentedText: e.target.value }))}
                      placeholder="Diberikan dengan bangga kepada:"
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-900">Kalimat Capaian Prestasi</label>
                    <Input
                      value={settings.achievementText || ''}
                      onChange={(e) => setSettings((s) => ({ ...s, achievementText: e.target.value }))}
                      placeholder="Atas prestasinya meraih pencapaian:"
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 pt-1 border-t">
                  <div className="space-y-1">
                    <label className="font-bold text-slate-900">Kota Penerbitan</label>
                    <Input
                      value={settings.issuedCity}
                      onChange={(e) => setSettings((s) => ({ ...s, issuedCity: e.target.value }))}
                      placeholder="Contoh: Bandung"
                      className="h-8 text-xs bg-white"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="font-bold text-slate-900">Tanggal Terbit</label>
                    <Input
                      value={settings.issuedDate}
                      onChange={(e) => setSettings((s) => ({ ...s, issuedDate: e.target.value }))}
                      placeholder="Contoh: 18 Oktober 2026"
                      className="h-8 text-xs bg-white"
                      required
                    />
                  </div>
                </div>

                {/* Pejabat Tanda Tangan */}
                <div className="grid grid-cols-2 gap-2.5 pt-1 border-t">
                  <div className="space-y-2">
                    <span className="font-bold text-blue-900 text-[11px] block">Pejabat Kiri (Technical Delegate)</span>
                    <Input
                      value={settings.technicalDelegate}
                      onChange={(e) => setSettings((s) => ({ ...s, technicalDelegate: e.target.value }))}
                      placeholder="Nama Lengkap & Gelar"
                      className="h-8 text-xs bg-white"
                      required
                    />
                    <Input
                      value={settings.technicalDelegateTitle}
                      onChange={(e) => setSettings((s) => ({ ...s, technicalDelegateTitle: e.target.value }))}
                      placeholder="Jabatan"
                      className="h-7 text-xs bg-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="font-bold text-blue-900 text-[11px] block">Pejabat Kanan (Ketua Panitia)</span>
                    <Input
                      value={settings.organizerChairman}
                      onChange={(e) => setSettings((s) => ({ ...s, organizerChairman: e.target.value }))}
                      placeholder="Nama Lengkap & Gelar"
                      className="h-8 text-xs bg-white"
                      required
                    />
                    <Input
                      value={settings.organizerChairmanTitle}
                      onChange={(e) => setSettings((s) => ({ ...s, organizerChairmanTitle: e.target.value }))}
                      placeholder="Jabatan"
                      className="h-7 text-xs bg-white"
                    />
                  </div>
                </div>

                {/* Opsi Tampilkan Sponsor Baris Bawah */}
                <div className="pt-2 border-t flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="show-sponsors-footer-check"
                    checked={settings.showSponsors !== false}
                    onChange={(e) => setSettings((s) => ({ ...s, showSponsors: e.target.checked }))}
                    className="h-4 w-4 rounded border-slate-300 text-primary cursor-pointer"
                  />
                  <label htmlFor="show-sponsors-footer-check" className="font-semibold text-slate-800 cursor-pointer">
                    Tampilkan Pita Barisan Logo Sponsor di Bawah Sertifikat
                  </label>
                </div>
              </div>
            )}

            {/* FOOTER ACTIONS */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenSettings(false)}
                className="text-xs cursor-pointer"
              >
                Batal
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  size="sm"
                  className="font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                  <span>Simpan &amp; Terapkan Desain</span>
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
