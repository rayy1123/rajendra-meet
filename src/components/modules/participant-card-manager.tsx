'use client';

import { useState, useMemo, useEffect } from 'react';
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
  Filter,
  Info,
  IdCard,
  Layers,
  School,
  Sparkles,
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
  initialEventId,
  isAdmin = false,
}: {
  cards: ParticipantCardData[];
  initialAthleteId?: string | null;
  initialEventId?: string | null;
  isAdmin?: boolean;
}) {
  const [selectedEventId, setSelectedEventId] = useState<string>(initialEventId || 'all');
  const [selectedClub, setSelectedClub] = useState<string>('all');
  const [selectedAthleteId, setSelectedAthleteId] = useState<string>(initialAthleteId || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [singlePrintCard, setSinglePrintCard] = useState<ParticipantCardData | null>(null);

  // List khusus yang akan dicetak saat window.print() dipicu
  const [cardsToPrint, setCardsToPrint] = useState<ParticipantCardData[]>([]);

  useEffect(() => {
    if (initialEventId) {
      setSelectedEventId(initialEventId);
    }
  }, [initialEventId]);

  useEffect(() => {
    if (initialAthleteId) {
      setSelectedAthleteId(initialAthleteId);
    }
  }, [initialAthleteId]);

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

  // Daftar unik Klub / Kontingen untuk filter
  const clubOptions = useMemo(() => {
    const set = new Set<string>();
    cards.forEach((c) => {
      if (c.athlete?.schoolName) {
        set.add(c.athlete.schoolName);
      }
    });
    return Array.from(set).sort();
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
      // Filter club
      if (selectedClub !== 'all' && c.athlete.schoolName !== selectedClub) {
        return false;
      }
      // Filter athlete
      if (selectedAthleteId !== 'all' && c.athlete.id !== selectedAthleteId) {
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
  }, [cards, selectedEventId, selectedClub, selectedAthleteId, searchQuery]);

  // Statistik Ringkasan
  const totalRacesCount = useMemo(() => {
    return filteredCards.reduce((acc, curr) => acc + curr.races.length, 0);
  }, [filteredCards]);

  const uniqueClubsCount = useMemo(() => {
    const set = new Set<string>();
    filteredCards.forEach((c) => set.add(c.athlete.schoolName));
    return set.size;
  }, [filteredCards]);

  const seededRacesCount = useMemo(() => {
    let count = 0;
    filteredCards.forEach((c) => {
      count += c.races.filter((r) => r.heatNumber && r.laneNumber).length;
    });
    return count;
  }, [filteredCards]);

  // Cetak Semua Kartu yang Tersaring
  const handlePrintAll = () => {
    setSinglePrintCard(null);
    setCardsToPrint(filteredCards);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Cetak Langsung 1 Kartu Spesifik
  const handlePrintSingleDirect = (card: ParticipantCardData) => {
    setSinglePrintCard(null);
    setCardsToPrint([card]);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Cetak dari Modal Pratinjau
  const handleTriggerModalPrint = () => {
    if (!singlePrintCard) return;
    const card = singlePrintCard;
    setSinglePrintCard(null);
    setCardsToPrint([card]);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <div className="space-y-6">
      {/* Print Stylesheet: Isolasi total hanya cetak kartu peserta */}
      <style jsx global>{`
        @media print {
          /* Sembunyikan SEMUA elemen non-kartu */
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
          div[data-aria-hidden="true"],
          button,
          input,
          select {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
            height: 0 !important;
            width: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
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

          @page {
            size: A4 portrait;
            margin: 8mm 10mm;
          }

          #participant-print-area {
            display: block !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          .print-cards-grid-sheet {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
            gap: 10mm !important;
            page-break-inside: auto !important;
          }

          .participant-badge-card {
            box-shadow: none !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            margin-bottom: 6mm !important;
          }

          /* Jika cetak tunggal, posisikan kartu di tengah halaman A4 */
          .single-print-wrapper {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            min-height: 270mm !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* ── KPI STATS OVERVIEW CARDS (SCREEN ONLY) ── */}
      <div className="no-print grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <IdCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Total Kartu Atlet</p>
              <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                {filteredCards.length} <span className="text-xs font-semibold text-slate-500">Atlet</span>
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Layers className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Nomor Diikuti</p>
              <p className="text-2xl font-black text-indigo-900 font-mono mt-0.5">
                {totalRacesCount} <span className="text-xs font-semibold text-slate-500">Nomor Lomba</span>
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
              <School className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Kontingen / Klub</p>
              <p className="text-2xl font-black text-cyan-900 font-mono mt-0.5">
                {uniqueClubsCount} <span className="text-xs font-semibold text-slate-500">Klub</span>
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase">Alokasi Seri / Lintasan</p>
              <p className="text-2xl font-black text-amber-700 font-mono mt-0.5">
                {seededRacesCount} <span className="text-xs font-semibold text-slate-500">Terseeding</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── BARIS KONTROL & FILTER ── */}
      <Card className="no-print border-slate-200 shadow-xs">
        <CardContent className="p-5 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                <Filter className="h-4 w-4 text-primary" /> Filter & Cetak Kartu Peserta
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pilih event, klub, atau atlet untuk menampilkan kartu identitas tanda peserta resmi.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                onClick={handlePrintAll}
                disabled={filteredCards.length === 0}
                className="gap-2 font-bold shadow-xs h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white"
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

            {/* Filter Klub / Kontingen */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <School className="h-3.5 w-3.5 text-primary" /> Klub / Kontingen
              </label>
              <Select value={selectedClub} onValueChange={setSelectedClub}>
                <SelectTrigger className="h-9 text-xs bg-background">
                  <SelectValue placeholder="Semua Klub" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua Klub / Kontingen</SelectItem>
                  {clubOptions.map((cName) => (
                    <SelectItem key={cName} value={cName}>{cName}</SelectItem>
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

            {/* Pencarian Teks */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Search className="h-3.5 w-3.5 text-primary" /> Cari Nama / Lomba / ID
              </label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Ketik nama atau nomor lomba..."
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
            Petunjuk Kartu Tanda Peserta Resmi (Official Call Room Pass)
          </p>
          <p className="text-blue-800">
            Kartu peserta memuat nama kejuaraan, identitas atlet, QR Code verifikasi Call Room, serta <b>daftar lengkap nomor perlombaan</b> beserta alokasi seri & lintasan. Klik <b>&quot;Cetak Kartu Ini&quot;</b> untuk mencetak 1 atlet, atau <b>&quot;Cetak Semua&quot;</b> untuk mencetak massal 2 kartu per lembar A4.
          </p>
        </div>
      </div>

      {/* ── AREA TAMPILAN SCREEN (GRID INTERAKTIF) ── */}
      <div className="no-print">
        {filteredCards.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
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
                  setSelectedClub('all');
                  setSelectedAthleteId('all');
                  setSearchQuery('');
                }}
                className="text-xs font-bold"
              >
                Reset Semua Filter
              </Button>
              {isAdmin ? (
                <>
                  <Link href="/events">
                    <Button size="sm" className="text-xs font-bold bg-blue-600 text-white">
                      Kelola Kejuaraan / Event &rarr;
                    </Button>
                  </Link>
                </>
              ) : (
                <Link href="/daftar-lomba">
                  <Button size="sm" className="text-xs font-bold bg-blue-600 text-white">
                    Daftarkan Atlet ke Event &rarr;
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCards.map((card) => (
              <div key={card.cardId} className="space-y-3">
                {/* Visual Kartu Peserta di Layar */}
                <AthleteParticipantCard data={card} />

                {/* Tombol Aksi per Kartu */}
                <div className="flex items-center justify-between gap-2 px-1">
                  <div className="text-[11px] text-muted-foreground">
                    <b>{card.races.length} Nomor</b> lomba terdaftar
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSinglePrintCard(card)}
                      className="h-8 px-2.5 text-xs font-semibold"
                      title="Pratinjau Kartu"
                    >
                      Pratinjau
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handlePrintSingleDirect(card)}
                      className="h-8 px-2.5 gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                      title="Cetak Tepat 1 Kartu Ini"
                    >
                      <Printer className="h-3.5 w-3.5" /> Cetak Kartu Ini
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── AREA CETAK KHUSUS (@media print) ── */}
      <div id="participant-print-area" className="hidden print:block">
        {cardsToPrint.length === 1 ? (
          <div className="single-print-wrapper">
            <AthleteParticipantCard data={cardsToPrint[0]} isSinglePrint />
          </div>
        ) : (
          <div className="print-cards-grid-sheet">
            {cardsToPrint.map((card) => (
              <AthleteParticipantCard key={card.cardId} data={card} />
            ))}
          </div>
        )}
      </div>

      {/* ── MODAL DIALOG PRATINJAU TUNGGAL ── */}
      <Dialog open={!!singlePrintCard} onOpenChange={(open) => !open && setSinglePrintCard(null)}>
        <DialogContent className="sm:max-w-md p-6 no-print">
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
                  onClick={handleTriggerModalPrint}
                  size="sm"
                  className="gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Printer className="h-4 w-4" /> Cetak Sekarang (1 Lembar)
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
