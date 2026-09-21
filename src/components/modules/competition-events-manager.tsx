'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Layers,
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  ArrowUpDown,
  Search,
  Filter,
  Check,
  RotateCcw,
  Clock,
  Waves,
  X,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import {
  createCompEventAction,
  updateCompEventAction,
  deleteCompEventAction,
  batchCreateCompEventsAction,
  reorderCompEventsAction,
  type CompEventPayload,
} from '@/app/(dashboard)/events/[id]/actions';

export interface CompEventItem {
  id: string;
  name: string;
  stroke: string;
  distance_meters: number;
  gender: 'male' | 'female' | 'mixed';
  grade_level?: string | null;
  class_name?: string | null;
  order_no?: number | null;
  session_no?: number | null;
}

interface CompetitionEventsManagerProps {
  eventId: string;
  eventName: string;
  initialCompEvents: CompEventItem[];
}

const STROKE_OPTIONS = [
  { value: 'Breaststroke', label: 'Gaya Dada (Breaststroke)' },
  { value: 'Freestyle', label: 'Gaya Bebas (Freestyle)' },
  { value: 'Backstroke', label: 'Gaya Punggung (Backstroke)' },
  { value: 'Butterfly', label: 'Gaya Kupu-kupu (Butterfly)' },
  { value: 'Individual Medley', label: 'Gaya Ganti Perorangan (IM)' },
  { value: 'Kickboard', label: 'Papan Kaki / Fins' },
];

const DISTANCE_OPTIONS = [25, 50, 100, 200, 400, 800, 1500];

const PRESET_AGE_GROUPS = [
  { key: 'senior', label: 'KU Senior (19+ Th / Mahasiswa / Umum)', code: 'KU Senior' },
  { key: 'ku1', label: 'KU I (16–18 Th / SMA Kelas 10-12)', code: 'KU I' },
  { key: 'ku2', label: 'KU II (14–15 Th / SMP Kelas 8-9)', code: 'KU II' },
  { key: 'ku3', label: 'KU III (12–13 Th / SD Kelas 6 - SMP 7)', code: 'KU III' },
  { key: 'ku4', label: 'KU IV (10–11 Th / SD Kelas 4-5)', code: 'KU IV' },
  { key: 'ku5', label: 'KU V (< 10 Th / SD 1-3 / PAUD)', code: 'KU V' },
];

export function CompetitionEventsManager({
  eventId,
  eventName,
  initialCompEvents,
}: CompetitionEventsManagerProps) {
  const router = useRouter();
  const [compEvents, setCompEvents] = useState<CompEventItem[]>(initialCompEvents);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStroke, setFilterStroke] = useState<string>('all');
  const [filterDistance, setFilterDistance] = useState<string>('all');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [filterAgeGroup, setFilterAgeGroup] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grouped'>('table');

  // Modal State: Batch Generator (Atur Berapa Acara per Gaya, e.g. 25m Gaya Dada)
  const [openBatchModal, setOpenBatchModal] = useState(false);
  const [batchStroke, setBatchStroke] = useState('Breaststroke');
  const [batchDistance, setBatchDistance] = useState(25);
  const [batchGenderMode, setBatchGenderMode] = useState<'both' | 'male' | 'female'>('both');
  const [batchSelectedGroups, setBatchSelectedGroups] = useState<string[]>([
    'KU V',
    'KU IV',
    'KU III',
    'KU II',
  ]);
  const [batchStartOrderNo, setBatchStartOrderNo] = useState<number>(() => {
    const maxOrder = initialCompEvents.reduce((m, c) => Math.max(m, c.order_no || 0), 0);
    return maxOrder + 1;
  });
  const [batchSessionNo, setBatchSessionNo] = useState(1);
  const [isSubmittingBatch, setIsSubmittingBatch] = useState(false);

  // Modal State: Add Single Event
  const [openAddModal, setOpenAddModal] = useState(false);
  const [singlePayload, setSinglePayload] = useState<CompEventPayload>({
    name: '',
    stroke: 'Breaststroke',
    distance_meters: 25,
    gender: 'male',
    grade_level: 'KU III',
    class_name: 'KU III',
    order_no: (initialCompEvents.reduce((m, c) => Math.max(m, c.order_no || 0), 0) || 0) + 1,
    session_no: 1,
  });
  const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);

  // Modal State: Edit Event
  const [editingEvent, setEditingEvent] = useState<CompEventItem | null>(null);
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Reorder State
  const [isReordering, setIsReordering] = useState(false);

  // Sync state if props change
  useMemo(() => {
    setCompEvents(initialCompEvents);
  }, [initialCompEvents]);

  // Statistik Pengelompokan Gaya & Jarak
  const groupStats = useMemo(() => {
    const map = new Map<string, { stroke: string; distance: number; count: number }>();
    compEvents.forEach((ce) => {
      const key = `${ce.distance_meters}m ${ce.stroke}`;
      const existing = map.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        map.set(key, { stroke: ce.stroke, distance: ce.distance_meters, count: 1 });
      }
    });
    return Array.from(map.entries()).map(([label, data]) => ({ label, ...data }));
  }, [compEvents]);

  // Statistik Pengelompokan Kategori Usia
  const ageGroupStats = useMemo(() => {
    const map = new Map<string, number>();
    compEvents.forEach((ce) => {
      const g = ce.grade_level || ce.class_name || 'Umum';
      map.set(g, (map.get(g) || 0) + 1);
    });
    return Array.from(map.entries()).map(([group, count]) => ({ group, count }));
  }, [compEvents]);

  // Filtered List
  const filteredEvents = useMemo(() => {
    return compEvents.filter((ce) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        ce.name.toLowerCase().includes(q) ||
        ce.stroke.toLowerCase().includes(q) ||
        ce.grade_level?.toLowerCase().includes(q) ||
        ce.class_name?.toLowerCase().includes(q) ||
        String(ce.order_no).includes(q);

      const matchStroke = filterStroke === 'all' || ce.stroke === filterStroke;
      const matchDistance =
        filterDistance === 'all' || String(ce.distance_meters) === filterDistance;
      const matchGender = filterGender === 'all' || ce.gender === filterGender;
      const matchAgeGroup =
        filterAgeGroup === 'all' ||
        ce.grade_level === filterAgeGroup ||
        ce.class_name === filterAgeGroup ||
        (ce.grade_level && ce.grade_level.toLowerCase().includes(filterAgeGroup.toLowerCase()));

      return matchSearch && matchStroke && matchDistance && matchGender && matchAgeGroup;
    });
  }, [compEvents, searchQuery, filterStroke, filterDistance, filterGender, filterAgeGroup]);

  // Preview List untuk Batch Generator
  const batchPreviewItems = useMemo(() => {
    const items: CompEventPayload[] = [];
    let currentOrder = Number(batchStartOrderNo) || 1;

    const strokeObj = STROKE_OPTIONS.find((s) => s.value === batchStroke);
    const strokeNameIndo = strokeObj?.label.split('(')[0].trim() || batchStroke;

    batchSelectedGroups.forEach((groupCode) => {
      if (batchGenderMode === 'both' || batchGenderMode === 'male') {
        items.push({
          name: `${batchDistance}M ${strokeNameIndo} Putra ${groupCode}`,
          stroke: batchStroke,
          distance_meters: batchDistance,
          gender: 'male',
          grade_level: groupCode,
          class_name: groupCode,
          order_no: currentOrder++,
          session_no: batchSessionNo,
        });
      }
      if (batchGenderMode === 'both' || batchGenderMode === 'female') {
        items.push({
          name: `${batchDistance}M ${strokeNameIndo} Putri ${groupCode}`,
          stroke: batchStroke,
          distance_meters: batchDistance,
          gender: 'female',
          grade_level: groupCode,
          class_name: groupCode,
          order_no: currentOrder++,
          session_no: batchSessionNo,
        });
      }
    });

    return items;
  }, [batchStroke, batchDistance, batchGenderMode, batchSelectedGroups, batchStartOrderNo, batchSessionNo]);

  // Handler: Batch Create
  const handleExecuteBatchCreate = async () => {
    if (batchPreviewItems.length === 0) {
      toast.error('Pilih minimal 1 kelompok umur untuk membuat acara.');
      return;
    }

    setIsSubmittingBatch(true);
    try {
      const res = await batchCreateCompEventsAction(eventId, batchPreviewItems);
      if (res.ok) {
        toast.success(`Berhasil menambahkan ${res.data?.count || batchPreviewItems.length} nomor lomba!`);
        setOpenBatchModal(false);
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal menambahkan nomor lomba.');
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsSubmittingBatch(false);
    }
  };

  // Handler: Add Single
  const handleExecuteAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singlePayload.name.trim()) {
      toast.error('Nama nomor lomba wajib diisi.');
      return;
    }

    setIsSubmittingSingle(true);
    try {
      const res = await createCompEventAction(eventId, singlePayload);
      if (res.ok) {
        toast.success('Nomor lomba berhasil ditambahkan!');
        setOpenAddModal(false);
        // Reset name
        setSinglePayload((prev) => ({
          ...prev,
          name: '',
          order_no: (prev.order_no || 1) + 1,
        }));
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal menambahkan nomor lomba.');
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsSubmittingSingle(false);
    }
  };

  // Handler: Edit Single
  const handleExecuteEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;

    setIsSubmittingEdit(true);
    try {
      const res = await updateCompEventAction(eventId, editingEvent.id, {
        name: editingEvent.name,
        stroke: editingEvent.stroke,
        distance_meters: editingEvent.distance_meters,
        gender: editingEvent.gender,
        grade_level: editingEvent.grade_level,
        class_name: editingEvent.class_name,
        order_no: editingEvent.order_no || 1,
        session_no: editingEvent.session_no || 1,
      });

      if (res.ok) {
        toast.success('Nomor lomba berhasil diperbarui!');
        setEditingEvent(null);
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal memperbarui nomor lomba.');
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi.');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Handler: Delete Single
  const handleDelete = async (compEventId: string, name: string) => {
    if (!confirm(`Hapus nomor lomba "${name}"? Seluruh heat dan data terkait acara ini akan ikut terhapus.`)) {
      return;
    }

    try {
      const res = await deleteCompEventAction(eventId, compEventId);
      if (res.ok) {
        toast.success(`Nomor lomba "${name}" berhasil dihapus.`);
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal menghapus nomor lomba.');
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi.');
    }
  };

  // Handler: Urutkan Otomatis 1..N
  const handleAutoReorder = async () => {
    if (!confirm('Urutkan ulang nomor acara secara berurutan mulai nomor 1 sampai selesai?')) {
      return;
    }

    setIsReordering(true);
    try {
      const sortedIds = [...compEvents]
        .sort((a, b) => (a.order_no || 0) - (b.order_no || 0))
        .map((c) => c.id);

      const res = await reorderCompEventsAction(eventId, sortedIds);
      if (res.ok) {
        toast.success('Seluruh nomor acara berhasil diurutkan rapi (1..N)!');
        router.refresh();
      } else {
        toast.error(res.error || 'Gagal mengurutkan nomor acara.');
      }
    } catch {
      toast.error('Terjadi kesalahan saat mengurutkan.');
    } finally {
      setIsReordering(false);
    }
  };

  // Buka dialog batch preset untuk gaya & jarak tertentu
  const openBatchForSpecific = (stroke: string, distance: number) => {
    setBatchStroke(stroke);
    setBatchDistance(distance);
    const maxOrder = compEvents.reduce((m, c) => Math.max(m, c.order_no || 0), 0);
    setBatchStartOrderNo(maxOrder + 1);
    setOpenBatchModal(true);
  };

  return (
    <div id="atur-acara" className="space-y-6 scroll-mt-10">
      {/* HEADER ATUR ACARA & NOMOR LOMBA */}
      <div className="rounded-2xl border border-[var(--m-border)] bg-white p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)]">
                <Layers className="h-4 w-4" />
              </span>
              <h2 className="text-lg font-bold text-slate-950">
                Pengaturan Acara & Nomor Lomba
              </h2>
              <Badge variant="secondary" className="font-bold text-xs bg-blue-50 text-blue-900 border-blue-200">
                {compEvents.length} Total Acara
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Atur daftar acara, urutan nomor lomba (Acara #1, #2, dst.), serta tentukan berapa banyak nomor lomba untuk tiap gaya dan jarak.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tombol Fitur Inti: Atur Berapa Acara per Gaya & Jarak */}
            <Button
              onClick={() => {
                const maxOrder = compEvents.reduce((m, c) => Math.max(m, c.order_no || 0), 0);
                setBatchStartOrderNo(maxOrder + 1);
                setOpenBatchModal(true);
              }}
              className="gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
            >
              <Sparkles className="h-3.5 w-3.5" /> Atur Acara per Gaya (25m Dada, dll.)
            </Button>

            <Button
              variant="outline"
              onClick={() => setOpenAddModal(true)}
              className="gap-1.5 text-xs font-semibold border-slate-300 hover:bg-slate-50 text-slate-800"
            >
              <Plus className="h-3.5 w-3.5 text-emerald-600" /> Tambah Satuan
            </Button>

            {compEvents.length > 1 && (
              <Button
                variant="outline"
                onClick={handleAutoReorder}
                disabled={isReordering}
                className="gap-1.5 text-xs font-semibold border-slate-300 hover:bg-slate-50 text-slate-700"
                title="Rapikan urutan nomor acara menjadi 1, 2, 3... berurutan"
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-indigo-600" />
                {isReordering ? 'Mengurutkan...' : 'Urutkan 1..N'}
              </Button>
            )}

            <Link href={`/buku-acara?event=${eventId}`}>
              <Button variant="ghost" className="gap-1 text-xs text-blue-600 hover:text-blue-800 font-semibold">
                Buku Acara »
              </Button>
            </Link>
          </div>
        </div>

        {/* RINGKASAN REKAPITULASI GAYA & JARAK (Pill Badges) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-amber-500" />
              Rekapitulasi Nomor Lomba per Gaya & Jarak:
            </span>
            <span className="text-[11px] text-muted-foreground">
              Klik pada badge untuk memfilter atau mengatur ulang
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {groupStats.length === 0 ? (
              <span className="text-xs text-slate-400 italic">
                Belum ada nomor lomba yang terdaftar. Klik &quot;Atur Acara per Gaya&quot; untuk membuat susunan acara.
              </span>
            ) : (
              groupStats.map((grp) => {
                const isActive =
                  filterStroke === grp.stroke && filterDistance === String(grp.distance);

                return (
                  <button
                    key={grp.label}
                    type="button"
                    onClick={() => {
                      if (isActive) {
                        setFilterStroke('all');
                        setFilterDistance('all');
                      } else {
                        setFilterStroke(grp.stroke);
                        setFilterDistance(String(grp.distance));
                      }
                    }}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition-all border shadow-2xs',
                      isActive
                        ? 'bg-blue-600 text-white border-blue-700'
                        : 'bg-slate-50 hover:bg-blue-50 text-slate-800 border-slate-200'
                    )}
                  >
                    <span>🏊 {grp.label}</span>
                    <span
                      className={cn(
                        'rounded-full px-1.5 py-0.2 text-[10px] font-black',
                        isActive ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-900'
                      )}
                    >
                      {grp.count} Acara
                    </span>
                  </button>
                );
              })
            )}

            {(filterStroke !== 'all' || filterDistance !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterStroke('all');
                  setFilterDistance('all');
                }}
                className="h-7 text-xs text-rose-600 hover:text-rose-800 gap-1 px-2"
              >
                <X className="h-3 w-3" /> Reset Filter
              </Button>
            )}
          </div>
        </div>

        {/* INTEGRASI KATEGORI USIA / KELOMPOK UMUR (KU) */}
        <div className="space-y-2 pt-3 border-t border-slate-100">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1.5">
              <Filter className="h-3.5 w-3.5 text-indigo-600" />
              Filter & Integrasi Kategori Usia (KU / Jenjang):
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Tampilan:</span>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn('px-2.5 py-1 rounded-md text-[11px] font-bold transition-all', viewMode === 'table' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}
              >
                Tabel Utama
              </button>
              <button
                type="button"
                onClick={() => setViewMode('grouped')}
                className={cn('px-2.5 py-1 rounded-md text-[11px] font-bold transition-all', viewMode === 'grouped' ? 'bg-indigo-600 text-white shadow-2xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')}
              >
                Grup per Kategori Usia
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setFilterAgeGroup('all')}
              className={cn(
                'px-3 py-1 rounded-lg text-xs font-semibold border transition-all',
                filterAgeGroup === 'all'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              )}
            >
              Semua Kategori ({compEvents.length})
            </button>
            {ageGroupStats.map((ags) => {
              const isActive = filterAgeGroup === ags.group;
              return (
                <button
                  key={ags.group}
                  type="button"
                  onClick={() => setFilterAgeGroup(isActive ? 'all' : ags.group)}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold border transition-all',
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-2xs'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-indigo-50'
                  )}
                >
                  <span>🏷️ {ags.group}</span>
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-full text-[10px] font-black',
                      isActive ? 'bg-white text-indigo-700' : 'bg-indigo-100 text-indigo-900'
                    )}
                  >
                    {ags.count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* TOOLBAR FILTER & SEARCH */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs border-t border-slate-100">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nomor acara / nama lomba..."
              className="pl-8 h-8 text-xs border-slate-200"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-slate-900"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <Select value={filterStroke} onValueChange={setFilterStroke}>
              <SelectTrigger className="h-8 text-xs w-[140px]">
                <SelectValue placeholder="Semua Gaya" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Gaya</SelectItem>
                {STROKE_OPTIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label.split('(')[0]}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterDistance} onValueChange={setFilterDistance}>
              <SelectTrigger className="h-8 text-xs w-[110px]">
                <SelectValue placeholder="Semua Jarak" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Jarak</SelectItem>
                {DISTANCE_OPTIONS.map((d) => (
                  <SelectItem key={d} value={String(d)}>{d} Meter</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterGender} onValueChange={setFilterGender}>
              <SelectTrigger className="h-8 text-xs w-[110px]">
                <SelectValue placeholder="Gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Gender</SelectItem>
                <SelectItem value="male">Putra</SelectItem>
                <SelectItem value="female">Putri</SelectItem>
                <SelectItem value="mixed">Campuran</SelectItem>
              </SelectContent>
            </Select>

            <span className="text-[11px] text-muted-foreground font-semibold ml-1">
              Menampilkan {filteredEvents.length} acara
            </span>
          </div>
        </div>
      </div>

      {/* DAFTAR NOMOR ACARA (TABEL / KELOMPOK KATEGORI USIA) */}
      <div className="space-y-4">
        {filteredEvents.length === 0 ? (
          <div className="rounded-2xl border border-[var(--m-border)] bg-white p-12 text-center space-y-3 shadow-xs">
            <Layers className="h-10 w-10 text-muted-foreground/30 mx-auto" />
            <h4 className="font-bold text-slate-800 text-sm">
              {compEvents.length === 0
                ? 'Belum ada nomor lomba untuk kejuaraan ini'
                : 'Tidak ada nomor lomba yang sesuai dengan filter'}
            </h4>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              Gunakan tombol <b>&quot;Atur Acara per Gaya&quot;</b> untuk membuat acara lomba secara otomatis sesuai jumlah dan kategori usia yang Anda tentukan.
            </p>
            <Button
              onClick={() => setOpenBatchModal(true)}
              className="gap-1.5 text-xs font-bold bg-blue-600 text-white mt-2"
            >
              <Sparkles className="h-3.5 w-3.5" /> Buat Nomor Lomba Sekarang
            </Button>
          </div>
        ) : viewMode === 'grouped' ? (
          <div className="space-y-6">
            {Array.from(
              filteredEvents.reduce((acc, ce) => {
                const group = ce.grade_level || ce.class_name || 'Umum';
                if (!acc.has(group)) acc.set(group, []);
                acc.get(group)!.push(ce);
                return acc;
              }, new Map<string, CompEventItem[]>())
            ).map(([groupName, eventsInGroup]) => (
              <div key={groupName} className="rounded-2xl border border-[var(--m-border)] bg-white overflow-hidden shadow-xs">
                <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-800 font-black text-xs">
                      🏷️
                    </span>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">
                        Kategori Usia: {groupName}
                      </h3>
                      <p className="text-[11px] text-muted-foreground">
                        Daftar nomor lomba yang sesuai untuk kategori {groupName}
                      </p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-indigo-100 text-indigo-900 text-xs font-bold px-2.5 py-1">
                    {eventsInGroup.length} Nomor Lomba
                  </Badge>
                </div>
                <div className="divide-y divide-slate-100">
                  {eventsInGroup.map((ce) => (
                    <div key={ce.id} className="p-4 flex items-center justify-between hover:bg-slate-50/70 transition-colors">
                      <div className="flex items-center gap-4">
                        <span className="inline-flex h-7 px-2.5 items-center justify-center rounded-md bg-blue-50 text-blue-900 border border-blue-200 text-xs font-black">
                          #{ce.order_no || '—'}
                        </span>
                        <div>
                          <h4 className="font-bold text-slate-950 text-sm">{ce.name}</h4>
                          <span className="text-xs text-muted-foreground flex items-center gap-2 mt-0.5">
                            <Badge variant="outline" className="text-[10px] font-semibold bg-slate-50">
                              {ce.distance_meters}m {ce.stroke}
                            </Badge>
                            <span>•</span>
                            <span className={cn('font-bold text-[11px]', ce.gender === 'male' ? 'text-blue-700' : ce.gender === 'female' ? 'text-rose-700' : 'text-purple-700')}>
                              {ce.gender === 'male' ? 'Putra' : ce.gender === 'female' ? 'Putri' : 'Campuran'}
                            </span>
                            <span>•</span>
                            <span>Sesi {ce.session_no || 1}</span>
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditingEvent(ce)}
                          className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(ce.id, ce.name)}
                          className="h-7 w-7 text-rose-500 hover:bg-rose-50"
                          title="Hapus"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                        <Link href={`/results?eventId=${eventId}&compEventId=${ce.id}`} className="text-xs text-blue-700 font-bold hover:underline ml-2">
                          Hasil →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-[var(--m-border)] bg-white overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="w-24 text-center font-bold">No. Acara</TableHead>
                    <TableHead className="font-bold">Nama Nomor Lomba</TableHead>
                    <TableHead className="w-32 font-bold">Gaya & Jarak</TableHead>
                    <TableHead className="w-24 text-center font-bold">Gender</TableHead>
                    <TableHead className="w-32 font-bold">Kelompok Usia</TableHead>
                    <TableHead className="w-20 text-center font-bold">Sesi</TableHead>
                    <TableHead className="w-36 text-right font-bold">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-slate-100 text-xs">
                  {filteredEvents.map((ce) => (
                    <TableRow key={ce.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Nomor Acara */}
                      <TableCell className="text-center font-mono font-black text-slate-900">
                        <span className="inline-flex h-7 px-2.5 items-center justify-center rounded-md bg-blue-50 text-blue-900 border border-blue-200 text-xs font-black">
                          #{ce.order_no || '—'}
                        </span>
                      </TableCell>

                      {/* Nama Nomor Lomba */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-950 text-sm block">
                            {ce.name}
                          </span>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            ID: {ce.id.slice(0, 8)}
                          </span>
                        </div>
                      </TableCell>

                      {/* Gaya & Jarak */}
                      <TableCell>
                        <div className="space-y-1">
                          <Badge variant="outline" className="font-semibold text-[11px] bg-slate-50 border-slate-200 text-slate-800">
                            {ce.distance_meters}m {ce.stroke}
                          </Badge>
                        </div>
                      </TableCell>

                      {/* Gender */}
                      <TableCell className="text-center">
                        <span
                          className={cn(
                            'inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold',
                            ce.gender === 'male'
                              ? 'bg-blue-100 text-blue-800'
                              : ce.gender === 'female'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-purple-100 text-purple-800'
                          )}
                        >
                          {ce.gender === 'male' ? 'Putra' : ce.gender === 'female' ? 'Putri' : 'Campuran'}
                        </span>
                      </TableCell>

                      {/* Kelompok Usia */}
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-900 font-bold text-[11px] border border-indigo-200">
                          🏷️ {ce.grade_level || ce.class_name || 'Umum'}
                        </span>
                      </TableCell>

                      {/* Sesi */}
                      <TableCell className="text-center font-mono font-semibold text-slate-600">
                        Sesi {ce.session_no || 1}
                      </TableCell>

                      {/* Aksi */}
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingEvent(ce)}
                            className="h-7 w-7 text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                            title="Edit nomor acara"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(ce.id, ce.name)}
                            className="h-7 w-7 text-rose-500 hover:text-rose-700 hover:bg-rose-50"
                            title="Hapus nomor acara"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>

                          <Link
                            href={`/results?eventId=${eventId}&compEventId=${ce.id}`}
                            className="text-[11px] text-blue-700 hover:underline font-bold ml-1"
                          >
                            Hasil →
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </div>

      {/* DIALOG MODAL: BATCH GENERATOR (ATUR BERAPA ACARA PER GAYA & JARAK) */}
      <Dialog open={openBatchModal} onOpenChange={setOpenBatchModal}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-950">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Atur Berapa Nomor Acara Lomba per Gaya & Jarak
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200 text-blue-900 leading-relaxed">
              💡 <b>Contoh Penggunaan:</b> Tentukan gaya (misal <b>Gaya Dada</b>), jarak (misal <b>25m</b>), dan pilih kelompok usia serta gender untuk mengatur berapa nomor acara yang ingin dibentuk sekaligus.
            </div>

            {/* Pilihan 1: Gaya & Jarak */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-900 block">1. Gaya Renang</label>
                <Select value={batchStroke} onValueChange={setBatchStroke}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih Gaya" />
                  </SelectTrigger>
                  <SelectContent>
                    {STROKE_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-900 block">2. Jarak Perlombaan</label>
                <Select
                  value={String(batchDistance)}
                  onValueChange={(val) => setBatchDistance(Number(val))}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="Pilih Jarak" />
                  </SelectTrigger>
                  <SelectContent>
                    {DISTANCE_OPTIONS.map((d) => (
                      <SelectItem key={d} value={String(d)}>{d} Meter</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pilihan 2: Gender */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-900 block">3. Pembagian Kategori Gender</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setBatchGenderMode('both')}
                  className={cn(
                    'p-2.5 rounded-lg border text-center font-bold transition-all text-xs',
                    batchGenderMode === 'both'
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  )}
                >
                  Putra & Putri
                  <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">
                    (2x lipat acara)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBatchGenderMode('male')}
                  className={cn(
                    'p-2.5 rounded-lg border text-center font-bold transition-all text-xs',
                    batchGenderMode === 'male'
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  )}
                >
                  Hanya Putra
                  <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">
                    (Acara Putra saja)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setBatchGenderMode('female')}
                  className={cn(
                    'p-2.5 rounded-lg border text-center font-bold transition-all text-xs',
                    batchGenderMode === 'female'
                      ? 'border-blue-600 bg-blue-50 text-blue-900'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  )}
                >
                  Hanya Putri
                  <span className="block text-[10px] font-normal text-muted-foreground mt-0.5">
                    (Acara Putri saja)
                  </span>
                </button>
              </div>
            </div>

            {/* Pilihan 3: Kelompok Umur / Jenjang Kelas */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-900 block">
                  4. Kelompok Usia / Kategori Lomba ({batchSelectedGroups.length} Dipilih)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setBatchSelectedGroups(PRESET_AGE_GROUPS.map((g) => g.code))
                    }
                    className="text-[11px] text-blue-600 hover:underline font-semibold"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-slate-300">·</span>
                  <button
                    type="button"
                    onClick={() => setBatchSelectedGroups([])}
                    className="text-[11px] text-slate-500 hover:underline"
                  >
                    Batal Pilih
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                {PRESET_AGE_GROUPS.map((grp) => {
                  const isChecked = batchSelectedGroups.includes(grp.code);
                  return (
                    <label
                      key={grp.key}
                      className={cn(
                        'flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all',
                        isChecked
                          ? 'bg-white border-blue-500 font-bold text-blue-950 shadow-2xs'
                          : 'bg-white/60 border-slate-200 text-slate-600'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setBatchSelectedGroups((prev) => [...prev, grp.code]);
                          } else {
                            setBatchSelectedGroups((prev) =>
                              prev.filter((c) => c !== grp.code)
                            );
                          }
                        }}
                        className="h-3.5 w-3.5 rounded border-slate-300 text-blue-600"
                      />
                      <span>{grp.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Pilihan 4: Pengaturan Nomor Acara Mulai & Sesi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-900 block">
                  5. Nomor Acara Dimulai Dari
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-mono font-bold">Acara #</span>
                  <Input
                    type="number"
                    min={1}
                    value={batchStartOrderNo}
                    onChange={(e) => setBatchStartOrderNo(Number(e.target.value) || 1)}
                    className="h-9 text-xs font-bold"
                  />
                </div>
                <span className="text-[10px] text-muted-foreground block">
                  Nomor berikutnya otomatis diurutkan berkelanjutan (+1).
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-slate-900 block">6. Sesi Perlombaan</label>
                <Input
                  type="number"
                  min={1}
                  value={batchSessionNo}
                  onChange={(e) => setBatchSessionNo(Number(e.target.value) || 1)}
                  className="h-9 text-xs font-bold"
                />
                <span className="text-[10px] text-muted-foreground block">
                  Contoh: Sesi 1 (Pagi) atau Sesi 2 (Siang/Sore).
                </span>
              </div>
            </div>

            {/* PREVIEW HASIL ACARA YANG AKAN DIBUAT */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">
                  Pratinjau: Total {batchPreviewItems.length} Nomor Acara Akan Dibentuk
                </span>
                <Badge className="bg-emerald-600 text-white font-bold text-[10px]">
                  {batchDistance}M {batchStroke}
                </Badge>
              </div>

              <div className="max-h-40 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 p-2 divide-y divide-slate-200/80 text-[11px]">
                {batchPreviewItems.length === 0 ? (
                  <span className="text-slate-400 p-2 block text-center">
                    Pilih minimal 1 kelompok usia untuk melihat pratinjau acara.
                  </span>
                ) : (
                  batchPreviewItems.map((item) => (
                    <div key={item.order_no} className="flex items-center justify-between py-1 px-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-700 w-16">
                          Acara #{item.order_no}
                        </span>
                        <span className="font-medium text-slate-900">{item.name}</span>
                      </div>
                      <span className={cn(
                        'text-[10px] font-bold px-1.5 py-0.2 rounded',
                        item.gender === 'male' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                      )}>
                        {item.gender === 'male' ? 'Putra' : 'Putri'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpenBatchModal(false)}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleExecuteBatchCreate}
              disabled={isSubmittingBatch || batchPreviewItems.length === 0}
              className="text-xs gap-1.5 font-bold bg-blue-600 text-white hover:bg-blue-700"
            >
              <Check className="h-3.5 w-3.5" />
              {isSubmittingBatch
                ? 'Menyimpan...'
                : `Simpan & Terapkan ${batchPreviewItems.length} Acara`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG MODAL: TAMBAH ACARA SATUAN */}
      <Dialog open={openAddModal} onOpenChange={setOpenAddModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-950">
              <Plus className="h-4 w-4 text-emerald-600" />
              Tambah Nomor Lomba Satuan
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleExecuteAddSingle} className="space-y-3.5 py-2 text-xs">
            <div className="space-y-1">
              <label className="font-bold text-slate-900 block">Nama Nomor Lomba *</label>
              <Input
                placeholder="Contoh: 25M Gaya Dada Putra SD 1-2"
                value={singlePayload.name}
                onChange={(e) => setSinglePayload((prev) => ({ ...prev, name: e.target.value }))}
                className="text-xs font-semibold"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-900 block">Gaya Renang</label>
                <Select
                  value={singlePayload.stroke}
                  onValueChange={(val) => setSinglePayload((prev) => ({ ...prev, stroke: val }))}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STROKE_OPTIONS.map((s) => (
                      <SelectItem key={s.value} value={s.value}>{s.label.split('(')[0]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-900 block">Jarak (Meter)</label>
                <Select
                  value={String(singlePayload.distance_meters)}
                  onValueChange={(val) =>
                    setSinglePayload((prev) => ({ ...prev, distance_meters: Number(val) }))
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DISTANCE_OPTIONS.map((d) => (
                      <SelectItem key={d} value={String(d)}>{d}m</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-900 block">Gender</label>
                <Select
                  value={singlePayload.gender}
                  onValueChange={(val: 'male' | 'female' | 'mixed') =>
                    setSinglePayload((prev) => ({ ...prev, gender: val }))
                  }
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Putra</SelectItem>
                    <SelectItem value="female">Putri</SelectItem>
                    <SelectItem value="mixed">Campuran</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-900 block">Kategori / Jenjang</label>
                <Input
                  placeholder="Contoh: SD 1-2, KU 4"
                  value={singlePayload.grade_level || ''}
                  onChange={(e) =>
                    setSinglePayload((prev) => ({
                      ...prev,
                      grade_level: e.target.value,
                      class_name: e.target.value,
                    }))
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="font-bold text-slate-900 block">Nomor Acara</label>
                <Input
                  type="number"
                  min={1}
                  value={singlePayload.order_no}
                  onChange={(e) =>
                    setSinglePayload((prev) => ({
                      ...prev,
                      order_no: Number(e.target.value) || 1,
                    }))
                  }
                  className="h-8 text-xs font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-900 block">Sesi</label>
                <Input
                  type="number"
                  min={1}
                  value={singlePayload.session_no || 1}
                  onChange={(e) =>
                    setSinglePayload((prev) => ({
                      ...prev,
                      session_no: Number(e.target.value) || 1,
                    }))
                  }
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setOpenAddModal(false)}
                className="text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isSubmittingSingle}
                className="text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {isSubmittingSingle ? 'Menyimpan...' : 'Simpan Acara'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DIALOG MODAL: EDIT ACARA */}
      <Dialog open={Boolean(editingEvent)} onOpenChange={(open) => !open && setEditingEvent(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold text-slate-950">
              <Edit2 className="h-4 w-4 text-blue-600" />
              Edit Nomor Lomba (Acara #{editingEvent?.order_no || '—'})
            </DialogTitle>
          </DialogHeader>

          {editingEvent && (
            <form onSubmit={handleExecuteEdit} className="space-y-3.5 py-2 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-900 block">Nama Nomor Lomba *</label>
                <Input
                  value={editingEvent.name}
                  onChange={(e) =>
                    setEditingEvent((prev) => (prev ? { ...prev, name: e.target.value } : null))
                  }
                  className="text-xs font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-900 block">Gaya Renang</label>
                  <Select
                    value={editingEvent.stroke}
                    onValueChange={(val) =>
                      setEditingEvent((prev) => (prev ? { ...prev, stroke: val } : null))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STROKE_OPTIONS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label.split('(')[0]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-900 block">Jarak (Meter)</label>
                  <Select
                    value={String(editingEvent.distance_meters)}
                    onValueChange={(val) =>
                      setEditingEvent((prev) =>
                        prev ? { ...prev, distance_meters: Number(val) } : null
                      )
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DISTANCE_OPTIONS.map((d) => (
                        <SelectItem key={d} value={String(d)}>{d}m</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-900 block">Gender</label>
                  <Select
                    value={editingEvent.gender}
                    onValueChange={(val: 'male' | 'female' | 'mixed') =>
                      setEditingEvent((prev) => (prev ? { ...prev, gender: val } : null))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Putra</SelectItem>
                      <SelectItem value="female">Putri</SelectItem>
                      <SelectItem value="mixed">Campuran</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-900 block">Kategori / Jenjang</label>
                  <Input
                    value={editingEvent.grade_level || ''}
                    onChange={(e) =>
                      setEditingEvent((prev) =>
                        prev
                          ? {
                              ...prev,
                              grade_level: e.target.value,
                              class_name: e.target.value,
                            }
                          : null
                      )
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="font-bold text-slate-900 block">Nomor Acara</label>
                  <Input
                    type="number"
                    min={1}
                    value={editingEvent.order_no || 1}
                    onChange={(e) =>
                      setEditingEvent((prev) =>
                        prev ? { ...prev, order_no: Number(e.target.value) || 1 } : null
                      )
                    }
                    className="h-8 text-xs font-bold"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-900 block">Sesi</label>
                  <Input
                    type="number"
                    min={1}
                    value={editingEvent.session_no || 1}
                    onChange={(e) =>
                      setEditingEvent((prev) =>
                        prev ? { ...prev, session_no: Number(e.target.value) || 1 } : null
                      )
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-3">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setEditingEvent(null)}
                  className="text-xs"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmittingEdit}
                  className="text-xs font-bold bg-blue-600 text-white hover:bg-blue-700"
                >
                  {isSubmittingEdit ? 'Menyimpan...' : 'Simpan Perubahan'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
