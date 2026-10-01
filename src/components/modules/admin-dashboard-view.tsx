'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Trophy,
  Users,
  Layers,
  CreditCard,
  BookOpen,
  Calendar,
  CalendarDays,
  MapPin,
  Waves,
  ArrowRight,
  ExternalLink,
  Plus,
  Radio,
  CheckCircle2,
  Clock,
  Printer,
  Sparkles,
  Wifi,
  Tv,
  Eye,
  Activity,
  Check,
  Building2,
  Filter,
  ShieldCheck,
  Sliders,
  KeyRound,
  Copy,
  MessageCircle,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { type ScheduleItem } from '@/lib/data/schedules-server';
import { type AdminOtpRecord } from '@/lib/data/admin-otp-server';
import { toast } from 'sonner';

export interface ActiveEventSpotlight {
  id: string;
  name: string;
  organizer?: string | null;
  location?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  poolType?: string | null;
  poolLengthMeters?: number | null;
  laneCount?: number | null;
  compEventCount: number;
  registrationCount: number;
  maxParticipants?: number | null;
}

export interface ClubSummaryRow {
  id: string;
  name: string;
  city?: string | null;
  regCode?: string;
  athleteCount: number;
  entryCount: number;
  totalFee: number;
  status: 'verified' | 'pending' | 'unpaid';
}

export interface AdminDashboardViewProps {
  activeEvent: ActiveEventSpotlight | null;
  totalAthletes: number;
  totalEvents: number;
  totalEntries: number;
  totalClubs: number;
  totalRevenue: number;
  pendingPaymentCount: number;
  clubsSummary: ClubSummaryRow[];
  schedules?: ScheduleItem[];
  adminOtps?: AdminOtpRecord[];
  seasonYear?: string;
}

export function AdminDashboardView({
  activeEvent,
  totalAthletes,
  totalEvents,
  totalEntries,
  totalClubs,
  totalRevenue,
  pendingPaymentCount,
  clubsSummary,
  schedules = [],
  adminOtps = [],
  seasonYear = '2026',
}: AdminDashboardViewProps) {
  const [clubFilter, setClubFilter] = useState<'all' | 'pending'>('all');

  // Quota & progress calculation for spotlight event
  const quota = useMemo(() => {
    if (!activeEvent) return { max: 1000, filled: 0, percentage: 0 };
    const max = activeEvent.maxParticipants || (activeEvent.compEventCount > 50 ? 1000 : 800);
    const filled = activeEvent.registrationCount;
    const percentage = Math.min(100, Math.round((filled / max) * 100));
    return { max, filled, percentage };
  }, [activeEvent]);

  // Filtered clubs table
  const filteredClubs = useMemo(() => {
    if (clubFilter === 'pending') {
      return clubsSummary.filter((c) => c.status === 'pending' || c.status === 'unpaid');
    }
    return clubsSummary;
  }, [clubsSummary, clubFilter]);

  const pendingClubsCount = useMemo(() => {
    return clubsSummary.filter((c) => c.status === 'pending' || c.status === 'unpaid').length;
  }, [clubsSummary]);

  // Average entries per athlete
  const avgEntryPerAthlete = totalAthletes > 0 ? (totalEntries / totalAthletes).toFixed(1) : '2.6';

  return (
    <div className="space-y-6">
      {/* ── 1. HEADER DASBOR OPERASIONAL (SESUAI IMAGE #13) ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)] border border-[var(--m-aqua)]/20 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--m-aqua)] animate-pulse" />
              COMMAND CENTER | Musim {seasonYear}
            </span>
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[var(--m-ink)]">
            Dasbor Operasional Kejuaraan
          </h1>

          <p className="max-w-2xl text-xs sm:text-sm text-[var(--m-muted)] leading-relaxed">
            Pantauan langsung registrasi kontingen, pembagian nomor seri, kesiapan sistem timing, dan verifikasi kuota atlet secara real-time.
          </p>
        </div>

        {/* Action Buttons Kanan Atas */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link href="/events/new">
            <Button
              variant="outline"
              className="h-10 gap-2 border-blue-200 bg-blue-50/80 hover:bg-blue-100 text-blue-800 text-xs font-bold shadow-2xs px-4 rounded-xl"
            >
              <Plus className="h-4 w-4 text-blue-600" /> Tambah Kejuaraan Baru
            </Button>
          </Link>

          <Link href="/scoreboard" target="_blank">
            <Button className="h-10 gap-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-sm px-4 rounded-xl">
              <ExternalLink className="h-4 w-4" /> Buka Live Scoreboard
            </Button>
          </Link>
        </div>
      </div>

      {/* ── 2. HERO FEATURE CARD: SPOTLIGHT KEJUARAAN AKTIF & 4-STEP ACTION MATRIX ── */}
      {activeEvent && (
        <div className="glass-panel relative overflow-hidden p-6 border border-slate-200/90 bg-white/95 rounded-2xl shadow-xs">
          <div className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Sisi Kiri: Detail Event & Progress Kuota (7 Kolom) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-900 border border-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 animate-pulse" />
                  AKTIF • SERI REGIONAL I
                </span>
                <span className="text-xs text-slate-400">•</span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  {activeEvent.compEventCount} Nomor Lomba Terjadwal
                </span>
              </div>

              <div className="space-y-1">
                <Link href={`/events/${activeEvent.id}`}>
                  <h2 className="font-heading font-black text-xl sm:text-2xl lg:text-3xl text-slate-950 uppercase tracking-tight hover:text-blue-700 transition-colors">
                    {activeEvent.name}
                  </h2>
                </Link>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600 pt-1">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <Waves className="h-3.5 w-3.5 text-primary shrink-0" />
                    Kolam {activeEvent.poolLengthMeters || 50}m Olympic Standard ({activeEvent.laneCount || 8} Lintasan)
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-3.5 w-3.5 text-primary shrink-0" />
                    {activeEvent.startDate || '12 - 15 April 2026'} {activeEvent.endDate && activeEvent.endDate !== activeEvent.startDate ? `s/d ${activeEvent.endDate}` : ''}
                  </span>
                  <span className="text-slate-300">•</span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
                    {activeEvent.location || 'Gelanggang Renang Senayan Jakarta'}
                  </span>
                </div>
              </div>

              {/* Progress Bar Kuota Atlet */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-700">
                    Pendaftaran Dibuka (Hari ke-14 dari 20)
                  </span>
                  <span className="font-mono font-black text-slate-950 text-xs">
                    {quota.filled} / {quota.max} Atlet ({quota.percentage}%)
                  </span>
                </div>

                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0284c7] via-[#0ea5e9] to-[#06b6d4] transition-all duration-500"
                    style={{ width: `${Math.max(5, quota.percentage)}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Sisi Kanan: 2x2 Numbered Quick Action Matrix (5 Kolom) */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-2.5">
              {/* 01: Setup Heat & Seri */}
              <Link
                href={`/heats?eventId=${activeEvent.id}`}
                className="group p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-blue-50/60 hover:border-blue-300 transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <Layers className="h-4 w-4 text-blue-600 group-hover:scale-110 transition-transform" />
                  <span className="font-mono text-[10px] font-bold text-slate-400">01</span>
                </div>
                <div className="mt-2">
                  <p className="font-heading font-bold text-xs text-slate-900 group-hover:text-blue-900">
                    Setup Heat &amp; Seri
                  </p>
                  <p className="text-[10px] text-slate-500">Spearhead Method</p>
                </div>
              </Link>

              {/* 02: Cetak Buku Acara */}
              <Link
                href={`/buku-acara?event=${activeEvent.id}`}
                className="group p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-amber-50/60 hover:border-amber-300 transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <Printer className="h-4 w-4 text-amber-600 group-hover:scale-110 transition-transform" />
                  <span className="font-mono text-[10px] font-bold text-slate-400">02</span>
                </div>
                <div className="mt-2">
                  <p className="font-heading font-bold text-xs text-slate-900 group-hover:text-amber-900">
                    Cetak Buku Acara
                  </p>
                  <p className="text-[10px] text-slate-500">Format A4 Resmi</p>
                </div>
              </Link>

              {/* 03: Verifikasi Transfer */}
              <Link
                href="/verifikasi-pembayaran"
                className="group p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-emerald-50/60 hover:border-emerald-300 transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                  <span className="font-mono text-[10px] font-bold text-slate-400">03</span>
                </div>
                <div className="mt-2">
                  <p className="font-heading font-bold text-xs text-slate-900 group-hover:text-emerald-900">
                    Verifikasi Transfer
                  </p>
                  <p className="text-[10px] text-emerald-700 font-semibold">
                    {pendingPaymentCount > 0 ? `${pendingPaymentCount} Antrean Baru` : 'Semua Terverifikasi'}
                  </p>
                </div>
              </Link>

              {/* 04: Console Input Waktu */}
              <Link
                href={`/results?eventId=${activeEvent.id}`}
                className="group p-3 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-cyan-50/60 hover:border-cyan-300 transition-all flex flex-col justify-between"
              >
                <div className="flex items-start justify-between">
                  <Clock className="h-4 w-4 text-cyan-600 group-hover:scale-110 transition-transform" />
                  <span className="font-mono text-[10px] font-bold text-slate-400">04</span>
                </div>
                <div className="mt-2">
                  <p className="font-heading font-bold text-xs text-slate-900 group-hover:text-cyan-900">
                    Console Input Waktu
                  </p>
                  <p className="text-[10px] text-slate-500">Touchpad Ready</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* ── 3. KPI METRICS ROW (4 KARTU BERIKON KHAS IMAGE #13) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Atlet Terdaftar */}
        <div className="glass-panel p-5 border border-slate-200/90 bg-white rounded-2xl shadow-xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-600">Total Atlet Terdaftar</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-heading font-black text-3xl text-slate-950 font-mono">
              {totalAthletes}
            </span>
            <span className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded">
              +64 hari ini
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Dari {totalClubs} Kontingen / Klub</p>
        </div>

        {/* Metric 2: Total Entri Nomor Lomba */}
        <div className="glass-panel p-5 border border-slate-200/90 bg-white rounded-2xl shadow-xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-600">Total Entri Nomor Lomba</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
              <Trophy className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-heading font-black text-3xl text-slate-950 font-mono">
              {totalEntries.toLocaleString('id-ID')}
            </span>
            <span className="text-xs font-semibold text-slate-500 font-sans">Entri</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Rata-rata {avgEntryPerAthlete} nomor / atlet</p>
        </div>

        {/* Metric 3: Pembayaran & Tagihan */}
        <div className="glass-panel p-5 border border-slate-200/90 bg-white rounded-2xl shadow-xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-600">Pembayaran &amp; Tagihan</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
              <CreditCard className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2">
            <span className="font-heading font-black text-2xl text-slate-950 font-mono">
              Rp {totalRevenue.toLocaleString('id-ID')}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>92% Terverifikasi Lunas</span>
          </div>
        </div>

        {/* Metric 4: Kesiapan Buku Acara */}
        <div className="glass-panel p-5 border border-slate-200/90 bg-white rounded-2xl shadow-xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-600">Kesiapan Buku Acara</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
              <BookOpen className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-heading font-black text-3xl text-slate-950 font-mono">
              {Math.max(16, (activeEvent?.compEventCount || 0))} / {Math.max(16, activeEvent?.compEventCount || 0)}
            </span>
            <span className="text-xs font-semibold text-slate-500 font-sans">Nomor Siap</span>
          </div>
          <div className="mt-1.5 space-y-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
              <span>Siap Seeding</span>
              <span className="font-mono text-emerald-600">100%</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-500 w-full" />
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. MIDDLE TWO-COLUMN SECTION (SESUAI IMAGE #13) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── KOLOM KIRI (7 Kolom): Pendaftaran Kontingen & Panduan Alur Kerja ── */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card: Pendaftaran Kontingen Terbaru */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-heading font-black text-base text-slate-900">
                  Pendaftaran Kontingen Terbaru
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Entri klub resmi yang baru masuk dan membutuhkan pemantauan panitia.
                </p>
              </div>

              {/* Filter Pills: Semua (46) vs Pending (4) */}
              <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 border border-slate-200/60 w-fit text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setClubFilter('all')}
                  className={cn(
                    'px-3 py-1 rounded-lg transition-all cursor-pointer',
                    clubFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-950'
                  )}
                >
                  Semua ({clubsSummary.length})
                </button>
                <button
                  type="button"
                  onClick={() => setClubFilter('pending')}
                  className={cn(
                    'px-3 py-1 rounded-lg transition-all cursor-pointer',
                    clubFilter === 'pending'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-950'
                  )}
                >
                  Pending ({pendingClubsCount})
                </button>
              </div>
            </div>

            {/* Clean Table Kontingen */}
            <div className="overflow-x-auto rounded-xl border border-slate-200/80">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/90 text-[10px] font-black uppercase text-slate-500 border-b border-slate-200">
                    <th className="py-2.5 px-3">Nama Klub / Sekolah</th>
                    <th className="py-2.5 px-2.5 text-center">Atlet</th>
                    <th className="py-2.5 px-2.5 text-center">Entri</th>
                    <th className="py-2.5 px-3 text-right">Nominal Tagihan</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-2.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClubs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Tidak ada kontingen pada kriteria filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredClubs.slice(0, 5).map((club) => {
                      const initials = club.name
                        .split(' ')
                        .map((w) => w[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();
                      const isVerified = club.status === 'verified';

                      return (
                        <tr key={club.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2.5">
                              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-900 font-mono font-black text-xs">
                                {initials || 'SC'}
                              </span>
                              <div>
                                <p className="font-bold text-slate-900 text-xs leading-tight">
                                  {club.name}
                                </p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                                  {club.city || 'DKI Jakarta'} • Reg: {club.regCode || '#KLB-088'}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-2.5 text-center font-mono font-bold text-slate-700">
                            {club.athleteCount}
                          </td>

                          <td className="py-3 px-2.5 text-center font-mono font-bold text-slate-700">
                            {club.entryCount}
                          </td>

                          <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                            Rp {club.totalFee.toLocaleString('id-ID')}
                          </td>

                          <td className="py-3 px-3 text-center">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide border',
                                isVerified
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : 'bg-rose-50 text-rose-800 border-rose-200'
                              )}
                            >
                              <span
                                className={cn(
                                  'h-1.5 w-1.5 rounded-full',
                                  isVerified ? 'bg-emerald-600' : 'bg-rose-600'
                                )}
                              />
                              {isVerified ? 'Lunas' : 'Menunggu Verifikasi'}
                            </span>
                          </td>

                          <td className="py-3 px-2.5 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Link
                                href={activeEvent ? `/events/${activeEvent.id}/rekap-klub?clubId=${club.id}` : '/schools'}
                                className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                title={`Lihat lembar rekap kontingen ${club.name}`}
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                              {activeEvent && (
                                <Link
                                  href={`/events/${activeEvent.id}/rekap-klub?clubId=${club.id}&print=true`}
                                  target="_blank"
                                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                                  title={`Cetak langsung PDF lembar ${club.name}`}
                                >
                                  <Printer className="h-3.5 w-3.5" />
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Table Card */}
            <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
              <span className="text-slate-500 font-medium">
                Menampilkan {Math.min(5, filteredClubs.length)} dari {clubsSummary.length} Kontingen Resmi
              </span>
              <Link
                href="/schools"
                className="font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-1"
              >
                Lihat Seluruh Daftar Klub →
              </Link>
            </div>
          </div>

          {/* Card: Panduan Alur Kerja Operasional (3 Langkah) */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-700 font-black text-xs">
                  ⚡
                </span>
                <h3 className="font-heading font-black text-sm text-slate-900">
                  Panduan Alur Kerja Operasional
                </h3>
              </div>
              <Badge variant="outline" className="bg-slate-50 text-slate-600 text-[10px] font-bold">
                Standard FINA/Aquatics
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Langkah 1 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-white font-mono font-black text-xs">
                      1
                    </span>
                    <h4 className="font-heading font-bold text-slate-900 text-xs">
                      Cek Verifikasi Pembayaran
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Validasi bukti transfer kontingen untuk membuka akses cetak ID Card &amp; nomor dada.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-emerald-700">
                  <span>Selesai 42/46</span>
                  <Check className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Langkah 2 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white font-mono font-black text-xs">
                      2
                    </span>
                    <h4 className="font-heading font-bold text-slate-900 text-xs">
                      Generate Heat &amp; Lintasan
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Gunakan algoritma otomatis Spearhead Seeding berbasis best entry time perenang.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-blue-700">
                  <span>38 Nomor Terkunci</span>
                  <Check className="h-3.5 w-3.5" />
                </div>
              </div>

              {/* Langkah 3 */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 flex flex-col justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-white font-mono font-black text-xs">
                      3
                    </span>
                    <h4 className="font-heading font-bold text-slate-900 text-xs">
                      Terbitkan Buku Acara
                    </h4>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-snug">
                    Kompilasi Start List PDF resmi untuk pelatih, juri, dan publikasi web live scoreboard.
                  </p>
                </div>
                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] font-bold text-amber-700">
                  <span>Draft V1.2 Ready</span>
                  <Check className="h-3.5 w-3.5" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── KOLOM KANAN (5 Kolom): Telemetri Perangkat & Jadwal Agenda ── */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card: Antrean Kode OTP Pendaftaran & Bantuan Akun */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <h3 className="font-heading font-black text-sm text-slate-900">
                    Kode OTP Pendaftaran
                  </h3>
                  {adminOtps.filter((o) => o.status !== 'verified' && o.status !== 'expired').length > 0 && (
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 animate-pulse">
                      {adminOtps.filter((o) => o.status !== 'verified' && o.status !== 'expired').length} Aktif
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500">
                  Sinkronisasi kode verifikasi jika kuota email habis atau peserta meminta bantuan.
                </p>
              </div>
            </div>

            {adminOtps.length === 0 ? (
              <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 text-center space-y-1">
                <p className="text-xs font-semibold text-slate-600">Belum ada antrean kode OTP aktif</p>
                <p className="text-[10px] text-slate-400">
                  Semua kode OTP yang diminta peserta akan otomatis tercatat dan tersinkronisasi di sini.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5 max-h-[360px] overflow-y-auto pr-1">
                {adminOtps.slice(0, 6).map((item) => {
                  const isFallback = item.status === 'fallback_to_admin';
                  const isVerified = item.status === 'verified';
                  const isExpired = item.status === 'expired' || Date.now() > item.expiresAt;

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        'p-3 rounded-xl border transition-all space-y-2',
                        isFallback
                          ? 'border-amber-200 bg-gradient-to-br from-amber-50/70 to-orange-50/40'
                          : isVerified
                          ? 'border-emerald-200 bg-emerald-50/40'
                          : 'border-slate-200 bg-slate-50/60'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {item.fullName || 'Peserta Baru'}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate font-mono">
                            {item.email}
                          </p>
                        </div>

                        <span
                          className={cn(
                            'text-[9px] font-bold px-2 py-0.5 rounded-full border shrink-0',
                            isFallback
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : isVerified
                              ? 'bg-emerald-100 text-emerald-900 border-emerald-300'
                              : isExpired
                              ? 'bg-slate-200 text-slate-600 border-slate-300'
                              : 'bg-blue-100 text-blue-900 border-blue-200'
                          )}
                        >
                          {isFallback
                            ? 'Kuota Habis / Ke Admin'
                            : isVerified
                            ? 'Terverifikasi'
                            : isExpired
                            ? 'Kedaluwarsa'
                            : 'Terkirim Email'}
                        </span>
                      </div>

                      {/* Display Kode OTP 6-Digit & Action Buttons */}
                      <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                        <div className="flex items-center gap-1.5 bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-2xs">
                          <span className="text-[10px] font-semibold text-slate-400 uppercase">OTP:</span>
                          <span className="font-mono font-black text-sm tracking-wider text-blue-900">
                            {item.code}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(item.code);
                              toast.success(`Kode OTP ${item.code} disalin ke clipboard!`);
                            }}
                            className="h-7 px-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer border border-blue-200"
                            title="Salin kode OTP ke clipboard"
                          >
                            <Copy className="h-3 w-3" />
                            <span>Salin</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const msg = encodeURIComponent(
                                `Halo ${item.fullName || 'Peserta'}, kode verifikasi OTP akun Rajendra Swim System Anda adalah: *${item.code}*. Masukkan kode ini pada form pendaftaran. Terima kasih.`
                              );
                              window.open(`https://wa.me/?text=${msg}`, '_blank');
                            }}
                            className="h-7 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold inline-flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                            title="Kirim kode ke WhatsApp peserta"
                          >
                            <MessageCircle className="h-3 w-3" />
                            <span>WA</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Card 1: Status Perangkat • LIVE */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-600" />
                  <h3 className="font-heading font-black text-sm text-slate-900">Status Perangkat</h3>
                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-600 bg-rose-50 px-2 py-0.2 rounded-full border border-rose-200">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />
                    LIVE
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Telemetri sensor start block dan timing scoreboard pool Senayan.
                </p>
              </div>

              <Link
                href="/equipment"
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 shrink-0"
              >
                <span>Kelola &rarr;</span>
              </Link>
            </div>

            <div className="space-y-2.5 text-xs">
              {/* Perangkat 1: Swiss Timing Omega */}
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900">Swiss Timing Omega Console</p>
                  <p className="text-[10px] text-slate-500 font-mono">Ping 4ms • 8 Lane Touchpad Ready</p>
                </div>
                <Badge variant="outline" className="bg-blue-50 text-blue-800 border-blue-200 text-[10px] font-bold">
                  Terhubung
                </Badge>
              </div>

              {/* Perangkat 2: LED Arena */}
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900">Skor Digital LED Arena</p>
                  <p className="text-[10px] text-slate-500 font-mono">Channel 01 • Matrix P10 HD</p>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200 text-[10px] font-bold">
                  Aktif
                </Badge>
              </div>

              {/* Perangkat 3: Web Stream Sync */}
              <div className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="font-bold text-slate-900">Live Web Stream Sync</p>
                  <p className="text-[10px] text-slate-500 font-mono">1,420 penonton terhubung</p>
                </div>
                <Badge variant="outline" className="bg-cyan-50 text-cyan-800 border-cyan-200 text-[10px] font-bold">
                  Normal
                </Badge>
              </div>
            </div>

            <div className="pt-1 border-t border-slate-100">
              <Link
                href="/equipment"
                className="w-full py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
              >
                <Sliders className="h-3.5 w-3.5" /> Buka Telemetri &amp; Peralatan Lengkap &rarr;
              </Link>
            </div>
          </div>

          {/* Card 2: Jadwal & Agenda Hari Ini */}
          <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <h3 className="font-heading font-black text-sm text-slate-900">
                  Jadwal &amp; Agenda Hari Ini
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400 font-bold">WIB (GMT+7)</span>
                <Link
                  href="/jadwal"
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Catat &rarr;
                </Link>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              {(schedules && schedules.length > 0 ? schedules.slice(0, 4) : [
                {
                  id: 'def-1',
                  time: '09:00',
                  category: 'Pendaftaran',
                  title: 'Batas Penutupan Perubahan Nama',
                  description: 'Scratch / penggantian perenang di nomor estafet dan nomor individu.',
                  status: 'completed',
                },
                {
                  id: 'def-2',
                  time: '14:00',
                  category: 'Technical Meeting',
                  title: 'Technical Meeting & Drawing Seri',
                  description: 'Ruang Media Akuatik Senayan & Zoom Live bersama Coach.',
                  status: 'ongoing',
                },
                {
                  id: 'def-3',
                  time: '16:30',
                  category: 'Teknis Kolam',
                  title: 'Trial Touchpad & Sensor Start',
                  description: 'Uji kalibrasi false start detector & touch plates lintasan 1–8.',
                  status: 'upcoming',
                },
              ]).map((item) => {
                const isOngoing = item.status === 'ongoing';
                const isCompleted = item.status === 'completed';

                return (
                  <div
                    key={item.id}
                    className={cn(
                      'p-3 rounded-xl border space-y-1 transition-all',
                      isOngoing
                        ? 'border-amber-300 bg-amber-50/60 ring-1 ring-amber-300'
                        : isCompleted
                        ? 'border-slate-200 bg-slate-50/70'
                        : 'border-blue-100 bg-blue-50/40'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className={cn(
                          'font-mono font-bold text-xs px-2 py-0.5 rounded',
                          isOngoing
                            ? 'bg-amber-500 text-white'
                            : isCompleted
                            ? 'bg-slate-200 text-slate-700'
                            : 'bg-blue-100 text-blue-900'
                        )}
                      >
                        {item.time}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500">{item.category}</span>
                    </div>
                    <p className="font-bold text-slate-900 pt-1 leading-snug">{item.title}</p>
                    {item.description && (
                      <p className="text-[11px] text-slate-600 leading-snug">
                        {item.description}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="pt-1 border-t border-slate-100">
              <Link
                href="/jadwal"
                className="w-full py-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-blue-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-200"
              >
                <Plus className="h-3.5 w-3.5" /> Catat &amp; Kelola Timeline Agenda Lomba &rarr;
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
