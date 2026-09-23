'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Crown,
  Trophy,
  Calendar,
  School,
  User,
  Filter,
  Printer,
  Sparkles,
  Timer,
  Waves,
  Search,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { formatMsToTime, cn } from '@/lib/utils';

export interface RecordItemView {
  competition_event_id: string;
  event_id?: string;
  event_name?: string;
  athlete_id: string;
  athlete_name: string;
  school_name: string;
  time_ms: number;
  previous_time_ms: number | null;
  improvement_ms: number | null;
  comp_name: string;
  stroke: string;
  distance_meters: number;
  gender: string;
  grade_level: string;
}

interface RecordsManagerProps {
  events: { id: string; name: string }[];
  activeEventId: string;
  records: RecordItemView[];
}

export function RecordsManager({
  events,
  activeEventId,
  records,
}: RecordsManagerProps) {
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState(activeEventId);
  const [search, setSearch] = useState('');
  const [filterStroke, setFilterStroke] = useState('all');
  const [filterGender, setFilterGender] = useState('all');

  const handleEventChange = (val: string) => {
    setSelectedEventId(val);
    if (val === 'all') {
      router.push('/rajendra-record');
    } else {
      router.push(`/rajendra-record?eventId=${val}`);
    }
  };

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const q = search.toLowerCase().trim();
      const matchQ =
        !q ||
        r.athlete_name.toLowerCase().includes(q) ||
        r.school_name.toLowerCase().includes(q) ||
        r.comp_name.toLowerCase().includes(q);

      const matchStroke =
        filterStroke === 'all' || r.stroke.toLowerCase() === filterStroke.toLowerCase();

      const matchGender =
        filterGender === 'all' || r.gender.toLowerCase() === filterGender.toLowerCase();

      return matchQ && matchStroke && matchGender;
    });
  }, [records, search, filterStroke, filterGender]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* ── Toolbar Atas: Event Selector & Filter ── */}
      <div className="no-print rounded-2xl border border-[var(--m-border)] bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800 font-black">
                <Crown className="h-4 w-4" />
              </span>
              <h2 className="font-heading font-black text-lg text-[var(--m-ink)]">
                Daftar Rekor Kejuaraan Renang
              </h2>
            </div>
            <p className="text-xs text-[var(--m-muted)] mt-1">
              Catatan waktu terbaik yang terpecahkan sepanjang kejuaraan renang resmi Rajendra Meet.
            </p>
          </div>

          <Button
            onClick={handlePrint}
            className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
          >
            <Printer className="h-4 w-4" /> Cetak Lembar Rekor (PDF)
          </Button>
        </div>

        {/* Filter Controls Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
          {/* 1. Pilih Kejuaraan */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-primary" /> Kejuaraan:
            </label>
            <Select value={selectedEventId || 'all'} onValueChange={handleEventChange}>
              <SelectTrigger className="h-9 text-xs font-bold bg-slate-50 border-slate-200 text-slate-900">
                <SelectValue placeholder="Semua Kejuaraan" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">⭐ Seluruh Kejuaraan</SelectItem>
                {events.map((e) => (
                  <SelectItem key={e.id} value={e.id} className="text-xs">
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Cari Atlet / Sekolah */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Search className="h-3.5 w-3.5 text-slate-400" /> Cari Atlet / Klub:
            </label>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Ketik nama atau klub..."
              className="h-9 text-xs"
            />
          </div>

          {/* 3. Filter Gaya */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <Waves className="h-3.5 w-3.5 text-primary" /> Gaya Renang:
            </label>
            <Select value={filterStroke} onValueChange={setFilterStroke}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Semua Gaya" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Gaya</SelectItem>
                <SelectItem value="Freestyle">Gaya Bebas</SelectItem>
                <SelectItem value="Breaststroke">Gaya Dada</SelectItem>
                <SelectItem value="Backstroke">Gaya Punggung</SelectItem>
                <SelectItem value="Butterfly">Gaya Kupu-kupu</SelectItem>
                <SelectItem value="Individual Medley">Gaya Ganti (IM)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 4. Filter Gender */}
          <div className="space-y-1">
            <label className="font-bold text-slate-700 flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 text-slate-500" /> Gender:
            </label>
            <Select value={filterGender} onValueChange={setFilterGender}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder="Semua Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Gender</SelectItem>
                <SelectItem value="male">Putra</SelectItem>
                <SelectItem value="female">Putri</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* ── KPI Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-panel p-5 border border-amber-200/80 bg-gradient-to-br from-amber-50/40 via-white to-white">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
            <Crown className="h-4 w-4 text-amber-600" /> Total Rekor Resmi
          </div>
          <div className="mt-1 font-heading text-3xl font-black text-slate-950 font-mono">
            {records.length} <span className="text-xs font-normal text-slate-500 font-sans">Nomor Lomba</span>
          </div>
          <p className="mt-1 text-xs text-slate-600">Catatan waktu tercepat yang tercatat</p>
        </div>

        <div className="glass-panel p-5 border border-slate-200">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Timer className="h-4 w-4 text-blue-600" /> Rekor Ditampilkan
          </div>
          <div className="mt-1 font-heading text-3xl font-black text-blue-900 font-mono">
            {filteredRecords.length} <span className="text-xs font-normal text-slate-500 font-sans">Sesuai Filter</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Berdasarkan filter pencarian & gaya</p>
        </div>

        <div className="glass-panel p-5 border border-slate-200">
          <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <School className="h-4 w-4 text-indigo-600" /> Status Kejuaraan
          </div>
          <div className="mt-1 font-heading text-xl font-black text-slate-900 truncate">
            {selectedEventId === 'all'
              ? 'Seluruh Kejuaraan'
              : events.find((e) => e.id === selectedEventId)?.name || 'Kejuaraan'}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Tersinkronisasi otomatis dengan hasil lomba</p>
        </div>
      </div>

      {/* ── Grid Kartu Rekor ── */}
      {filteredRecords.length === 0 ? (
        <EmptyState
          icon={<Crown className="h-8 w-8 text-amber-500" />}
          title="Belum Ada Rekor Terdeteksi"
          description="Belum ada catatan waktu hasil lomba yang memenuhi kriteria rekor untuk filter ini."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecords.map((r) => (
            <div
              key={r.competition_event_id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <Badge
                    variant="outline"
                    className="bg-amber-50 text-amber-900 border-amber-300 font-bold text-[10px] uppercase tracking-wider"
                  >
                    🏆 Rekor Kejuaraan
                  </Badge>
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase px-2 py-0.5 rounded-full',
                      r.gender === 'female'
                        ? 'bg-rose-50 text-rose-800'
                        : 'bg-blue-50 text-blue-800'
                    )}
                  >
                    {r.gender === 'female' ? 'Putri' : 'Putra'}
                  </span>
                </div>

                <div>
                  <h3 className="font-heading font-black text-sm sm:text-base text-slate-900 leading-snug">
                    {r.comp_name}
                  </h3>
                  {r.event_name && (
                    <p className="text-[11px] text-slate-400 mt-0.5 font-medium">
                      Event: {r.event_name}
                    </p>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                    <User className="h-3.5 w-3.5 text-primary" />
                    <span>{r.athlete_name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <School className="h-3.5 w-3.5 text-slate-400" />
                    <span>{r.school_name || 'Umum / Perorangan'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
                    Waktu Rekor
                  </span>
                  {r.improvement_ms != null && (
                    <span className="text-[11px] font-bold text-emerald-600">
                      -{(r.improvement_ms / 1000).toFixed(2)}s lebih cepat
                    </span>
                  )}
                </div>
                <div className="font-heading font-black text-2xl font-mono text-primary tabular-nums">
                  {formatMsToTime(r.time_ms)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
