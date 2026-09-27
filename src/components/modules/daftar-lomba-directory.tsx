'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  CalendarDays,
  MapPin,
  Waves,
  ArrowRight,
  Trophy,
  Users,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  BookOpen,
  CreditCard,
  Building,
  Timer,
  ChevronRight,
  ShieldCheck,
  Tag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';

export interface ChampionshipEventItem {
  id: string;
  name: string;
  organizer?: string | null;
  location?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  lane_count?: number | null;
  pool_type?: string | null;
  pool_length_meters?: number | null;
  fee_per_event?: number | null;
  max_participants?: number | null;
  logo_url?: string | null;
  bank_name?: string | null;
  status_override?: 'auto' | 'open' | 'live' | 'finished' | null;
  compEventCount: number;
  registrationCount: number;
}

interface DaftarLombaDirectoryProps {
  events: ChampionshipEventItem[];
}

export function DaftarLombaDirectory({ events }: DaftarLombaDirectoryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [poolFilter, setPoolFilter] = useState<'all' | '50m' | '25m'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'live' | 'finished'>('all');

  // Total Nomor Lomba di Seluruh Kejuaraan
  const totalCompEventsCount = useMemo(() => {
    return events.reduce((acc, curr) => acc + curr.compEventCount, 0);
  }, [events]);

  const totalRegistrationsCount = useMemo(() => {
    return events.reduce((acc, curr) => acc + curr.registrationCount, 0);
  }, [events]);

  // Status Komputasi per Event
  const getEventStatusInfo = (ev: ChampionshipEventItem) => {
    // 1. Otoritas Admin Status Override
    if (ev.status_override && ev.status_override !== 'auto') {
      if (ev.status_override === 'finished') {
        return {
          key: 'finished',
          label: 'SELESAI / DITUTUP',
          badgeCls: 'bg-slate-100 text-slate-700 border-slate-300 font-semibold',
          isLive: false,
          isFinished: true,
        };
      }
      if (ev.status_override === 'open') {
        return {
          key: 'open',
          label: 'PENDAFTARAN DIBUKA',
          badgeCls: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
          isLive: false,
          isFinished: false,
        };
      }
      if (ev.status_override === 'live') {
        return {
          key: 'live',
          label: 'LIVE BERLANGSUNG',
          badgeCls: 'bg-rose-100 text-rose-800 border-rose-300 font-black animate-pulse',
          isLive: true,
          isFinished: false,
        };
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (ev.start_date && ev.end_date) {
      const start = new Date(ev.start_date);
      const end = new Date(ev.end_date);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      if (today >= start && today <= end) {
        return {
          key: 'live',
          label: 'LIVE BERLANGSUNG',
          badgeCls: 'bg-rose-100 text-rose-800 border-rose-300 font-black animate-pulse',
          isLive: true,
          isFinished: false,
        };
      }

      if (today < start) {
        const diffDays = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        return {
          key: 'open',
          label: 'PENDAFTARAN DIBUKA',
          badgeCls: 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold',
          diffDays,
          isLive: false,
          isFinished: false,
        };
      }
    }

    return {
      key: 'open',
      label: 'PENDAFTARAN DIBUKA',
      badgeCls: 'bg-blue-100 text-blue-900 border-blue-300 font-bold',
      isLive: false,
      isFinished: false,
    };
  };

  // Kategori Heuristik Nama Event
  const getEventCategoryTag = (ev: ChampionshipEventItem) => {
    const name = ev.name.toLowerCase();
    if (name.includes('kejurnas') || name.includes('nasional') || name.includes('indonesia')) {
      return 'NASIONAL SERI I';
    }
    if (name.includes('popda') || name.includes('pelajar') || name.includes('sekolah')) {
      return 'TINGKAT PELAJAR & KU';
    }
    if (name.includes('kejurda') || name.includes('provinsi') || name.includes('gubernur') || name.includes('banten') || name.includes('dki')) {
      return 'KEJURDA PROVINSI';
    }
    return 'KEJUARAAN RESMI';
  };

  // Quota & Progress Calculation
  const getEventQuota = (ev: ChampionshipEventItem) => {
    const max = ev.max_participants || (ev.compEventCount > 40 ? 1000 : 800);
    const filled = ev.registrationCount;
    const percentage = Math.min(100, Math.round((filled / max) * 100));
    return { max, filled, percentage };
  };

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      // 1. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = ev.name.toLowerCase().includes(q);
        const matchLocation = (ev.location || '').toLowerCase().includes(q);
        const matchOrganizer = (ev.organizer || '').toLowerCase().includes(q);
        if (!matchName && !matchLocation && !matchOrganizer) {
          return false;
        }
      }

      // 2. Pool Length Filter
      const poolLen = ev.pool_length_meters || 50;
      if (poolFilter === '50m' && poolLen < 50) return false;
      if (poolFilter === '25m' && poolLen >= 50) return false;

      // 3. Status Filter
      const st = getEventStatusInfo(ev);
      if (statusFilter === 'open' && (st.isFinished || st.key === 'finished')) return false;
      if (statusFilter === 'live' && st.key !== 'live') return false;
      if (statusFilter === 'finished' && !st.isFinished && st.key !== 'finished') return false;

      return true;
    });
  }, [events, searchQuery, poolFilter, statusFilter]);

  return (
    <div className="space-y-6">
      {/* ── 1. HEADER SECTION & CONTEXTUAL OVERVIEW ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200/80 pb-5">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)] border border-[var(--m-aqua)]/20 shadow-2xs">
              <Sparkles className="h-3 w-3 text-[var(--m-aqua)]" />
              PORTAL PENDAFTARAN RESMI • TAHUN 2026
            </span>
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[var(--m-ink)]">
            Daftar Kejuaraan &amp; Nomor Lomba
          </h1>

          <p className="max-w-3xl text-xs sm:text-sm text-[var(--m-muted)] leading-relaxed">
            Pilih event kejuaraan renang resmi di bawah ini untuk mendaftarkan atlet binaan Anda ke nomor-nomor perlombaan yang sesuai dengan batasan Kelompok Usia (KU).
          </p>
        </div>

        {/* Quick Link Shortcut Button */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <Link href="/atlet-saya">
            <Button
              variant="outline"
              className="h-9 gap-1.5 text-xs font-bold border-slate-200 bg-white hover:bg-slate-50 text-slate-800 shadow-2xs rounded-xl"
            >
              <Users className="h-3.5 w-3.5 text-blue-600" /> Cek Data Atlet Binaan
            </Button>
          </Link>

          <Link href="/scoreboard" target="_blank">
            <Button className="h-9 gap-1.5 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-sm rounded-xl">
              <Timer className="h-3.5 w-3.5" /> Buka Live Scoreboard
            </Button>
          </Link>
        </div>
      </div>

      {/* ── 2. 4 TOP HIGHLIGHT METRIC TILES (AQUATIC GLASS) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Kejuaraan Dibuka</p>
              <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                {events.length} <span className="text-xs font-semibold text-slate-500">Event</span>
              </p>
            </div>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Waves className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Nomor Perlombaan</p>
              <p className="text-2xl font-black text-indigo-950 font-mono mt-0.5">
                {totalCompEventsCount} <span className="text-xs font-semibold text-slate-500">Nomor</span>
              </p>
            </div>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Standar Regulasi</p>
              <p className="text-xs font-black text-emerald-800 mt-1 uppercase">
                World Aquatics SW 3.1
              </p>
            </div>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-50 text-cyan-600">
              <CreditCard className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Sistem Pembayaran</p>
              <p className="text-xs font-black text-cyan-900 mt-1 uppercase">
                Kode Unik Otomatis
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. PANDUAN RINGKAS ALUR PENDAFTARAN (3 LANGKAH) ── */}
      <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50/70 via-white to-cyan-50/50 p-4.5 shadow-xs space-y-3">
        <div className="flex items-center gap-2 border-b border-slate-200/60 pb-2">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-blue-600 text-white font-black text-[10px]">
            i
          </span>
          <h3 className="font-heading font-black text-xs sm:text-sm text-slate-900">
            Panduan 3 Langkah Pendaftaran Nomor Lomba
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-white font-mono font-bold text-xs">
              1
            </span>
            <div>
              <p className="font-bold text-slate-900">Pilih Event Kejuaraan</p>
              <p className="text-[11px] text-slate-500 leading-snug">
                Pilih kejuaraan aktif di bawah ini sesuai jadwal dan lokasi yang Anda inginkan.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-white font-mono font-bold text-xs">
              2
            </span>
            <div>
              <p className="font-bold text-slate-900">Pilih Atlet &amp; Nomor Gaya</p>
              <p className="text-[11px] text-slate-500 leading-snug">
                Centang nomor lomba yang ingin diikuti per atlet (sistem filter KU otomatis).
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-white font-mono font-bold text-xs">
              3
            </span>
            <div>
              <p className="font-bold text-slate-900">Transfer &amp; Cetak ID Pass</p>
              <p className="text-[11px] text-slate-500 leading-snug">
                Selesaikan pembayaran dengan kode unik, pantau invoice, dan unduh ID Pass resmi.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. SEARCH & FILTER TOOLBAR ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-4.5 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari kejuaraan, kota venue, atau penyelenggara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10 rounded-xl bg-slate-50/70 border-slate-200 text-xs font-medium focus-visible:ring-2 focus-visible:ring-blue-500/20"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Kolam */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPoolFilter('all')}
                className={cn(
                  'px-3 py-1 rounded-lg transition-all cursor-pointer',
                  poolFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-950'
                )}
              >
                Semua Kolam
              </button>
              <button
                type="button"
                onClick={() => setPoolFilter('50m')}
                className={cn(
                  'px-3 py-1 rounded-lg transition-all cursor-pointer',
                  poolFilter === '50m'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-950'
                )}
              >
                Kolam 50m (Olympic)
              </button>
              <button
                type="button"
                onClick={() => setPoolFilter('25m')}
                className={cn(
                  'px-3 py-1 rounded-lg transition-all cursor-pointer',
                  poolFilter === '25m'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-950'
                )}
              >
                Kolam 25m (Short)
              </button>
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/60 text-xs font-bold">
              <button
                type="button"
                onClick={() => setStatusFilter('all')}
                className={cn(
                  'px-3 py-1 rounded-lg transition-all cursor-pointer',
                  statusFilter === 'all'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-950'
                )}
              >
                Semua Status
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('open')}
                className={cn(
                  'px-3 py-1 rounded-lg transition-all cursor-pointer',
                  statusFilter === 'open'
                    ? 'bg-emerald-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-950'
                )}
              >
                Dibuka
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('live')}
                className={cn(
                  'px-3 py-1 rounded-lg transition-all cursor-pointer',
                  statusFilter === 'live'
                    ? 'bg-rose-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-950'
                )}
              >
                Live Berlangsung
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('finished')}
                className={cn(
                  'px-3 py-1 rounded-lg transition-all cursor-pointer',
                  statusFilter === 'finished'
                    ? 'bg-slate-700 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-950'
                )}
              >
                Selesai / Ditutup
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 5. GRID KARTU KEJUARAAN HIGH-END (AQUATIC GLASS & INFORMATIF) ── */}
      {filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <EmptyState
            icon={<Waves className="h-10 w-10 text-primary" />}
            title="Tidak Ada Kejuaraan yang Cocok"
            description="Tidak ditemukan kejuaraan yang sesuai dengan filter atau kata kunci pencarian Anda."
            action={
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setPoolFilter('all');
                  setStatusFilter('all');
                }}
                className="text-xs font-bold mt-2"
              >
                Reset Semua Filter
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map((ev) => {
            const st = getEventStatusInfo(ev);
            const quota = getEventQuota(ev);
            const categoryTag = getEventCategoryTag(ev);
            const feeText = ev.fee_per_event
              ? `Rp ${ev.fee_per_event.toLocaleString('id-ID')}`
              : 'Rp 50.000';

            return (
              <div
                key={ev.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
              >
                {/* ── KOP BANNER ATAS (AQUATIC GRADIENT + WATERMARK GELOMBANG) ── */}
                <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-[#0f2b5c] via-[#0284c7] to-[#0369a1] p-5 text-white flex flex-col justify-between">
                  {/* Decorative Waves Overlay */}
                  <div className="pointer-events-none absolute inset-0 opacity-15">
                    <svg viewBox="0 0 400 200" className="h-full w-full object-cover">
                      <path d="M0,80 C150,140 250,20 400,80 L400,200 L0,200 Z" fill="white" />
                    </svg>
                  </div>
                  <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-cyan-400/20 blur-2xl" />

                  {/* Top Badges Row */}
                  <div className="relative z-10 flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase bg-white/20 text-white backdrop-blur-md border border-white/25">
                      <Tag className="h-3 w-3 text-cyan-300" />
                      {categoryTag}
                    </span>

                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] uppercase shadow-2xs border backdrop-blur-md',
                        st.badgeCls
                      )}
                    >
                      {st.isLive ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-ping" />
                      ) : (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      )}
                      {st.label}
                    </span>
                  </div>

                  {/* Center Logo & Title Highlight */}
                  <div className="relative z-10 space-y-1">
                    <div className="flex items-center gap-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={ev.logo_url || '/brand/logo.png'}
                        alt={ev.name}
                        className="h-8 w-auto object-contain bg-white/20 rounded-md p-1 backdrop-blur-xs"
                      />
                      <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-200 uppercase">
                        SCMS TOURNAMENT
                      </span>
                    </div>

                    <h2 className="font-heading font-black text-lg sm:text-xl text-white uppercase tracking-tight line-clamp-1 drop-shadow-xs">
                      {ev.name}
                    </h2>
                  </div>

                  {/* Bottom Strip: Countdown / Deadline */}
                  <div className="relative z-10 flex items-center justify-between text-[11px] text-cyan-100 border-t border-white/20 pt-1.5">
                    <span className="font-mono font-bold text-white">
                      {ev.compEventCount} Nomor Lomba Tersedia
                    </span>
                    {st.diffDays !== undefined && st.diffDays > 0 ? (
                      <span className="text-amber-200 font-bold">
                        {st.diffDays} Hari Menuju Lomba
                      </span>
                    ) : (
                      <span className="text-emerald-200 font-bold">Resmi Terbuka</span>
                    )}
                  </div>
                </div>

                {/* ── CARD BODY: RINCIAN SPESIFIKASI & KUOTA ── */}
                <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* Penyelenggara & Lokasi */}
                    <div className="space-y-1.5 text-xs text-slate-700">
                      <p className="flex items-start gap-2 font-medium">
                        <MapPin className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">
                          {ev.location || 'Gelanggang Renang Resmi Standar FINA'}
                        </span>
                      </p>

                      <p className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-blue-600 shrink-0" />
                        <span className="font-semibold text-slate-900">
                          {ev.start_date || 'Segera'} {ev.end_date && ev.end_date !== ev.start_date ? `s/d ${ev.end_date}` : ''}
                        </span>
                      </p>

                      <p className="flex items-center gap-2">
                        <Waves className="h-4 w-4 text-cyan-600 shrink-0" />
                        <span>
                          Kolam <b>{ev.pool_length_meters || 50}m</b> ({ev.pool_type || 'Olympic Course'} • <b>{ev.lane_count || 8} Lintasan</b>)
                        </span>
                      </p>
                    </div>

                    {/* Progress Bar Kuota Peserta */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-600 flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-slate-400" /> Kuota Atlet:
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-[11px]">
                          {quota.filled} / {quota.max} ({quota.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200/80">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500"
                          style={{ width: `${Math.max(5, quota.percentage)}%` }}
                        />
                      </div>
                    </div>

                    {/* Rincian Biaya & Rekening */}
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">
                          Biaya Pendaftaran
                        </span>
                        <span className="font-mono font-black text-slate-950 text-sm">
                          {feeText} <span className="font-sans text-[11px] font-normal text-slate-500">/ nomor</span>
                        </span>
                      </div>

                      <div className="text-right text-[10px] text-slate-500">
                        <span className="font-bold text-blue-900 block">Bank Transfer</span>
                        <span>{ev.bank_name || 'BCA • Kode Unik'}</span>
                      </div>
                    </div>
                  </div>

                  {/* ── CARD FOOTER ACTIONS ── */}
                  <div className="pt-3 border-t border-slate-100 space-y-2">
                    {st.isFinished ? (
                      <Link href={`/program?event=${ev.id}`} className="block">
                        <Button
                          variant="outline"
                          className="w-full h-10 gap-2 border-slate-300 bg-slate-50 text-slate-700 hover:bg-slate-100 font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
                        >
                          <BookOpen className="h-4 w-4 text-slate-500" />
                          Pendaftaran Ditutup • Buku Acara
                          <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/daftar-lomba/${ev.id}`} className="block">
                        <Button className="w-full h-10 gap-2 bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs uppercase tracking-wider shadow-sm rounded-xl transition-all cursor-pointer">
                          <CalendarDays className="h-4 w-4" />
                          Daftar Nomor Lomba Sekarang
                          <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    )}

                    <div className="flex items-center justify-between gap-2">
                      <Link
                        href={`/program?event=${ev.id}`}
                        className="text-[11px] font-semibold text-slate-600 hover:text-blue-700 flex items-center gap-1"
                      >
                        <BookOpen className="h-3 w-3 text-slate-400" /> Buku Acara
                      </Link>

                      <Link
                        href={`/scoreboard`}
                        target="_blank"
                        className="text-[11px] font-semibold text-cyan-700 hover:text-cyan-900 flex items-center gap-1"
                      >
                        <Timer className="h-3 w-3 text-cyan-600" /> Live Arena <ExternalLink className="h-2.5 w-2.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
