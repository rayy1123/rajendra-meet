'use client';

import { useState, useMemo } from 'react';
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
} from 'lucide-react';
import Link from 'next/link';
import { type SponsorItem, getCachedSponsors } from '@/lib/data/sponsors';

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
  skNumber: string;
  issuedCity: string;
  issuedDate: string;
  organizerChairman: string;
  organizerChairmanTitle: string;
  technicalDelegate: string;
  technicalDelegateTitle: string;
  certificateType: 'achievement' | 'participation' | 'auto';
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
  const [selectedCompEventId, setSelectedCompEventId] = useState<string>('all');
  const [rankFilter, setRankFilter] = useState<'all' | 'podium' | 'records'>('podium');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const [sponsorsList] = useState<SponsorItem[]>(() => getCachedSponsors(sponsors));

  // Multi-select Checkbox State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal Pratinjau Tunggal
  const [previewRecipient, setPreviewRecipient] = useState<CertificateRecipient | null>(null);

  // List khusus untuk dicetak saat window.print() dipanggil (Mencegah cetak 212 halaman sekaligus saat cetak tunggal!)
  const [printList, setPrintList] = useState<CertificateRecipient[]>([]);

  // Modal Pengaturan Sertifikat
  const [openSettings, setOpenSettings] = useState(false);
  const [settings, setSettings] = useState<CertificateSettings>({
    skNumber: '028/SK-SCMS/X/2026',
    issuedCity: 'Bandung',
    issuedDate: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }),
    organizerChairman: 'Dr. H. Hendra Wijaya, M.Pd',
    organizerChairmanTitle: 'Ketua Panitia Pelaksana',
    technicalDelegate: 'Bambang S., S.Pd',
    technicalDelegateTitle: 'Technical Delegate / FINA Referee',
    certificateType: 'auto',
    showSponsors: true,
  });

  // Filter penerima sertifikat
  const filteredRecipients = useMemo(() => {
    return recipients.filter((r) => {
      // Filter nomor lomba
      if (selectedCompEventId !== 'all' && r.competitionEventId !== selectedCompEventId) {
        return false;
      }
      // Filter kategori peringkat
      if (rankFilter === 'podium' && r.rank > 3) {
        return false;
      }
      if (rankFilter === 'records' && !r.isNewRecord) {
        return false;
      }
      // Search query
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
  }, [recipients, selectedCompEventId, rankFilter, searchQuery]);

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
    // Tutup dialog pratinjau jika ada yang terbuka
    setPreviewRecipient(null);
    const target = selectedList.length > 0 ? selectedList : filteredRecipients;
    setPrintList(target);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Cetak Tunggal (Farrel Manik dsb.)
  const handlePrintSingle = (rec: CertificateRecipient) => {
    // Tutup dialog modal pratinjau agar TIDAK MUNCUL di atas kertas cetak!
    setPreviewRecipient(null);
    // Masukkan HANYA 1 penerima ke printList agar cetak tepat 1 halaman!
    setPrintList([rec]);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-6">
      {/* Print Stylesheet Khusus untuk Sertifikat Landscape A4 Tanpa Modal Dialog */}
      <style jsx global>{`
        @media print {
          /* Sembunyikan seluruh UI dashboard, sidebar, modal radix, backdrop overlay */
          aside,
          header,
          nav,
          .no-print,
          footer,
          .breadcrumb-container,
          [role="dialog"],
          [data-radix-portal],
          [data-state="open"],
          .fixed,
          .backdrop-blur-sm,
          div[data-aria-hidden="true"] {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
          }

          @page {
            size: A4 landscape;
            margin: 0;
          }

          body,
          html {
            background: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          #certificate-print-area {
            display: block !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .certificate-sheet {
            page-break-after: always !important;
            break-after: page !important;
            box-shadow: none !important;
            max-width: 100% !important;
            width: 100% !important;
            min-height: 98vh !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

      {/* 4 STATS OVERVIEW CARD (GLASSMORPHISM UI) */}
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

      {/* Baris Kontrol Utama (Glassmorphism UI) */}
      <div className="no-print glass-card p-5 space-y-4 shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-500" />
              Manajemen Cetak Sertifikat Kejuaraan
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Cetak massal sertifikat juara 1–3 (podium), piagam rekor, atau sertifikat partisipasi dengan logo sponsorship resmi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link href="/sponsors">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold h-9 bg-white/80 backdrop-blur-xs">
                <Handshake className="h-3.5 w-3.5 text-primary" />
                Kelola Sponsor ({sponsors.length})
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setOpenSettings(true)}
              className="gap-1.5 text-xs font-semibold h-9 bg-white/80 backdrop-blur-xs"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              Atur SK, TTD & Sponsor
            </Button>

            <Button
              onClick={handlePrintAll}
              disabled={filteredRecipients.length === 0}
              className="gap-1.5 font-bold shadow-xs h-9 text-xs bg-amber-600 hover:bg-amber-700 text-white"
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
              <SelectTrigger className="h-9 text-xs bg-white/90 backdrop-blur-xs">
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
            <Select value={selectedCompEventId} onValueChange={setSelectedCompEventId}>
              <SelectTrigger className="h-9 text-xs bg-white/90 backdrop-blur-xs">
                <SelectValue placeholder="Semua Nomor Lomba" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Nomor Lomba (Batch Cetak)</SelectItem>
                {competitionEvents.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

            {/* Filter Kategori Peringkat */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-primary" /> Kategori Penerima
              </label>
              <Select
                value={rankFilter}
                onValueChange={(v) => setRankFilter(v as 'all' | 'podium' | 'records')}
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Pilih Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="podium">🥇 Juara 1, 2, 3 (Podium Medalis)</SelectItem>
                  <SelectItem value="records">★ Pemecah Rekor Baru Sahaja</SelectItem>
                  <SelectItem value="all">Semua Peserta Selesai (Finished)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pencarian Cepat */}
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
                className="flex items-center gap-1.5 font-semibold text-primary hover:underline"
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
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
                  viewMode === 'table' ? 'bg-background text-foreground shadow-2xs font-bold' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <TableIcon className="h-3.5 w-3.5" /> Tabel Rekap
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium text-xs transition-colors ${
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
        /* Tabel Rekap Admin (Glassmorphism UI) */
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
                          className="rounded border-slate-300"
                        />
                      </td>

                      <td className="p-3 text-center">
                        {isGold ? (
                          <span className="inline-flex items-center gap-1 font-black text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full text-xs">
                            🥇 1
                          </span>
                        ) : isSilver ? (
                          <span className="inline-flex items-center gap-1 font-black text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full text-xs">
                            🥈 2
                          </span>
                        ) : isBronze ? (
                          <span className="inline-flex items-center gap-1 font-black text-amber-800 bg-amber-50 px-2 py-0.5 rounded-full text-xs">
                            🥉 3
                          </span>
                        ) : (
                          <span className="font-semibold text-slate-500">{r.rank}</span>
                        )}
                      </td>

                      <td className="p-3">
                        <p className="font-bold text-foreground text-sm">{r.swimmerName}</p>
                        <p className="font-mono text-[10px] text-muted-foreground">{r.athleteNumber}</p>
                      </td>

                      <td className="p-3 font-medium text-slate-700">
                        {r.schoolName || 'Mandiri'}
                      </td>

                      <td className="p-3">
                        <p className="font-semibold text-foreground line-clamp-1">{r.competitionEventName}</p>
                        <p className="text-[10px] text-muted-foreground">KU {r.ageGroup}</p>
                      </td>

                      <td className="p-3 text-right font-mono font-bold text-foreground">
                        {r.formattedTime}
                      </td>

                      <td className="p-3 text-center">
                        {r.isNewRecord ? (
                          <Badge className="bg-rose-600 text-white text-[10px] font-bold">
                            Rekor Baru
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
                            className="h-7 px-2 text-xs font-semibold gap-1"
                            title="Pratinjau Sertifikat"
                          >
                            <Eye className="h-3 w-3 text-primary" /> Pratinjau
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handlePrintSingle(r)}
                            className="h-7 px-2 text-xs font-semibold gap-1 bg-amber-600 hover:bg-amber-700 text-white"
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
                  className="h-7 text-xs font-bold gap-1 bg-amber-600 hover:bg-amber-700 text-white"
                >
                  <Printer className="h-3 w-3" /> Cetak Sertifikat Ini
                </Button>
              </div>
              <CertificateCard recipient={r} settings={settings} sponsors={sponsorsList} />
            </div>
          ))}
        </div>
      )}

      {/* AREA KHUSUS CETAK (@media print) - HANYA BERISI ATLET YANG BENAR-BENAR INGIN DICETAK! */}
      <div id="certificate-print-area" className="hidden print:block">
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
              <div className="max-h-[75vh] overflow-y-auto p-1 rounded-xl border bg-slate-100/50">
                <CertificateCard recipient={previewRecipient} settings={settings} sponsors={sponsorsList} />
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-xs text-muted-foreground">
                  Format cetak: Kertas <b>A4 Landscape</b> standar.
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreviewRecipient(null)}
                    className="text-xs"
                  >
                    Tutup
                  </Button>
                  <Button
                    onClick={() => handlePrintSingle(previewRecipient)}
                    size="sm"
                    className="gap-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    <Printer className="h-4 w-4" /> Cetak Sekarang
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* DIALOG PENGATURAN SERTIFIKAT, TANDA TANGAN & SPONSOR */}
      <Dialog open={openSettings} onOpenChange={setOpenSettings}>
        <DialogContent className="sm:max-w-md p-6 no-print backdrop-blur-xl bg-white/95 border border-white/80 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <SlidersHorizontal className="h-5 w-5 text-primary" /> Pengaturan Data Sertifikat
            </DialogTitle>
          </DialogHeader>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              setOpenSettings(false);
            }}
            className="space-y-3 pt-2 text-xs"
          >
            <div className="space-y-1">
              <label className="font-bold text-foreground">Nomor Surat Keputusan / SK Panitia</label>
              <Input
                value={settings.skNumber}
                onChange={(e) => setSettings((s) => ({ ...s, skNumber: e.target.value }))}
                placeholder="Contoh: 028/SK-SCMS/X/2026"
                className="h-8 text-xs bg-background"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold text-foreground">Kota Penerbitan</label>
                <Input
                  value={settings.issuedCity}
                  onChange={(e) => setSettings((s) => ({ ...s, issuedCity: e.target.value }))}
                  placeholder="Contoh: Bandung"
                  className="h-8 text-xs bg-background"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-foreground">Tanggal Terbit</label>
                <Input
                  value={settings.issuedDate}
                  onChange={(e) => setSettings((s) => ({ ...s, issuedDate: e.target.value }))}
                  placeholder="Contoh: 18 Oktober 2026"
                  className="h-8 text-xs bg-background"
                  required
                />
              </div>
            </div>

            <div className="space-y-1 pt-1 border-t">
              <label className="font-bold text-foreground">Nama Ketua Panitia Pelaksana</label>
              <Input
                value={settings.organizerChairman}
                onChange={(e) => setSettings((s) => ({ ...s, organizerChairman: e.target.value }))}
                placeholder="Nama Lengkap & Gelar"
                className="h-8 text-xs bg-background"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">Jabatan Ketua Panitia</label>
              <Input
                value={settings.organizerChairmanTitle}
                onChange={(e) => setSettings((s) => ({ ...s, organizerChairmanTitle: e.target.value }))}
                placeholder="Contoh: Ketua Panitia Pelaksana"
                className="h-8 text-xs bg-background"
              />
            </div>

            <div className="space-y-1 pt-1 border-t">
              <label className="font-bold text-foreground">Nama Technical Delegate / Referee</label>
              <Input
                value={settings.technicalDelegate}
                onChange={(e) => setSettings((s) => ({ ...s, technicalDelegate: e.target.value }))}
                placeholder="Nama Lengkap & Gelar Referee"
                className="h-8 text-xs bg-background"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="font-bold text-foreground">Jabatan Technical Delegate</label>
              <Input
                value={settings.technicalDelegateTitle}
                onChange={(e) => setSettings((s) => ({ ...s, technicalDelegateTitle: e.target.value }))}
                placeholder="Contoh: Technical Delegate Akuatik Indonesia"
                className="h-8 text-xs bg-background"
              />
            </div>

            {/* Opsi Tampilkan Sponsor */}
            <div className="pt-2 border-t space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="show-sponsors-check"
                  checked={settings.showSponsors ?? true}
                  onChange={(e) => setSettings((s) => ({ ...s, showSponsors: e.target.checked }))}
                  className="h-4 w-4 rounded border-slate-300 text-primary"
                />
                <label htmlFor="show-sponsors-check" className="font-bold text-foreground cursor-pointer">
                  Tampilkan Logo Sponsor Resmi di Bawah Sertifikat
                </label>
              </div>
              <p className="text-[11px] text-muted-foreground pl-6">
                Menyematkan barisan logo mitra & sponsorship yang aktif ke dalam piagam penghargaan.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button type="submit" size="sm" className="font-bold text-xs">
                Terapkan Pengaturan
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
