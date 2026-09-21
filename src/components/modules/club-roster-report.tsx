'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Printer,
  School,
  Trophy,
  Users,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Filter,
  ArrowLeft,
  CalendarDays,
  MapPin,
  Waves,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatMsToTime } from '@/lib/utils';
import { cn } from '@/lib/utils';

export interface RegistrationClubRecord {
  id: string;
  seed_time_ms: number | null;
  athletes: {
    id: string;
    full_name: string;
    athlete_number?: string | null;
    gender: 'male' | 'female';
    birth_date: string;
    age_group?: string | null;
    grade_level?: string | null;
    school_id?: string | null;
    schools?: {
      id: string;
      name: string;
      city?: string | null;
    } | null;
  } | null;
  competition_events: {
    id: string;
    order_no?: number | null;
    name: string;
    stroke: string;
    distance_meters: number;
    gender: string;
  } | null;
  payment_verifications: {
    id?: string;
    status: 'pending' | 'verified' | 'rejected';
    amount_due: number;
  } | null;
}

export interface ClubRosterReportProps {
  event: {
    id: string;
    name: string;
    organizer?: string | null;
    location?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    pool_type?: string | null;
    pool_length_meters?: number | null;
    lane_count?: number | null;
    fee_per_event?: number | null;
    bank_name?: string | null;
    bank_account_no?: string | null;
    bank_account_name?: string | null;
  };
  eventsList?: { id: string; name: string }[];
  schools: { id: string; name: string; city?: string | null }[];
  registrations: RegistrationClubRecord[];
  lockEvent?: boolean;
  backHref?: string;
}

interface GroupedAthlete {
  athleteId: string;
  fullName: string;
  athleteNumber: string;
  gender: 'male' | 'female';
  birthDate: string;
  ageGroup: string;
  gradeLevel: string;
  events: {
    regId: string;
    eventName: string;
    stroke: string;
    distance: number;
    seedTime: number | null;
    payStatus: 'pending' | 'verified' | 'rejected' | 'unpaid';
  }[];
  overallStatus: 'verified' | 'pending' | 'unpaid' | 'rejected';
}

interface GroupedClub {
  clubId: string;
  clubName: string;
  city: string;
  athletes: GroupedAthlete[];
  totalAthletes: number;
  totalEventEntries: number;
  totalFee: number;
  clubPaymentStatus: 'verified' | 'pending' | 'unpaid';
}

export function ClubRosterReport({
  event,
  eventsList = [],
  schools,
  registrations,
  lockEvent = false,
  backHref = `/events/${event.id}`,
}: ClubRosterReportProps) {
  const [selectedClubId, setSelectedClubId] = useState<string>('all');
  const [filterPayment, setFilterPayment] = useState<string>('all');

  const feePerEvent = event.fee_per_event || 50000;

  // Kelompokkan data per Klub -> per Atlet -> Daftar Nomor Lomba
  const clubsData = useMemo(() => {
    const clubMap = new Map<string, GroupedClub>();

    // Inisialisasi daftar klub yang terdaftar dalam data registrasi
    registrations.forEach((reg) => {
      const athlete = reg.athletes;
      if (!athlete) return;

      const clubId = athlete.schools?.id || athlete.school_id || 'umum';
      const clubName = athlete.schools?.name || 'Umum / Perorangan (Tanpa Klub)';
      const city = athlete.schools?.city || '–';

      if (!clubMap.has(clubId)) {
        clubMap.set(clubId, {
          clubId,
          clubName,
          city,
          athletes: [],
          totalAthletes: 0,
          totalEventEntries: 0,
          totalFee: 0,
          clubPaymentStatus: 'verified',
        });
      }

      const club = clubMap.get(clubId)!;

      // Cari atau buat entri atlet di dalam klub
      let athEntry = club.athletes.find((a) => a.athleteId === athlete.id);
      if (!athEntry) {
        athEntry = {
          athleteId: athlete.id,
          fullName: athlete.full_name,
          athleteNumber: athlete.athlete_number || '–',
          gender: athlete.gender,
          birthDate: athlete.birth_date,
          ageGroup: athlete.age_group || athlete.grade_level || 'Umum',
          gradeLevel: athlete.grade_level || '–',
          events: [],
          overallStatus: 'verified',
        };
        club.athletes.push(athEntry);
      }

      // Ambil status pembayaran
      const rawPay = reg.payment_verifications;
      const status: 'pending' | 'verified' | 'rejected' | 'unpaid' = rawPay?.status || 'unpaid';

      athEntry.events.push({
        regId: reg.id,
        eventName: reg.competition_events?.name || 'Nomor Lomba',
        stroke: reg.competition_events?.stroke || '–',
        distance: reg.competition_events?.distance_meters || 0,
        seedTime: reg.seed_time_ms,
        payStatus: status,
      });
    });

    // Hitung ringkasan status pembayaran per atlet & per klub
    const result: GroupedClub[] = [];

    clubMap.forEach((club) => {
      let clubHasPending = false;
      let clubHasUnpaid = false;
      let totalEntries = 0;

      club.athletes.forEach((ath) => {
        totalEntries += ath.events.length;
        const hasUnpaid = ath.events.some((e) => e.payStatus === 'unpaid' || e.payStatus === 'rejected');
        const hasPending = ath.events.some((e) => e.payStatus === 'pending');

        if (hasUnpaid) {
          ath.overallStatus = 'unpaid';
          clubHasUnpaid = true;
        } else if (hasPending) {
          ath.overallStatus = 'pending';
          clubHasPending = true;
        } else {
          ath.overallStatus = 'verified';
        }
      });

      club.totalAthletes = club.athletes.length;
      club.totalEventEntries = totalEntries;
      club.totalFee = totalEntries * feePerEvent;

      if (clubHasUnpaid) {
        club.clubPaymentStatus = 'unpaid';
      } else if (clubHasPending) {
        club.clubPaymentStatus = 'pending';
      } else {
        club.clubPaymentStatus = 'verified';
      }

      result.push(club);
    });

    // Urutkan nama klub alfabetis
    return result.sort((a, b) => a.clubName.localeCompare(b.clubName));
  }, [registrations, feePerEvent]);

  // Filter klub yang akan ditampilkan
  const filteredClubs = useMemo(() => {
    return clubsData.filter((c) => {
      const matchClub = selectedClubId === 'all' || c.clubId === selectedClubId;
      const matchPayment =
        filterPayment === 'all' ||
        (filterPayment === 'verified' && c.clubPaymentStatus === 'verified') ||
        (filterPayment === 'pending' && c.clubPaymentStatus === 'pending') ||
        (filterPayment === 'unpaid' && c.clubPaymentStatus === 'unpaid');

      return matchClub && matchPayment;
    });
  }, [clubsData, selectedClubId, filterPayment]);

  const totalAllClubs = clubsData.length;
  const totalAllAthletes = clubsData.reduce((sum, c) => sum + c.totalAthletes, 0);
  const totalAllEntries = clubsData.reduce((sum, c) => sum + c.totalEventEntries, 0);
  const totalAllRevenue = clubsData.reduce((sum, c) => sum + c.totalFee, 0);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Print Specific CSS */}
      <style jsx global>{`
        @media print {
          aside,
          header,
          nav,
          footer,
          .no-print {
            display: none !important;
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

          .club-print-sheet {
            page-break-after: always !important;
            break-after: page !important;
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            min-height: 270mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            background: #ffffff !important;
            padding: 12px 14px !important;
            margin-bottom: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }
        }
      `}</style>

      {/* TOOLBAR CONTROLS (NO PRINT) */}
      <div className="no-print rounded-2xl border border-[var(--m-border)] bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)] font-black text-sm">
                <School className="h-4 w-4" />
              </span>
              <h2 className="font-heading font-black text-lg text-[var(--m-ink)]">
                Rekap Atlet & Status Pembayaran per Klub
              </h2>
            </div>
            <p className="text-xs text-[var(--m-muted)] mt-1">
              Dokumen resmi daftar atlet yang dikirim oleh masing-masing sekolah / klub renang beserta rincian status verifikasi pembayarannya.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrint}
              className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
            >
              <Printer className="h-4 w-4" /> Cetak PDF Lembar Klub
            </Button>
            <Link href={backHref}>
              <Button variant="outline" className="gap-1.5 text-xs font-semibold">
                <ArrowLeft className="h-3.5 w-3.5" /> Kembali
              </Button>
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Kejuaraan Selector */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-amber-500" /> Kejuaraan Terpilih
            </label>
            {lockEvent || eventsList.length === 0 ? (
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200 font-bold text-slate-900 truncate">
                {event.name}
              </div>
            ) : (
              <Select
                value={event.id}
                onValueChange={(val) => {
                  window.location.assign(`/events/${val}/rekap-klub`);
                }}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pilih Event" />
                </SelectTrigger>
                <SelectContent>
                  {eventsList.map((e) => (
                    <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Klub Selector */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <School className="h-3.5 w-3.5 text-indigo-600" /> Pilih Klub / Kontingen
            </label>
            <Select value={selectedClubId} onValueChange={setSelectedClubId}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Semua Klub" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-bold text-blue-700">
                  ⭐ Cetak Semua Klub ({clubsData.length} Klub)
                </SelectItem>
                {clubsData.map((c) => (
                  <SelectItem key={c.clubId} value={c.clubId}>
                    {c.clubName} ({c.totalAthletes} Atlet)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Filter Status Bayar */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-emerald-600" /> Status Pembayaran
            </label>
            <Select value={filterPayment} onValueChange={setFilterPayment}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status Bayar</SelectItem>
                <SelectItem value="verified" className="text-emerald-700 font-bold">
                  ✓ Lunas (Verified)
                </SelectItem>
                <SelectItem value="pending" className="text-amber-700 font-bold">
                  ⏳ Menunggu Verifikasi (Pending)
                </SelectItem>
                <SelectItem value="unpaid" className="text-rose-700 font-bold">
                  ✕ Belum Lunas (Unpaid)
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Rekap Total Header Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Klub</span>
            <span className="font-heading text-lg font-black text-slate-900">{totalAllClubs} Klub</span>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50/60 border border-blue-200">
            <span className="text-[10px] uppercase font-bold text-blue-600 block">Total Atlet</span>
            <span className="font-heading text-lg font-black text-blue-950">{totalAllAthletes} Atlet</span>
          </div>
          <div className="p-2.5 rounded-xl bg-indigo-50/60 border border-indigo-200">
            <span className="text-[10px] uppercase font-bold text-indigo-600 block">Total Nomor Lomba</span>
            <span className="font-heading text-lg font-black text-indigo-950">{totalAllEntries} Entri</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200">
            <span className="text-[10px] uppercase font-bold text-emerald-600 block">Total Tagihan Kejuaraan</span>
            <span className="font-heading text-lg font-black text-emerald-950 font-mono">
              Rp {totalAllRevenue.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      </div>

      {/* LEMBAR DOKUMEN REKAP (PRINTABLE AREA) */}
      <div id="club-roster-print-area" className="space-y-8">
        {filteredClubs.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
            <School className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <h4 className="font-heading font-bold text-base text-slate-800">
              Belum ada atlet atau klub yang terdaftar pada kejuaraan ini
            </h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Silakan lakukan pendaftaran atlet terlebih dahulu melalui menu <b>Daftar Perlombaan</b> atau unggah berkas Excel pendaftaran klub.
            </p>
            <Link href={`/perlombaan/partisipasi/${event.id}`}>
              <Button className="gap-2 text-xs font-bold bg-blue-600 text-white mt-2">
                <Users className="h-4 w-4" /> Masukkan Atlet / Import Excel
              </Button>
            </Link>
          </div>
        ) : (
          filteredClubs.map((club, cIdx) => {
            const isVerified = club.clubPaymentStatus === 'verified';
            const isPending = club.clubPaymentStatus === 'pending';

            return (
              <div
                key={club.clubId}
                className="club-print-sheet rounded-2xl border border-slate-300 bg-white p-6 sm:p-8 shadow-sm print:border-none print:shadow-none print:p-0"
              >
                {/* 1. KOP DOKUMEN RESMI KEJUARAAN */}
                <div className="border-b-2 border-slate-900 pb-3 flex items-center justify-between gap-4">
                  <div className="flex shrink-0 items-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/brand/logo.png"
                      alt="Rajendra Meet"
                      className="h-8 w-auto sm:h-9 max-w-[110px] object-contain"
                    />
                  </div>

                  <div className="flex-1 text-center min-w-0 px-2">
                    <span className="font-mono text-[10px] font-black uppercase tracking-widest text-slate-500 block">
                      OFFICIAL CONTINGENT ROSTER & PAYMENT SUMMARY
                    </span>
                    <h1 className="font-heading font-black text-sm sm:text-base uppercase tracking-tight text-slate-950 leading-snug">
                      REKAPITULASI ATLET & STATUS PEMBAYARAN KONTINGEN
                    </h1>
                    <p className="text-xs font-bold uppercase text-slate-800 mt-0.5">
                      {event.name}
                    </p>
                    <p className="text-[10px] text-slate-600">
                      {event.location || 'Kolam Renang Resmi'} • {event.start_date} s/d {event.end_date}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center justify-end">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src="/brand/rajendra-organizer-logo.png"
                      alt="Rajendra Swimming Organizer"
                      className="h-7 w-auto sm:h-8 max-w-[115px] object-contain"
                    />
                  </div>
                </div>

                {/* 2. KOTAK INFORMASI KONTINGEN & STATUS PEMBAYARAN */}
                <div className="my-4 grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl border border-slate-300 bg-slate-50/80 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="w-28 font-bold text-slate-600">Sekolah / Klub:</span>
                      <span className="font-heading font-black text-sm text-slate-950">{club.clubName}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="w-28 font-bold text-slate-600">Kota / Asal:</span>
                      <span className="font-semibold text-slate-900">{club.city}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="w-28 font-bold text-slate-600">Total Atlet Dikirim:</span>
                      <span className="font-bold text-blue-900 font-mono">{club.totalAthletes} Atlet</span>
                    </div>
                  </div>

                  <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
                    <div className="flex items-baseline gap-2">
                      <span className="w-32 font-bold text-slate-600">Total Nomor Diikuti:</span>
                      <span className="font-bold text-indigo-900 font-mono">{club.totalEventEntries} Nomor Lomba</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="w-32 font-bold text-slate-600">Total Biaya Pendaftaran:</span>
                      <span className="font-mono font-black text-slate-950 text-xs">
                        Rp {club.totalFee.toLocaleString('id-ID')}
                        <span className="font-normal text-[10px] text-slate-500 ml-1">
                          (@Rp {feePerEvent.toLocaleString('id-ID')})
                        </span>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 pt-0.5">
                      <span className="w-32 font-bold text-slate-600">Status Pembayaran:</span>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-black tracking-wide border uppercase',
                          isVerified
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                            : isPending
                            ? 'bg-amber-100 text-amber-900 border-amber-300'
                            : 'bg-rose-100 text-rose-900 border-rose-300'
                        )}
                      >
                        {isVerified ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-700" /> LUNAS (VERIFIED)
                          </>
                        ) : isPending ? (
                          <>
                            <Clock className="h-3 w-3 text-amber-700" /> MENUNGGU VERIFIKASI
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-3 w-3 text-rose-700" /> BELUM LUNAS (UNPAID)
                          </>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. TABEL DAFTAR ATLET & NOMOR LOMBA YANG DIIKUTI */}
                <div className="flex-1 overflow-hidden rounded-xl border border-slate-300 shadow-2xs">
                  <table className="w-full border-collapse text-left text-xs">
                    <thead>
                      <tr className="border-b-2 border-slate-300 bg-blue-50/80 font-black text-slate-950">
                        <th className="border-r border-slate-300 p-2 text-center w-10">No</th>
                        <th className="border-r border-slate-300 p-2 w-48">Nama Atlet</th>
                        <th className="border-r border-slate-300 p-2 text-center w-14">Gender</th>
                        <th className="border-r border-slate-300 p-2 text-center w-24">Kelompok Usia (KU)</th>
                        <th className="border-r border-slate-300 p-2">Nomor Lomba yang Diikuti</th>
                        <th className="border-r border-slate-300 p-2 text-center w-24">Seed Time</th>
                        <th className="p-2 text-center w-28">Status Atlet</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {club.athletes.map((ath, aIdx) => {
                        const athVerified = ath.overallStatus === 'verified';
                        const athPending = ath.overallStatus === 'pending';

                        return (
                          <tr key={ath.athleteId} className="hover:bg-slate-50/70 transition-colors">
                            <td className="border-r border-slate-200 p-2 text-center font-bold text-slate-900">
                              {aIdx + 1}
                            </td>
                            <td className="border-r border-slate-200 p-2">
                              <div className="font-bold text-slate-950 text-xs">
                                {ath.fullName}
                              </div>
                              <span className="text-[10px] text-slate-500 font-mono">
                                ID: {ath.athleteNumber || '–'}
                              </span>
                            </td>
                            <td className="border-r border-slate-200 p-2 text-center">
                              <span
                                className={cn(
                                  'font-bold text-[11px]',
                                  ath.gender === 'female' ? 'text-rose-700' : 'text-blue-700'
                                )}
                              >
                                {ath.gender === 'female' ? 'Putri' : 'Putra'}
                              </span>
                            </td>
                            <td className="border-r border-slate-200 p-2 text-center font-semibold text-slate-800">
                              <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px] font-bold">
                                {ath.ageGroup}
                              </span>
                            </td>
                            <td className="border-r border-slate-200 p-2">
                              <div className="space-y-1">
                                {ath.events.map((ev, eIdx) => (
                                  <div key={ev.regId} className="flex items-center justify-between text-[11px]">
                                    <span className="font-medium text-slate-900">
                                      {eIdx + 1}. {ev.eventName}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="border-r border-slate-200 p-2 text-center font-mono font-semibold text-slate-700 text-[11px]">
                              {ath.events.map((ev) => (
                                <div key={ev.regId}>
                                  {ev.seedTime ? formatMsToTime(ev.seedTime) : '—'}
                                </div>
                              ))}
                            </td>
                            <td className="p-2 text-center">
                              <span
                                className={cn(
                                  'inline-block px-2 py-0.5 rounded text-[10px] font-black uppercase',
                                  athVerified
                                    ? 'bg-emerald-100 text-emerald-900'
                                    : athPending
                                    ? 'bg-amber-100 text-amber-900'
                                    : 'bg-rose-100 text-rose-900'
                                )}
                              >
                                {athVerified ? 'Lunas' : athPending ? 'Pending' : 'Belum'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 4. REKENING PANITIA & CATATAN */}
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-[11px]">
                  <div>
                    <span className="font-bold text-slate-800 block">Rekening Resmi Pembayaran Panitia:</span>
                    <p className="text-slate-700 font-mono mt-0.5">
                      {event.bank_name || 'Bank Mandiri'} • No. Rek: <b>{event.bank_account_no || '107337200374'}</b>
                    </p>
                    <p className="text-slate-600">
                      a/n {event.bank_account_name || 'Panitia Pelaksana Kejuaraan Renang'}
                    </p>
                  </div>
                  <div className="text-right sm:text-right text-slate-600">
                    <span className="font-bold text-slate-800 block">Verifikasi Pendaftaran:</span>
                    <p className="text-[10px]">
                      Lembar ini adalah bukti rekapitulasi resmi atlet per klub. Tunjukkan lembar ini saat registrasi ulang kontingen.
                    </p>
                  </div>
                </div>

                {/* 5. TANDA TANGAN & PENGESAHAN DOKUMEN */}
                <div className="mt-4 pt-3 border-t border-slate-300 flex items-center justify-between text-xs text-slate-800">
                  <div className="text-center w-52">
                    <p className="text-[11px] text-slate-600">Official / Manajer Tim,</p>
                    <p className="font-bold text-slate-900 mt-0.5">{club.clubName}</p>
                    <div className="h-14" />
                    <p className="font-semibold text-slate-900 border-t border-slate-400 pt-1">
                      ( .................................................. )
                    </p>
                  </div>

                  <div className="text-center w-52">
                    <p className="text-[11px] text-slate-600">
                      {event.location?.split(',')[0] || 'Jakarta'}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="font-bold text-slate-900 mt-0.5">Panitia Pelaksana,</p>
                    <div className="h-14 flex items-center justify-center">
                      <span className="text-[9px] uppercase font-mono font-bold text-slate-300 border border-dashed border-slate-300 px-3 py-1 rounded">
                        STEMPEL PANITIA
                      </span>
                    </div>
                    <p className="font-semibold text-slate-900 border-t border-slate-400 pt-1">
                      ( Bendahara / Seksi Pendaftaran )
                    </p>
                  </div>
                </div>

                {/* Footer Bar Kecil */}
                <div className="mt-2 pt-1 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
                  <span>SCMS Rajendra Meet · Dokumen Rekapitulasi Kontingen</span>
                  <span>Dicetak: {new Date().toLocaleString('id-ID')}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
