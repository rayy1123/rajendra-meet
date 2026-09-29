'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  Waves,
  User,
  Users,
  CalendarDays,
  MapPin,
  ClipboardList,
  ArrowRight,
  ExternalLink,
  Plus,
  Radio,
  Timer,
  Trophy,
  Sparkles,
  IdCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatKuDisplay } from '@/lib/age-category';

export interface UserAthleteItem {
  id: string;
  fullName: string;
  athleteNumber: string;
  gender: 'male' | 'female';
  birthDate: string;
  ageGroup: string;
  gradeLevel?: string | null;
  schoolName: string;
  registrationCount: number;
}

export interface UserRegistrationItem {
  id: string;
  eventId: string;
  eventName: string;
  compEventName: string;
  athleteName: string;
  athleteNumber: string;
  gender: string;
  ageGroup: string;
  seedTimeMs: number | null;
  amountDue: number;
  paymentStatus: 'verified' | 'pending' | 'rejected' | 'unpaid';
  createdAt: string;
}

export interface ActiveChampionshipSpotlight {
  id: string;
  name: string;
  organizer?: string | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  poolType?: string | null;
  poolLengthMeters?: number | null;
  laneCount?: number | null;
  feePerEvent?: number | null;
  compEventCount: number;
}

export interface UserDashboardViewProps {
  userProfile: {
    id: string;
    fullName: string;
    username: string;
    avatarUrl?: string | null;
    role: string;
    email?: string;
  };
  athletes: UserAthleteItem[];
  registrations: UserRegistrationItem[];
  activeEvent: ActiveChampionshipSpotlight | null;
  totalPublishedEvents: number;
}

export function UserDashboardView({
  userProfile,
  athletes,
  registrations,
  activeEvent,
  totalPublishedEvents,
}: UserDashboardViewProps) {
  // Perhitungan Status Pendaftaran & Pembayaran
  const verifiedCount = useMemo(() => {
    return registrations.filter((r) => r.paymentStatus === 'verified').length;
  }, [registrations]);

  const pendingCount = useMemo(() => {
    return registrations.filter(
      (r) => r.paymentStatus === 'pending' || r.paymentStatus === 'unpaid'
    ).length;
  }, [registrations]);

  const primarySchoolName = useMemo(() => {
    const counts = new Map<string, number>();
    athletes.forEach((a) => {
      if (a.schoolName) {
        counts.set(a.schoolName, (counts.get(a.schoolName) || 0) + 1);
      }
    });
    let max = 0;
    let topName: string | null = null;
    counts.forEach((cnt, name) => {
      if (cnt > max) {
        max = cnt;
        topName = name;
      }
    });
    return topName;
  }, [athletes]);

  const totalBillAmount = useMemo(() => {
    return registrations.reduce((acc, r) => acc + (r.amountDue || 0), 0);
  }, [registrations]);

  // Alur Kerja Step State (1. Data Atlet, 2. Pilih Lomba, 3. Pembayaran, 4. Kartu Peserta)
  const workflowState = useMemo(() => {
    const hasAthletes = athletes.length > 0;
    const hasRaces = registrations.length > 0;
    const hasPaid = hasRaces && pendingCount === 0;
    const isReady = hasPaid && verifiedCount > 0;

    return {
      step1Done: hasAthletes,
      step2Done: hasRaces,
      step3Done: hasPaid,
      step4Done: isReady,
      currentStep: !hasAthletes ? 1 : !hasRaces ? 2 : !hasPaid ? 3 : 4,
    };
  }, [athletes, registrations, pendingCount, verifiedCount]);

  // Sisa Hari Menuju Event
  const daysUntilEvent = useMemo(() => {
    if (!activeEvent?.startDate) return null;
    const today = new Date();
    const eventDate = new Date(activeEvent.startDate);
    const diff = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [activeEvent]);

  return (
    <div className="space-y-6">
      {/* ── 1. HEADER USER BANNER DENGAN IDENTITY & STATUS CHIP ── */}
      <div className="glass-panel relative overflow-hidden p-6 border border-slate-200/90 bg-white/95 rounded-2xl shadow-xs">
        <div className="pointer-events-none absolute -right-8 -top-8 h-48 w-48 rounded-full bg-[var(--m-aqua-soft)]/70 blur-3xl" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[var(--m-aqua-soft)] via-white to-blue-50 border-2 border-white shadow-sm ring-2 ring-slate-100">
              {userProfile.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={userProfile.avatarUrl}
                  alt={userProfile.fullName}
                  className="h-full w-full object-cover"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/brand/logo.png"
                  alt="Rajendra Swim System"
                  className="h-10 w-auto object-contain p-1"
                />
              )}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)] border border-[var(--m-aqua)]/20 shadow-2xs">
                  <Sparkles className="h-3 w-3 text-[var(--m-aqua)]" />
                  RUANG ATLET &amp; WALI
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Akun Aktif • Musim 2026
                </span>
              </div>

              <h1 className="font-heading text-xl sm:text-2xl lg:text-3xl font-black tracking-tight text-[var(--m-ink)]">
                Selamat Datang, {userProfile.fullName}!
              </h1>

              <p className="text-xs text-[var(--m-muted)] font-mono">
                @{userProfile.username} • Kelola persiapan dan pantau nomor lomba atlet Anda di satu tempat.
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link href="/atlet-saya">
              <Button
                variant="outline"
                className="h-10 gap-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold shadow-2xs px-4 rounded-xl"
              >
                <Plus className="h-4 w-4 text-blue-600" /> Tambah Atlet
              </Button>
            </Link>

            <Link href="/daftar-lomba">
              <Button className="h-10 gap-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-sm px-4 rounded-xl">
                <CalendarDays className="h-4 w-4" /> Daftar Nomor Lomba
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── 2. INTERACTIVE 4-STEP COMPETITION WORKFLOW TRACKER ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600 font-bold text-xs">
              ⚡
            </span>
            <div>
              <h2 className="font-heading font-black text-sm sm:text-base text-slate-900">
                Alur Pendaftaran &amp; Kesiapan Kejuaraan
              </h2>
              <p className="text-[11px] text-slate-500">
                Ikuti 4 langkah terstruktur untuk memastikan perenang Anda siap tampil di gelanggang kolam.
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className="w-fit text-[10px] font-bold text-slate-700 bg-slate-50 border-slate-200"
          >
            Langkah {workflowState.currentStep} dari 4
          </Badge>
        </div>

        {/* 4 Steps Grid Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          {/* Step 1: Input Data Atlet */}
          <Link
            href="/atlet-saya"
            className={cn(
              'group p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2',
              workflowState.step1Done
                ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50'
                : 'border-blue-300 bg-blue-50/50 hover:bg-blue-50 ring-2 ring-blue-400/20'
            )}
          >
            <div className="flex items-start justify-between">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full font-mono font-black text-xs',
                  workflowState.step1Done
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 text-white'
                )}
              >
                {workflowState.step1Done ? '✓' : '1'}
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400">LANGKAH 1</span>
            </div>

            <div>
              <p className="font-heading font-bold text-slate-900 group-hover:text-blue-700 text-xs">
                Data Atlet Binaan
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Lengkapi nama, TTL, &amp; NIK untuk deteksi Kelompok Usia (KU) otomatis.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold">
              <span className={workflowState.step1Done ? 'text-emerald-700' : 'text-blue-700'}>
                {athletes.length > 0 ? `${athletes.length} Atlet Terdaftar` : 'Belum Ada Atlet'}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Step 2: Pilih Nomor Lomba */}
          <Link
            href="/daftar-lomba"
            className={cn(
              'group p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2',
              workflowState.step2Done
                ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50'
                : workflowState.step1Done
                ? 'border-indigo-300 bg-indigo-50/50 hover:bg-indigo-50 ring-2 ring-indigo-400/20'
                : 'border-slate-200 bg-slate-50/60 opacity-80'
            )}
          >
            <div className="flex items-start justify-between">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full font-mono font-black text-xs',
                  workflowState.step2Done
                    ? 'bg-emerald-600 text-white'
                    : 'bg-indigo-600 text-white'
                )}
              >
                {workflowState.step2Done ? '✓' : '2'}
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400">LANGKAH 2</span>
            </div>

            <div>
              <p className="font-heading font-bold text-slate-900 group-hover:text-indigo-700 text-xs">
                Pilih Nomor Lomba
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Pilih gaya, jarak renang (25m–1500m), dan masukkan seed time atlet.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold">
              <span className={workflowState.step2Done ? 'text-emerald-700' : 'text-indigo-700'}>
                {registrations.length > 0 ? `${registrations.length} Nomor Terpilih` : 'Pilih Lomba'}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Step 3: Pembayaran & Invoice */}
          <Link
            href="/pendaftaran-saya"
            className={cn(
              'group p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2',
              workflowState.step3Done
                ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50'
                : workflowState.step2Done
                ? 'border-amber-300 bg-amber-50/50 hover:bg-amber-50 ring-2 ring-amber-400/20'
                : 'border-slate-200 bg-slate-50/60 opacity-80'
            )}
          >
            <div className="flex items-start justify-between">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full font-mono font-black text-xs',
                  workflowState.step3Done
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 text-white'
                )}
              >
                {workflowState.step3Done ? '✓' : '3'}
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400">LANGKAH 3</span>
            </div>

            <div>
              <p className="font-heading font-bold text-slate-900 group-hover:text-amber-800 text-xs">
                Transfer &amp; Verifikasi
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Transfer dengan kode unik resmi &amp; unggah bukti untuk diverifikasi panitia.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold">
              <span className={workflowState.step3Done ? 'text-emerald-700' : 'text-amber-800'}>
                {pendingCount > 0 ? `${pendingCount} Menunggu Verifikasi` : registrations.length > 0 ? 'Lunas Terverifikasi' : 'Belum Ada Tagihan'}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          {/* Step 4: Cetak Kartu Peserta Call Room */}
          <Link
            href="/kartu-peserta"
            className={cn(
              'group p-3.5 rounded-xl border transition-all flex flex-col justify-between space-y-2',
              workflowState.step4Done
                ? 'border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/70 ring-2 ring-emerald-400/30'
                : 'border-slate-200 bg-slate-50/60 opacity-80'
            )}
          >
            <div className="flex items-start justify-between">
              <span
                className={cn(
                  'flex h-6 w-6 items-center justify-center rounded-full font-mono font-black text-xs',
                  workflowState.step4Done
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-400 text-white'
                )}
              >
                {workflowState.step4Done ? '✓' : '4'}
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400">LANGKAH 4</span>
            </div>

            <div>
              <p className="font-heading font-bold text-slate-900 group-hover:text-emerald-900 text-xs">
                Cetak ID Card Peserta
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Unduh ID Pass Call Room resmi lengkap dengan QR Code &amp; jadwal seri lomba.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold">
              <span className={workflowState.step4Done ? 'text-emerald-800' : 'text-slate-500'}>
                {workflowState.step4Done ? 'Siap Cetak Pass' : 'Kunci Buka Saat Lunas'}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>
      </div>

      {/* ── 3. HERO ACTIVE EVENT SPOTLIGHT (KEJUARAAN BERIKUTNYA) ── */}
      {activeEvent ? (
        <div className="glass-panel relative overflow-hidden p-6 border border-slate-200/90 bg-white/95 rounded-2xl shadow-xs">
          <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Sisi Kiri: Detail Kejuaraan Terdekat (7 Kolom) */}
            <div className="lg:col-span-8 space-y-3.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200">
                  <Trophy className="h-3 w-3 text-amber-500" />
                  KEJUARAAN AKUATIK TERDEKAT
                </span>
                <span className="text-xs text-slate-300">•</span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  {activeEvent.compEventCount} Nomor Lomba Tersedia
                </span>
                {daysUntilEvent !== null && daysUntilEvent > 0 && (
                  <>
                    <span className="text-xs text-slate-300">•</span>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      {daysUntilEvent} Hari Menuju Lomba
                    </span>
                  </>
                )}
              </div>

              <div>
                <h2 className="font-heading font-black text-xl sm:text-2xl text-slate-950 uppercase tracking-tight">
                  {activeEvent.name}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Diselenggarakan oleh {activeEvent.organizer || 'Panitia Pelaksana Resmi Rajendra Swim System'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-700 pt-1">
                <span className="flex items-center gap-1.5 font-semibold">
                  <Waves className="h-3.5 w-3.5 text-primary shrink-0" />
                  Kolam {activeEvent.poolLengthMeters || 50}m ({activeEvent.laneCount || 8} Lintasan)
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
                  {activeEvent.startDate || 'Segera'} {activeEvent.endDate && activeEvent.endDate !== activeEvent.startDate ? `s/d ${activeEvent.endDate}` : ''}
                </span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                  {activeEvent.location || 'Gelanggang Renang Resmi'}
                </span>
              </div>
            </div>

            {/* Sisi Kanan: Action Callout Card (4 Kolom) */}
            <div className="lg:col-span-4 rounded-xl border border-blue-200/80 bg-blue-50/50 p-4 space-y-3">
              <div className="space-y-1">
                <p className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                  Biaya Pendaftaran Nomor
                </p>
                <p className="font-heading text-xl font-black text-slate-950 font-mono">
                  Rp {(activeEvent.feePerEvent || 50000).toLocaleString('id-ID')}
                  <span className="text-xs font-normal text-slate-500 font-sans ml-1">/ nomor lomba</span>
                </p>
              </div>

              <div className="pt-2 flex flex-col gap-2">
                <Link href={`/daftar-lomba/${activeEvent.id}`}>
                  <Button className="w-full gap-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-sm h-9">
                    <CalendarDays className="h-3.5 w-3.5" /> Daftar Nomor di Event Ini
                  </Button>
                </Link>
                <Link href={`/public-live/${activeEvent.id}`} target="_blank">
                  <Button
                    variant="outline"
                    className="w-full gap-2 text-xs font-semibold text-slate-700 border-slate-300 hover:bg-white h-8"
                  >
                    <Radio className="h-3.5 w-3.5 text-rose-600" /> Buka Live Arena Board
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="glass-panel p-6 border border-slate-200 bg-white rounded-2xl flex items-center justify-between">
          <div>
            <h3 className="font-heading font-black text-base text-slate-900">
              Belum Ada Kejuaraan Dibuka
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Panitia sedang menyiapkan kalender kejuaraan renang musim berikutnya.
            </p>
          </div>
          <Link href="/daftar-lomba">
            <Button variant="outline" className="text-xs font-bold">
              Cek Kalender Kejuaraan
            </Button>
          </Link>
        </div>
      )}

      {/* ── 4. TWO-COLUMN CONTENT: ATLET BINAAN (KIRI) & PENDAFTARAN TERAKHIR (KANAN) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* KOLOM KIRI (7 Kolom): Roster Atlet Binaan Saya */}
        <div className="lg:col-span-7 space-y-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-600" />
                <h3 className="font-heading font-black text-base text-slate-900">
                  Data Atlet Binaan Saya ({athletes.length})
                </h3>
              </div>

              <Link href="/atlet-saya">
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-xs font-bold border-blue-200 text-blue-700 hover:bg-blue-50"
                >
                  <Plus className="h-3.5 w-3.5" /> Tambah Atlet
                </Button>
              </Link>
            </div>

            {athletes.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                <User className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-800 text-xs">Belum ada atlet yang didaftarkan</p>
                <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                  Masukkan data atlet Anda (nama, tanggal lahir, klub) untuk membuka pilihan nomor lomba yang sesuai batasan usia.
                </p>
                <Link href="/atlet-saya">
                  <Button size="sm" className="mt-2 text-xs font-bold bg-blue-600 text-white">
                    <Plus className="h-3.5 w-3.5 mr-1" /> Tambah Atlet Sekarang
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {athletes.slice(0, 4).map((ath) => (
                  <div
                    key={ath.id}
                    className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 font-mono font-black text-xs text-blue-900 shadow-2xs">
                        {ath.fullName
                          .split(' ')
                          .map((w) => w[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-900 text-xs truncate">
                            {ath.fullName}
                          </p>
                          <span
                            className={cn(
                              'text-[9px] font-black uppercase px-1.5 py-0.2 rounded border',
                              ath.gender === 'female'
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : 'bg-blue-50 text-blue-700 border-blue-200'
                            )}
                          >
                            {ath.gender === 'female' ? 'PI' : 'PA'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate flex items-center gap-1 flex-wrap">
                          <span>ID: <span className="font-mono font-bold text-slate-700">{ath.athleteNumber}</span></span>
                          <span>•</span>
                          <span className="font-bold text-slate-700">{formatKuDisplay(ath.ageGroup)}</span>
                          <span>•</span>
                          {primarySchoolName && ath.schoolName && ath.schoolName !== primarySchoolName ? (
                            <span className="font-black text-rose-800 bg-rose-100 px-1.5 py-0.2 rounded border border-rose-300 text-[9.5px]">
                              ⚠️ Beda Klub: {ath.schoolName}
                            </span>
                          ) : (
                            <span>{ath.schoolName}</span>
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link href={`/kartu-peserta?athleteId=${ath.id}`}>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 gap-1 text-[11px] font-semibold border-slate-200 hover:bg-white text-slate-700"
                          title="Cetak ID Pass Peserta"
                        >
                          <IdCard className="h-3 w-3 text-blue-600" /> ID Pass
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}

                {athletes.length > 4 && (
                  <div className="pt-1 text-center">
                    <Link
                      href="/atlet-saya"
                      className="text-xs font-bold text-blue-600 hover:text-blue-800"
                    >
                      Lihat Semua {athletes.length} Atlet Binaan &rarr;
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* KOLOM KANAN (5 Kolom): Status Pendaftaran & Pembayaran Terakhir */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-emerald-600" />
                <h3 className="font-heading font-black text-base text-slate-900">
                  Status Nomor Lomba Terdaftar
                </h3>
              </div>

              <Link
                href="/pendaftaran-saya"
                className="text-xs font-bold text-blue-600 hover:text-blue-800"
              >
                Lihat Tagihan &rarr;
              </Link>
            </div>

            {registrations.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                <ClipboardList className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-800 text-xs">Belum ada nomor lomba didaftarkan</p>
                <p className="text-[11px] text-slate-500">
                  Pilih kejuaraan aktif untuk mendaftarkan atlet binaan Anda.
                </p>
                <Link href="/daftar-lomba">
                  <Button size="sm" className="mt-1 text-xs font-bold bg-[#0284c7] text-white">
                    Pilih Nomor Lomba
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-2.5">
                {registrations.slice(0, 4).map((reg) => {
                  const isVerified = reg.paymentStatus === 'verified';
                  const isPending = reg.paymentStatus === 'pending' || reg.paymentStatus === 'unpaid';

                  return (
                    <div
                      key={reg.id}
                      className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 space-y-1.5 text-xs"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 leading-tight truncate">
                            {reg.compEventName}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                            Perenang: <span className="font-bold text-slate-800">{reg.athleteName}</span> ({reg.ageGroup})
                          </p>
                        </div>

                        <span
                          className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shrink-0 border',
                            isVerified
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                              : 'bg-amber-100 text-amber-800 border-amber-200'
                          )}
                        >
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              isVerified ? 'bg-emerald-600' : 'bg-amber-600'
                            )}
                          />
                          {isVerified ? 'LUNAS' : 'MENUNGGU'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/60 font-mono text-slate-600">
                        <span>Biaya: Rp {reg.amountDue.toLocaleString('id-ID')}</span>
                        <Link
                          href="/pendaftaran-saya"
                          className="font-sans font-bold text-blue-600 hover:underline"
                        >
                          Detail Status &rarr;
                        </Link>
                      </div>
                    </div>
                  );
                })}

                <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    Total: {registrations.length} entri ({verifiedCount} Lunas)
                  </span>
                  <Link
                    href="/kartu-peserta"
                    className="font-bold text-emerald-700 hover:text-emerald-900 inline-flex items-center gap-1"
                  >
                    <IdCard className="h-3.5 w-3.5" /> Cetak ID Pass &rarr;
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Banner Live Arena & Scoreboard Shortcut */}
          <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 p-5 text-white shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-white/20 text-white uppercase tracking-wider backdrop-blur-xs">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                ARENA SCOREBOARD
              </span>
              <Timer className="h-5 w-5 text-cyan-200" />
            </div>

            <h4 className="font-heading font-black text-sm uppercase tracking-wide">
              Pantau Catatan Waktu Lomba Real-Time
            </h4>
            <p className="text-[11px] text-cyan-100 leading-snug">
              Scoreboard digital sub-detik dapat ditonton dari smartphone atau layar arena tanpa perlu refresh halaman.
            </p>

            <div className="pt-2 flex items-center gap-2">
              <Link href="/scoreboard" target="_blank" className="flex-1">
                <Button
                  size="sm"
                  className="w-full bg-white text-blue-950 hover:bg-slate-100 text-xs font-bold h-8 shadow-xs"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" /> Buka Live Scoreboard
                </Button>
              </Link>
              <Link href="/results">
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-white/10 hover:bg-white/20 text-white border-white/30 text-xs font-semibold h-8"
                >
                  Hasil Lomba
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
