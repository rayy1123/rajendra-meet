'use client';

import { useState, useMemo } from 'react';
import { AthleteParticipantCard } from './athlete-participant-card';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Printer,
  Search,
  Users,
  CalendarDays,
  CheckCircle2,
  Filter,
  Info,
  IdCard,
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import Link from 'next/link';

export interface ParticipantCardRaceItem {
  registrationId: string;
  orderNo?: number | null;
  eventName: string;
  stroke: string;
  distanceMeters: number;
  gender: string;
  ageGroup: string;
  seedTimeMs?: number | null;
  paymentStatus: string;
  isVerified: boolean;
  heatNumber?: number | null;
  laneNumber?: number | null;
}

export interface ParticipantCardData {
  cardId: string;
  athlete: {
    id: string;
    athleteNumber: string;
    fullName: string;
    gender: string;
    birthDate: string;
    ageGroup: string;
    schoolName: string;
  };
  event: {
    id: string;
    name: string;
    organizer: string;
    location: string;
    startDate: string;
    endDate: string;
    poolType: string;
  };
  races: ParticipantCardRaceItem[];
  allVerified: boolean;
  anyVerified: boolean;
  totalRaces: number;
}

export function ParticipantCardManager({
  cards,
  initialAthleteId,
  isAdmin = false,
}: {
  cards: ParticipantCardData[];
  initialAthleteId?: string | null;
  isAdmin?: boolean;
}) {
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(initialAthleteId || 'all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'pending'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [singlePrintCard, setSinglePrintCard] = useState<ParticipantCardData | null>(null);

  // Daftar unik Event untuk filter
  const eventOptions = useMemo(() => {
    const map = new Map<string, string>();
    cards.forEach((c) => {
      if (c.event?.id && !map.has(c.event.id)) {
        map.set(c.event.id, c.event.name || 'Kejuaraan Renang');
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [cards]);

  // Daftar unik Atlet untuk filter
  const athleteOptions = useMemo(() => {
    const map = new Map<string, string>();
    cards.forEach((c) => {
      if (c.athlete?.id && !map.has(c.athlete.id)) {
        map.set(c.athlete.id, c.athlete.fullName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [cards]);

  // Filter kartu berdasarkan pilihan
  const filteredCards = useMemo(() => {
    return cards.filter((c) => {
      // Filter event
      if (selectedEventId !== 'all' && c.event.id !== selectedEventId) {
        return false;
      }
      // Filter athlete
      if (selectedAthleteId !== 'all' && c.athlete.id !== selectedAthleteId) {
        return false;
      }
      // Filter payment status
      if (statusFilter === 'verified' && !c.allVerified) {
        return false;
      }
      if (statusFilter === 'pending' && c.allVerified) {
        return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = c.athlete.fullName.toLowerCase().includes(q);
        const matchNum = c.athlete.athleteNumber.toLowerCase().includes(q);
        const matchSchool = c.athlete.schoolName.toLowerCase().includes(q);
        const matchRace = c.races.some((r) => r.eventName.toLowerCase().includes(q));
        if (!matchName && !matchNum && !matchSchool && !matchRace) {
          return false;
        }
      }
      return true;
    });
  }, [cards, selectedEventId, selectedAthleteId, statusFilter, searchQuery]);

  const handlePrintAll = () => {
    window.print();
  };

  const handleOpenSinglePrint = (card: ParticipantCardData) => {
    setSinglePrintCard(card);
  };

  const handleTriggerSinglePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Print Stylesheet khusus agar cetak bersih tanpa navbar/sidebar */}
      <style jsx global>{`
        @media print {
          /* Sembunyikan elemen dashboard & antarmuka lainnya */
          aside,
          header,
          nav,
          .no-print,
          footer,
          .breadcrumb-container {
            display: none !important;
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

          /* Area cetak utama */
          #participant-print-area {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 10px !important;
          }

          /* Grid tata letak cetak */
          .print-cards-grid {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 16px !important;
            page-break-inside: auto !important;
          }

          .participant-badge-card {
            box-shadow: none !important;
            border: 1.5px solid #64748b !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 16px !important;
          }
        }
      `}</style>

      {/* Baris Kontrol & Filter */}
      <Card className="no-print border-slate-200 shadow-xs">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" /> Filter Kartu Peserta
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pilih event atau atlet untuk menampilkan dan mencetak kartu peserta resmi.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handlePrintAll}
                disabled={filteredCards.length === 0}
                className="gap-2 font-bold shadow-xs h-9 text-xs"
              >
                <Printer className="h-4 w-4" /> Cetak Semua ({filteredCards.length} Kartu)
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
            {/* Filter Kejuaraan */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-primary" /> Event Kejuaraan
              </label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Semua Event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Event Kejuaraan</SelectItem>
                  {eventOptions.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Atlet */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-primary" /> Atlet Peserta
              </label>
              <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Semua Atlet" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Atlet Binaan</SelectItem>
                  {athleteOptions.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter Status */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> Status Pembayaran
              </label>
              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v as 'all' | 'verified' | 'pending')}
              >
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Semua Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Status</SelectItem>
                  <SelectItem value="verified">Hanya Lunas / Terverifikasi</SelectItem>
                  <SelectItem value="pending">Menunggu Verifikasi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pencarian Teks */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-primary" /> Cari Nama / No. Atlet
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Ketik nama atlet..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 pl-8 text-xs bg-background"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Petunjuk Cetak */}
      <div className="no-print flex items-start gap-3 rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-900 shadow-2xs">
        <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-blue-950">
            Petunjuk Cetak Kartu Tanda Peserta (Official Pass)
          </p>
          <p className="text-blue-800">
            Setiap kartu memuat rincian identitas atlet, QR Code verifikasi resmi, serta <b>daftar lengkap nomor lomba</b> yang diikuti pada event tersebut. Anda dapat mencetak langsung menggunakan printer atau memilih opsi <b>&quot;Save as PDF&quot;</b> di dialog browser untuk mengunduh berkas kartu.
          </p>
        </div>
      </div>

      {/* Area Kartu Peserta (Visible on Screen & Print) */}
      <div id="participant-print-area">
        {filteredCards.length === 0 ? (
          <Card className="p-12 text-center border-dashed no-print">
            <IdCard className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <h4 className="text-base font-bold text-foreground">
              Tidak ada kartu peserta yang sesuai filter
            </h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-md mx-auto">
              {isAdmin
                ? 'Belum ada pendaftaran atlet pada event ini, atau filter yang dipilih tidak menemukan hasil.'
                : 'Belum ada atlet binaan Anda yang terdaftar pada nomor lomba, atau filter yang dipilih tidak menemukan hasil.'}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedEventId('all');
                  setSelectedAthleteId('all');
                  setStatusFilter('all');
                  setSearchQuery('');
                }}
                className="text-xs font-bold"
              >
                Reset Semua Filter
              </Button>
              {isAdmin ? (
                <>
                  <Link href="/verifikasi-pembayaran">
                    <Button size="sm" variant="outline" className="text-xs font-bold">
                      Verifikasi Pembayaran
                    </Button>
                  </Link>
                  <Link href="/events">
                    <Button size="sm" className="text-xs font-bold">
                      Kelola Kejuaraan / Event &rarr;
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href="/daftar-lomba">
                  <Button size="sm" className="text-xs font-bold">
                    Daftarkan Atlet ke Event &rarr;
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        ) : (
          <div className="print-cards-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((card) => (
              <div key={card.cardId} className="space-y-3">
                {/* Visual Kartu Peserta */}
                <AthleteParticipantCard data={card} />

                {/* Tombol Aksi per Kartu (Sembunyi saat dicetak) */}
                <div className="no-print flex items-center justify-between gap-2 px-1">
                  <div className="text-[11px] text-muted-foreground">
                    <b>{card.races.length} Nomor</b> lomba terdaftar
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleOpenSinglePrint(card)}
                    className="h-8 gap-1.5 text-xs font-bold hover:bg-primary hover:text-white"
                  >
                    <Printer className="h-3.5 w-3.5" /> Cetak Kartu Ini
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Dialog Cetak Tunggal */}
      <Dialog open={!!singlePrintCard} onOpenChange={(open) => !open && setSinglePrintCard(null)}>
        <DialogContent className="sm:max-w-md p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <IdCard className="h-5 w-5 text-primary" /> Pratinjau Kartu Peserta
            </DialogTitle>
          </DialogHeader>

          {singlePrintCard && (
            <div className="space-y-4 pt-2">
              <div className="max-h-[70vh] overflow-y-auto p-1">
                <AthleteParticipantCard data={singlePrintCard} isSinglePrint />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSinglePrintCard(null)}
                  className="text-xs"
                >
                  Tutup
                </Button>
                <Button
                  onClick={handleTriggerSinglePrint}
                  size="sm"
                  className="gap-1.5 text-xs font-bold"
                >
                  <Printer className="h-4 w-4" /> Cetak Sekarang
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
