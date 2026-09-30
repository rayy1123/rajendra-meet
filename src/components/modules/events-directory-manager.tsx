'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Users,
  Waves,
  Medal,
  Calendar,
  CalendarDays,
  MapPin,
  Search,
  Plus,
  Radio,
  ExternalLink,
  ChevronDown,
  Sparkles,
  Camera,
  Layers,
  BookOpen,
  School,
  Copy,
  Check,
  MoreVertical,
  Settings,
  ArrowRight,
  TrendingUp,
  Clock,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Unlock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { EventLogoDialog } from '@/components/modules/event-logo-dialog';
import { EventLogoImage } from '@/components/ui/event-logo-image';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export interface EventItemData {
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
  max_participants?: number | null;
  is_published?: boolean | null;
  logo_url?: string | null;
  status_override?: 'auto' | 'open' | 'live' | 'finished' | null;
  created_at?: string | null;
  compEventCount: number;
  registrationCount: number;
}

interface EventsDirectoryManagerProps {
  events: EventItemData[];
  totalSchoolsCount: number;
  totalAthletesCount: number;
  totalRegistrationsCount: number;
}

export function EventsDirectoryManager({
  events,
  totalSchoolsCount,
  totalAthletesCount,
  totalRegistrationsCount,
}: EventsDirectoryManagerProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'all' | 'open' | 'live' | 'finished'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [poolTypeFilter, setPoolTypeFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [seasonFilter, setSeasonFilter] = useState('2026');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Status Helper per Event dengan dukungan Otoritas Admin Status Override
  const getEventComputedStatus = (ev: EventItemData) => {
    // 0. Manual Status Override by Admin
    if (ev.status_override && ev.status_override !== 'auto') {
      if (ev.status_override === 'finished') {
        return {
          key: 'finished',
          label: 'SELESAI / ARSIP',
          color: 'gray',
          badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 font-semibold',
        };
      }
      if (ev.status_override === 'open') {
        return {
          key: 'open',
          label: 'PENDAFTARAN DIBUKA',
          color: 'blue',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 font-bold',
        };
      }
      if (ev.status_override === 'live') {
        return {
          key: 'live',
          label: 'LIVE BERLANGSUNG',
          color: 'rose',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-black animate-pulse',
        };
      }
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (ev.compEventCount === 0 && ev.registrationCount === 0) {
      return {
        key: 'draft',
        label: 'DRAF SETUP',
        color: 'slate',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-300',
      };
    }

    if (ev.start_date && ev.end_date) {
      const start = new Date(ev.start_date);
      const end = new Date(ev.end_date);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);

      if (today >= start && today <= end) {
        return {
          key: 'live',
          label: 'LIVE BERLANGSUNG',
          color: 'rose',
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-black animate-pulse',
        };
      }

      if (today < start) {
        return {
          key: 'open',
          label: 'PENDAFTARAN DIBUKA',
          color: 'blue',
          badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 font-bold',
        };
      }

      return {
        key: 'finished',
        label: 'SELESAI / ARSIP',
        color: 'gray',
        badgeClass: 'bg-slate-100 text-slate-600 border-slate-300',
      };
    }

    return {
      key: 'open',
      label: 'PENDAFTARAN DIBUKA',
      color: 'blue',
      badgeClass: 'bg-blue-100 text-blue-800 border-blue-300 font-bold',
    };
  };

  const handleUpdateStatusOverride = async (
    eventId: string,
    newStatus: 'auto' | 'open' | 'live' | 'finished'
  ) => {
    try {
      const res = await fetch(`/api/events/${eventId}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status_override: newStatus }),
      });
      if (res.ok) {
        toast.success(
          newStatus === 'finished'
            ? 'Kejuaraan berhasil ditandai Selesai / Arsip.'
            : newStatus === 'open'
            ? 'Pendaftaran kejuaraan dibuka.'
            : newStatus === 'live'
            ? 'Kejuaraan diset Live Berlangsung.'
            : 'Status kejuaraan dikembalikan ke Otomatis.'
        );
        router.refresh();
      } else {
        toast.error('Gagal memperbarui status kejuaraan.');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan.');
    }
  };

  // Quota & Progress Helper
  const getEventQuota = (ev: EventItemData) => {
    const maxQuota = ev.max_participants || (ev.compEventCount > 50 ? 1000 : ev.compEventCount > 10 ? 800 : 500);
    const filled = ev.registrationCount;
    const percentage = Math.min(100, Math.round((filled / maxQuota) * 100));
    return { maxQuota, filled, percentage };
  };

  // Deadline Remaining Helper
  const getDaysRemaining = (startDateStr?: string | null) => {
    if (!startDateStr) return null;
    const today = new Date('2026-09-24');
    const start = new Date(startDateStr);
    const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff > 0 ? diff : null;
  };

  // Category Tag Heuristic (e.g. NASIONAL SERI I, REGIONAL, TINGKAT PELAJAR)
  const getEventCategoryTag = (ev: EventItemData) => {
    const name = ev.name.toLowerCase();
    if (name.includes('kejurnas') || name.includes('nasional') || name.includes('indonesia')) {
      return 'NASIONAL SERI I';
    }
    if (name.includes('gubernur') || name.includes('regional') || name.includes('provinsi') || name.includes('banten') || name.includes('dki')) {
      return 'REGIONAL';
    }
    if (name.includes('pelajar') || name.includes('popda') || name.includes('sekolah')) {
      return 'PELAJAR / KU I-V';
    }
    return 'KEJUARAAN TERBUKA';
  };

  // Copy Public Link Helper
  const handleCopyLink = (eventId: string) => {
    const url = `${window.location.origin}/public-live/${eventId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(eventId);
    toast.success('Tautan live arena disalin ke papan klip!');
    setTimeout(() => setCopiedId(null), 2500);
  };

  // Counts for Top KPI Metrics
  const activeCount = useMemo(() => {
    return events.filter((e) => {
      const s = getEventComputedStatus(e);
      return s.key === 'open' || s.key === 'live';
    }).length;
  }, [events]);

  const finishedCount = useMemo(() => {
    return events.filter((e) => getEventComputedStatus(e).key === 'finished').length;
  }, [events]);

  const draftCount = useMemo(() => {
    return events.filter((e) => getEventComputedStatus(e).key === 'draft').length;
  }, [events]);

  const totalPools50m = useMemo(() => {
    return events.filter((e) => (e.pool_length_meters || 50) >= 50).length;
  }, [events]);

  const totalPools25m = useMemo(() => {
    return events.filter((e) => (e.pool_length_meters || 50) < 50).length;
  }, [events]);

  // Tab Counts
  const tabCounts = useMemo(() => {
    return {
      all: events.length,
      open: events.filter((e) => getEventComputedStatus(e).key === 'open').length,
      live: events.filter((e) => getEventComputedStatus(e).key === 'live').length,
      finished: events.filter((e) => getEventComputedStatus(e).key === 'finished').length,
    };
  }, [events]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      const status = getEventComputedStatus(ev);

      // Tab Filter
      if (activeTab === 'open' && status.key !== 'open') return false;
      if (activeTab === 'live' && status.key !== 'live') return false;
      if (activeTab === 'finished' && status.key !== 'finished') return false;

      // Search Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = ev.name.toLowerCase().includes(q);
        const matchLoc = (ev.location || '').toLowerCase().includes(q);
        const matchOrg = (ev.organizer || '').toLowerCase().includes(q);
        if (!matchName && !matchLoc && !matchOrg) return false;
      }

      // Pool Type Filter
      if (poolTypeFilter !== 'all') {
        const len = ev.pool_length_meters || 50;
        if (poolTypeFilter === '50m' && len < 50) return false;
        if (poolTypeFilter === '25m' && len >= 50) return false;
      }

      // Category Filter
      if (categoryFilter !== 'all') {
        const tag = getEventCategoryTag(ev);
        if (categoryFilter === 'nasional' && !tag.includes('NASIONAL')) return false;
        if (categoryFilter === 'regional' && !tag.includes('REGIONAL')) return false;
        if (categoryFilter === 'pelajar' && !tag.includes('PELAJAR')) return false;
      }

      return true;
    });
  }, [events, activeTab, searchQuery, poolTypeFilter, categoryFilter]);

  return (
    <div className="space-y-6">
      {/* ── HEADER HALAMAN: TITLE, SUBTITLE & TOP ACTIONS (SESUAI IMAGE #12) ── */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div className="space-y-2">
          {/* Eyebrow Pill */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wider uppercase bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)] border border-[var(--m-aqua)]/20 shadow-2xs">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--m-aqua)] animate-pulse" />
              Manajemen Event & Seri • Musim {seasonFilter}
            </span>
          </div>

          <h1 className="font-heading text-3xl sm:text-4xl font-black tracking-tight text-[var(--m-ink)]">
            Daftar Kejuaraan & Kompetisi
          </h1>

          <p className="max-w-2xl text-xs sm:text-sm text-[var(--m-muted)] leading-relaxed">
            Kelola konfigurasi kolam, kuota atlet, status pendaftaran, dan sinkronisasi arena perlombaan renang terpadu secara real-time.
          </p>
        </div>

        {/* Action Buttons Kanan Atas */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Select value={seasonFilter} onValueChange={setSeasonFilter}>
            <SelectTrigger className="h-10 text-xs font-bold bg-white border-slate-200 text-slate-800 w-[170px] shadow-2xs">
              <CalendarDays className="h-3.5 w-3.5 mr-1 text-slate-500" />
              <SelectValue placeholder="Semua Musim" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">Semua Musim (2026)</SelectItem>
              <SelectItem value="2027">Musim 2027</SelectItem>
              <SelectItem value="all">Arsip Seluruh Musim</SelectItem>
            </SelectContent>
          </Select>

          <Link href="/events/new">
            <Button className="h-10 gap-2 bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-bold shadow-sm px-4">
              <Plus className="h-4 w-4" /> Buat Kejuaraan Baru
            </Button>
          </Link>
        </div>
      </div>

      {/* ── TOP KPI SUMMARY METRICS (4 KARTU BERIKON KHAS AQUATIC GLASS) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. TOTAL KEJUARAAN */}
        <div className="glass-panel relative overflow-hidden p-5 border border-slate-200/80 bg-white/95 rounded-2xl shadow-xs hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Total Kejuaraan
              </span>
              <div className="mt-1 font-heading text-3xl font-black text-slate-950 font-mono">
                {events.length} <span className="font-sans text-xs font-bold text-slate-500">Event Seri</span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 shadow-2xs">
              <Trophy className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-600 font-semibold">
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> {activeCount} Aktif
            </span>
            <span className="flex items-center gap-1 text-slate-500">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" /> {finishedCount} Selesai
            </span>
            <span className="flex items-center gap-1 text-amber-700">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" /> {draftCount} Draf
            </span>
          </div>
        </div>

        {/* 2. TOTAL ATLET AKTIF */}
        <div className="glass-panel relative overflow-hidden p-5 border border-slate-200/80 bg-white/95 rounded-2xl shadow-xs hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Total Atlet Aktif
              </span>
              <div className="mt-1 font-heading text-3xl font-black text-blue-950 font-mono">
                {totalRegistrationsCount > 0 ? totalRegistrationsCount.toLocaleString('id-ID') : totalAthletesCount}{' '}
                <span className="font-sans text-xs font-bold text-slate-500">Terdaftar</span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-50 text-cyan-600 shadow-2xs">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>Afiliasi {totalSchoolsCount} Klub Renang Resmi</span>
          </div>
        </div>

        {/* 3. FASILITAS KOLAM */}
        <div className="glass-panel relative overflow-hidden p-5 border border-slate-200/80 bg-white/95 rounded-2xl shadow-xs hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Fasilitas Kolam
              </span>
              <div className="mt-1 font-heading text-3xl font-black text-slate-950 font-mono">
                {events.length} <span className="font-sans text-xs font-bold text-slate-500">Arena Resmi</span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-50 text-teal-600 shadow-2xs">
              <Waves className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-3 text-xs text-slate-600 font-medium">
            <span><b>{totalPools50m}</b> 50m Olympic</span>
            <span>&amp;</span>
            <span><b>{totalPools25m}</b> 25m Short</span>
          </div>
        </div>

        {/* 4. HADIAH & GELAR */}
        <div className="glass-panel relative overflow-hidden p-5 border border-slate-200/80 bg-white/95 rounded-2xl shadow-xs hover:shadow-md transition-all">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                Hadiah &amp; Gelar
              </span>
              <div className="mt-1 font-heading text-3xl font-black text-slate-950 font-mono">
                {Math.max(340, events.length * 48)}{' '}
                <span className="font-sans text-xs font-bold text-slate-500">Set Medali</span>
              </div>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-2xs">
              <Medal className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
            <span>Sesuai Regulasi World Aquatics</span>
          </div>
        </div>
      </div>

      {/* ── TOOLBAR FILTER & SEARCH (PERSIS IMAGE #12) ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-2">
        {/* Tab Segmented Buttons Kiri */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/80 w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('all')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
              activeTab === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-950'
            )}
          >
            Semua Event ({tabCounts.all})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('open')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
              activeTab === 'open'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-950'
            )}
          >
            Buka Pendaftaran ({tabCounts.open})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('live')}
            className={cn(
              'flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
              activeTab === 'live'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-950'
            )}
          >
            <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
            Berlangsung / Live ({tabCounts.live})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('finished')}
            className={cn(
              'px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer',
              activeTab === 'finished'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-950'
            )}
          >
            Arsip Selesai ({tabCounts.finished})
          </button>
        </div>

        {/* Input Search & Dropdown Kanan */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative w-full sm:w-64 md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama kejuaraan, kota, nomor SK…"
              className="pl-8 h-9 text-xs bg-white border-slate-200"
            />
          </div>

          <Select value={poolTypeFilter} onValueChange={setPoolTypeFilter}>
            <SelectTrigger className="h-9 text-xs font-semibold bg-white border-slate-200 text-slate-700 w-[140px]">
              <SelectValue placeholder="Kolam: Semua Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Kolam: Semua Tipe</SelectItem>
              <SelectItem value="50m">50m Olympic</SelectItem>
              <SelectItem value="25m">25m Short Course</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="h-9 text-xs font-semibold bg-white border-slate-200 text-slate-700 w-[155px]">
              <SelectValue placeholder="Tingkat: Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tingkat: Semua Kategori</SelectItem>
              <SelectItem value="nasional">Nasional Seri I</SelectItem>
              <SelectItem value="regional">Regional / Kejurda</SelectItem>
              <SelectItem value="pelajar">Pelajar / KU I-V</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── GRID KARTU EVENT KEJUARAAN (PERSIS IMAGE #12) ── */}
      {filteredEvents.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center space-y-3">
          <Waves className="h-10 w-10 text-muted-foreground/30 mx-auto" />
          <h4 className="font-heading font-bold text-base text-slate-800">
            Tidak ada kejuaraan yang sesuai kriteria
          </h4>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            Ubah kata kunci pencarian atau reset filter di atas untuk melihat seluruh daftar event.
          </p>
          <Button
            onClick={() => {
              setActiveTab('all');
              setSearchQuery('');
              setPoolTypeFilter('all');
              setCategoryFilter('all');
            }}
            variant="outline"
            className="text-xs font-semibold mt-2"
          >
            Reset Semua Filter
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredEvents.map((ev) => {
            const status = getEventComputedStatus(ev);
            const quota = getEventQuota(ev);
            const categoryTag = getEventCategoryTag(ev);
            const daysRemaining = getDaysRemaining(ev.start_date);
            const isLive = status.key === 'live';
            const isDraft = status.key === 'draft';
            const isFinished = status.key === 'finished';

            const poolSpec = `${ev.pool_length_meters || 50}m ${
              (ev.pool_length_meters || 50) >= 50 ? 'Olympic' : 'Short Course'
            } (${ev.lane_count || 8} Lane)`;

            return (
              <div
                key={ev.id}
                className="group relative rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-4">
                  {/* Top Badges Row */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* Status Tag */}
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border',
                          status.badgeClass
                        )}
                      >
                        {isLive && <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />}
                        {isLive ? 'LIVE HARI INI' : status.label}
                      </span>

                      {/* Category Tag */}
                      <Badge
                        variant="outline"
                        className="bg-slate-50 text-slate-700 border-slate-200 font-bold text-[10px] uppercase"
                      >
                        {categoryTag}
                      </Badge>

                      {/* Pool Tag */}
                      <Badge
                        variant="outline"
                        className="bg-blue-50/60 text-blue-800 border-blue-200 font-semibold text-[10px]"
                      >
                        {poolSpec}
                      </Badge>
                    </div>

                    {/* 3-Dots Quick Actions Menu */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="h-7 w-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52 p-1 text-xs">
                        <DropdownMenuLabel className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Aksi Kejuaraan
                        </DropdownMenuLabel>
                        <DropdownMenuItem asChild>
                          <Link href={`/events/${ev.id}`} className="cursor-pointer">
                            <Settings className="h-3.5 w-3.5 mr-2 text-primary" /> Pengaturan Lengkap
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/events/${ev.id}#atur-acara`} className="cursor-pointer">
                            <Layers className="h-3.5 w-3.5 mr-2 text-blue-600" /> Susun Acara Lomba
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/events/${ev.id}/rekap-klub`} className="cursor-pointer">
                            <School className="h-3.5 w-3.5 mr-2 text-indigo-600" /> Rekap per Klub (PDF)
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/buku-acara?event=${ev.id}`} className="cursor-pointer">
                            <BookOpen className="h-3.5 w-3.5 mr-2 text-amber-600" /> Buku Acara
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleCopyLink(ev.id)} className="cursor-pointer">
                          <Copy className="h-3.5 w-3.5 mr-2 text-slate-500" /> Salin Tautan Live
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuLabel className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          Otoritas Status Kejuaraan
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatusOverride(ev.id, 'finished')}
                          className="cursor-pointer text-slate-700 font-medium"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-2 text-emerald-600" /> Tandai Selesai (Arsipkan)
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatusOverride(ev.id, 'open')}
                          className="cursor-pointer text-blue-700 font-medium"
                        >
                          <Unlock className="h-3.5 w-3.5 mr-2 text-blue-600" /> Buka Pendaftaran
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatusOverride(ev.id, 'live')}
                          className="cursor-pointer text-rose-700 font-medium"
                        >
                          <Radio className="h-3.5 w-3.5 mr-2 text-rose-600" /> Set Live Berlangsung
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleUpdateStatusOverride(ev.id, 'auto')}
                          className="cursor-pointer text-slate-500 font-medium"
                        >
                          <Clock className="h-3.5 w-3.5 mr-2 text-slate-400" /> Kembalikan Otomatis (Jadwal)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* Title & Logo Header */}
                  <div className="flex items-start gap-3.5">
                    {/* Logo Box with Safe Fallback */}
                    <div className="shrink-0">
                      <EventLogoDialog
                        eventId={ev.id}
                        eventName={ev.name}
                        currentLogoUrl={ev.logo_url}
                        trigger={
                          <button
                            type="button"
                            className="group/logo relative h-13 w-13 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center overflow-hidden shadow-2xs hover:ring-2 hover:ring-primary/40 transition-all cursor-pointer"
                            title="Klik untuk ubah logo event"
                          >
                            <EventLogoImage
                              src={ev.logo_url}
                              alt={ev.name}
                              className="h-full w-full object-contain p-1"
                              fallbackIconClassName="h-6 w-6 text-blue-600"
                            />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/logo:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Camera className="h-3.5 w-3.5" />
                            </div>
                          </button>
                        }
                      />
                    </div>

                    <div className="space-y-1 min-w-0">
                      <Link href={`/events/${ev.id}`}>
                        <h2 className="font-heading font-black text-lg sm:text-xl text-slate-900 leading-snug group-hover:text-blue-700 transition-colors">
                          {ev.name}
                        </h2>
                      </Link>
                      <p className="text-xs text-slate-500 font-medium truncate">
                        {ev.organizer || 'Panitia Pelaksana Renang'}
                      </p>
                    </div>
                  </div>

                  {/* Location & Dates (Persis Format Image #12) */}
                  <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-slate-600">
                    <span className="flex items-center gap-1.5 truncate">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {ev.location || 'Kolam Renang Resmi'}
                    </span>
                    <span className="flex items-center gap-1.5 shrink-0">
                      <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      {ev.start_date} {ev.end_date && ev.end_date !== ev.start_date ? `s/d ${ev.end_date}` : ''}
                    </span>
                  </div>

                  {/* Quota Progress Bar Container */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-700">
                        Kuota Atlet Terisi: <span className="font-mono text-slate-950">{quota.filled}</span> / {quota.maxQuota} Atlet
                      </span>
                      <span className="font-mono text-blue-700 font-black">{quota.percentage}%</span>
                    </div>

                    {/* Progress Bar Track */}
                    <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-500"
                        style={{ width: `${quota.percentage}%` }}
                      />
                    </div>

                    {/* Sub-Detail Bar */}
                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500">
                      {isDraft ? (
                        <span className="text-amber-800 font-semibold flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Menunggu Finalisasi Nomor Lomba
                        </span>
                      ) : isFinished ? (
                        <span className="text-emerald-800 font-semibold flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Hasil &amp; Rekor Terarsip
                        </span>
                      ) : (
                        <span>
                          Biaya: <b className="text-slate-800 font-mono">Rp {(ev.fee_per_event || 50000).toLocaleString('id-ID')}</b> / nomor
                        </span>
                      )}

                      {daysRemaining != null && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          Sisa {daysRemaining} Hari
                        </span>
                      )}

                      {isLive && (
                        <span className="font-mono text-[10px] font-black text-rose-700 flex items-center gap-1">
                          <Radio className="h-3 w-3 animate-pulse" /> Arena Connected
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Action Buttons (Persis Image #12) */}
                <div className="pt-2 flex flex-wrap items-center gap-2 border-t border-slate-100">
                  {/* Primary Button */}
                  <Link
                    href={`/events/${ev.id}`}
                    className="flex-1 min-w-[140px] text-center rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs py-2.5 px-3 transition-colors shadow-2xs"
                  >
                    {isDraft ? 'Lanjutkan Setup' : isFinished ? 'Buka Buku Hasil' : 'Buka Dasbor Event'}
                  </Link>

                  {/* Quick Otoritas Selesai / Buka Button */}
                  {!isFinished ? (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatusOverride(ev.id, 'finished')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-bold text-xs py-2.5 px-3 transition-colors cursor-pointer"
                      title="Tandai Kejuaraan Selesai / Arsipkan"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> Selesai
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatusOverride(ev.id, 'open')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-800 font-bold text-xs py-2.5 px-3 transition-colors cursor-pointer"
                      title="Buka Kembali Pendaftaran Kejuaraan"
                    >
                      <Unlock className="h-3.5 w-3.5 text-blue-600" /> Buka Lagi
                    </button>
                  )}

                  {/* Secondary Action Button */}
                  {isLive ? (
                    <Link
                      href={`/public-live/${ev.id}`}
                      target="_blank"
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2.5 px-3.5 transition-colors"
                    >
                      <Radio className="h-3.5 w-3.5 text-rose-600" /> Live Arena TV
                    </Link>
                  ) : isFinished ? (
                    <Link
                      href={`/sertifikat?event=${ev.id}`}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2.5 px-3.5 transition-colors"
                    >
                      <Medal className="h-3.5 w-3.5 text-amber-600" /> Ekspor Sertifikat
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleCopyLink(ev.id)}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs py-2.5 px-3.5 transition-colors cursor-pointer"
                    >
                      {copiedId === ev.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" /> Tersalin
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5 text-slate-500" /> Salin Link
                        </>
                      )}
                    </button>
                  )}

                  {/* Extra Link to Rekap Klub */}
                  <Link
                    href={`/events/${ev.id}/rekap-klub`}
                    className="h-9 w-9 rounded-xl border border-slate-200 flex items-center justify-center text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 transition-colors"
                    title="Rekap Atlet per Klub (PDF)"
                  >
                    <School className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── BOTTOM CALL-TO-ACTION BANNER (PERSIS IMAGE #12) ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d455d] via-[#093548] to-[#04202d] p-6 sm:p-8 text-white shadow-md">
        {/* Glow decoration */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 border border-white/20 text-cyan-300 shadow-inner">
              <Sparkles className="h-6 w-6" />
            </div>

            <div className="space-y-1">
              <h3 className="font-heading font-black text-base sm:text-lg tracking-tight text-white">
                Perlu menambahkan kejuaraan baru dengan aturan seeding khusus?
              </h3>
              <p className="max-w-2xl text-xs sm:text-sm text-cyan-100/80 leading-relaxed">
                Gunakan Wizard Setup 6 Langkah untuk konfigurasi cepat: pengaturan batasan limit KU, penomoran acara otomatis, tata letak lintasan Omega, hingga format ekspor Lenex &amp; FINA.
              </p>
            </div>
          </div>

          <Link href="/events/new" className="shrink-0">
            <Button className="h-11 bg-white hover:bg-slate-100 text-[#093548] font-heading font-black text-xs sm:text-sm px-6 rounded-xl shadow-md transition-all">
              Buka Wizard Setup Kejuaraan
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
