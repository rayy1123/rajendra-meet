'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  Clock,
  MapPin,
  UserCheck,
  ShieldCheck,
  Printer,
  Search,
  Plus,
  X,
  FileText,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ClipboardCheck,
  Waves,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { BrandedSpinner } from '@/components/ui/branded-loading';
import {
  type TechnicalChecklistItem,
  type ChecklistCategory,
  type ChecklistStatus,
} from '@/lib/data/technical-checklist-server';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const CATEGORY_MAP: Record<ChecklistCategory, { label: string; color: string }> = {
  rekognisi: { label: 'Jadwal Rekognisi Kolam', color: 'bg-sky-50 text-sky-800 border-sky-200' },
  technical_meeting: { label: 'Technical Meeting (TM)', color: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  timing_system: { label: 'Timing & Scoreboard', color: 'bg-amber-50 text-amber-800 border-amber-200' },
  fasilitas_kolam: { label: 'Fasilitas & Keselamatan', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
  perangkat_wasit: { label: 'Wasit & Call Room', color: 'bg-purple-50 text-purple-800 border-purple-200' },
  administrasi_td: { label: 'Administrasi & Sign-Off TD', color: 'bg-rose-50 text-rose-800 border-rose-200' },
};

const STATUS_MAP: Record<ChecklistStatus, { label: string; badgeClass: string }> = {
  pending: { label: 'Belum Selesai', badgeClass: 'bg-slate-100 text-slate-700 border-slate-300' },
  in_progress: { label: 'Sedang Proses', badgeClass: 'bg-amber-100 text-amber-900 border-amber-300' },
  completed: { label: 'Selesai Dilaksanakan', badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  verified: { label: 'Terverifikasi TD', badgeClass: 'bg-blue-100 text-blue-900 border-blue-300' },
};

interface TechnicalChecklistManagerProps {
  initialItems: TechnicalChecklistItem[];
  userRole?: string;
  userName?: string;
}

export function TechnicalChecklistManager({
  initialItems,
  userRole = 'admin_technical',
  userName = 'Petugas Teknis',
}: TechnicalChecklistManagerProps) {
  const router = useRouter();
  const [items, setItems] = useState<TechnicalChecklistItem[]>(initialItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Modal Note State
  const [activeItemForNote, setActiveItemForNote] = useState<TechnicalChecklistItem | null>(null);
  const [noteInput, setNoteInput] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  // Modal Add Item State
  const [showAddModal, setShowAddModal] = useState(false);
  const [savingNewItem, setSavingNewItem] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCategory, setNewCategory] = useState<ChecklistCategory>('rekognisi');
  const [newTime, setNewTime] = useState('');
  const [newLocation, setNewLocation] = useState('Kolam Utama (50M)');
  const [newPic, setNewPic] = useState('Technical Delegate (TD)');
  const [newNotes, setNewNotes] = useState('');

  // Statistics
  const stats = useMemo(() => {
    const total = items.length;
    const completedOrVerified = items.filter(
      (i) => i.status === 'completed' || i.status === 'verified'
    ).length;
    const inProgress = items.filter((i) => i.status === 'in_progress').length;
    const pending = items.filter((i) => i.status === 'pending').length;
    const percentage = total > 0 ? Math.round((completedOrVerified / total) * 100) : 0;

    return { total, completedOrVerified, inProgress, pending, percentage };
  }, [items]);

  // Filtered List
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (selectedCategory !== 'all' && item.category !== selectedCategory) {
        return false;
      }
      if (selectedStatus !== 'all' && item.status !== selectedStatus) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchPic = item.pic.toLowerCase().includes(q);
        const matchLoc = item.location.toLowerCase().includes(q);
        const matchNotes = (item.notes || '').toLowerCase().includes(q);
        return matchTitle || matchDesc || matchPic || matchLoc || matchNotes;
      }
      return true;
    });
  }, [items, selectedCategory, selectedStatus, searchQuery]);

  // Toggle Status
  const handleQuickStatusChange = async (item: TechnicalChecklistItem) => {
    setUpdatingId(item.id);
    let nextStatus: ChecklistStatus = 'completed';
    if (item.status === 'completed') {
      nextStatus = 'verified';
    } else if (item.status === 'verified') {
      nextStatus = 'pending';
    } else if (item.status === 'pending') {
      nextStatus = 'completed';
    } else if (item.status === 'in_progress') {
      nextStatus = 'completed';
    }

    try {
      const res = await fetch('/api/technical-checklist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          status: nextStatus,
          verifiedBy: nextStatus === 'verified' ? userName || 'Technical Delegate (TD)' : undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal mengubah status');
      }

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? {
                ...i,
                status: nextStatus,
                verifiedBy: nextStatus === 'verified' ? userName || 'Technical Delegate (TD)' : i.verifiedBy,
                verifiedAt: nextStatus === 'verified' ? new Date().toISOString() : i.verifiedAt,
              }
            : i
        )
      );

      toast.success(`Status ${item.title.slice(0, 30)}... diubah menjadi: ${STATUS_MAP[nextStatus].label}`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setUpdatingId(null);
    }
  };

  // Open Edit Note
  const handleOpenNote = (item: TechnicalChecklistItem) => {
    setActiveItemForNote(item);
    setNoteInput(item.notes || '');
  };

  // Save Note
  const handleSaveNote = async () => {
    if (!activeItemForNote) return;
    setSavingNote(true);

    try {
      const res = await fetch('/api/technical-checklist', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeItemForNote.id,
          notes: noteInput,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menyimpan catatan');
      }

      setItems((prev) =>
        prev.map((i) => (i.id === activeItemForNote.id ? { ...i, notes: noteInput } : i))
      );

      toast.success('Catatan operasional teknis berhasil disimpan.');
      setActiveItemForNote(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan catatan.');
    } finally {
      setSavingNote(false);
    }
  };

  // Add Item
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast.error('Judul checklist wajib diisi.');
      return;
    }
    setSavingNewItem(true);

    try {
      const res = await fetch('/api/technical-checklist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          category: newCategory,
          scheduledTime: newTime.trim() || undefined,
          location: newLocation.trim(),
          pic: newPic.trim(),
          status: 'pending',
          notes: newNotes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal menambahkan item.');
      }

      const { data } = await res.json();
      setItems((prev) => [...prev, data]);
      toast.success('Item checklist baru berhasil ditambahkan!');
      setShowAddModal(false);
      setNewTitle('');
      setNewDesc('');
      setNewTime('');
      setNewNotes('');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan item.');
    } finally {
      setSavingNewItem(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header Info & Progress Card (Layar Saja - Disembunyikan saat cetak) */}
      <div className="glass-panel elevated p-6 rounded-2xl space-y-4 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge className="bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)] border-[var(--m-aqua)] font-bold text-xs">
                World Aquatics Standard
              </Badge>
              <span className="text-xs text-[var(--m-muted)] font-medium">
                Official Technical Delegate (TD) Portal
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-[var(--m-ink)] tracking-tight">
              Kesiapan Teknis &amp; Rekognisi Arena Kolam
            </h2>
            <p className="text-xs md:text-sm text-[var(--m-muted)] mt-1">
              Checklist operasional resmi: Sesi rekognisi atlet, Technical Meeting, kalibrasi sensor touchpad, inspeksi tali lintasan, hingga sign-off Technical Delegate.
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="gap-2 rounded-xl border-[var(--m-border)] bg-white hover:bg-slate-50 text-[var(--m-ink)]"
            >
              <Printer className="h-4 w-4 text-[var(--m-aqua-ink)]" />
              Cetak Berita Acara
            </Button>
            <Button
              size="sm"
              onClick={() => setShowAddModal(true)}
              className="gap-2 rounded-xl bg-[var(--m-aqua)] hover:bg-[var(--m-aqua-ink)] text-white shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Tambah Item
            </Button>
          </div>
        </div>

        {/* Meter & Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2">
          <div className="rounded-xl border border-[var(--m-border)] bg-white p-3.5 shadow-2xs">
            <p className="text-[11px] font-semibold text-[var(--m-muted)] uppercase tracking-wide">
              Total Checklist
            </p>
            <p className="text-2xl font-black text-[var(--m-ink)] mt-0.5 tabular-nums">
              {stats.total}
            </p>
            <p className="text-[10px] text-slate-500 mt-1">Item inspeksi arena</p>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-2xs">
            <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">
              Selesai / Terverifikasi
            </p>
            <p className="text-2xl font-black text-emerald-950 mt-0.5 tabular-nums">
              {stats.completedOrVerified}
            </p>
            <p className="text-[10px] text-emerald-800 mt-1">Telah diuji &amp; disahkan</p>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-2xs">
            <p className="text-[11px] font-semibold text-amber-800 uppercase tracking-wide">
              Sedang Proses
            </p>
            <p className="text-2xl font-black text-amber-950 mt-0.5 tabular-nums">
              {stats.inProgress}
            </p>
            <p className="text-[10px] text-amber-800 mt-1">Dalam pengerjaan tim</p>
          </div>

          <div className="rounded-xl border border-[var(--m-border)] bg-white p-3.5 shadow-2xs">
            <p className="text-[11px] font-semibold text-[var(--m-muted)] uppercase tracking-wide">
              Tingkat Kesiapan
            </p>
            <p className="text-2xl font-black text-[var(--m-aqua-ink)] mt-0.5 tabular-nums">
              {stats.percentage}%
            </p>
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className="bg-[var(--m-aqua)] h-1.5 rounded-full transition-all duration-500"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar (Hidden on print) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 print:hidden">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={cn(
              'px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer',
              selectedCategory === 'all'
                ? 'bg-[var(--m-aqua)] text-white border-[var(--m-aqua)] shadow-2xs'
                : 'bg-white text-[var(--m-ink)] border-[var(--m-border)] hover:bg-slate-50'
            )}
          >
            Semua ({items.length})
          </button>
          {Object.entries(CATEGORY_MAP).map(([key, info]) => {
            const count = items.filter((i) => i.category === key).length;
            const isSelected = selectedCategory === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedCategory(key)}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer',
                  isSelected
                    ? 'bg-[var(--m-aqua-ink)] text-white border-[var(--m-aqua-ink)] shadow-2xs'
                    : 'bg-white text-[var(--m-ink)] border-[var(--m-border)] hover:bg-slate-50'
                )}
              >
                {info.label} ({count})
              </button>
            );
          })}
        </div>

        {/* Search input & status filter */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[var(--m-muted)]" />
            <Input
              type="text"
              placeholder="Cari item checklist..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 text-xs rounded-xl border-[var(--m-border)] bg-white text-[var(--m-ink)]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="h-9 px-3 text-xs font-semibold rounded-xl border border-[var(--m-border)] bg-white text-[var(--m-ink)] outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Belum Selesai</option>
            <option value="in_progress">Sedang Proses</option>
            <option value="completed">Selesai</option>
            <option value="verified">Terverifikasi TD</option>
          </select>
        </div>
      </div>

      {/* Print Document Official Header (Only visible when printing) */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/brand/logo.png" alt="Logo" className="h-12 w-auto object-contain" />
            <div>
              <h1 className="text-base font-black text-slate-950 uppercase tracking-tight">
                RAJENDRA SWIM SYSTEM
              </h1>
              <p className="text-xs font-bold text-slate-800">
                BERITA ACARA &amp; DAFTAR KESIAPAN TEKNIS ARENA (OFFICIAL TECHNICAL CHECKLIST)
              </p>
              <p className="text-[10px] text-slate-600">
                Standar Regulasi Perlombaan Akuatik Nasional
              </p>
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-700">
            <p><b>Tanggal Cetak:</b> {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}</p>
            <p><b>Status Verifikasi:</b> {stats.percentage}% Kesiapan Siap Lomba</p>
          </div>
        </div>
      </div>

      {/* Checklist Items Container */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={<Waves className="h-8 w-8 text-primary" />}
          title="Tidak Ada Item Checklist"
          description="Tidak ada item yang cocok dengan filter atau kata kunci pencarian Anda."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCategory('all');
                setSelectedStatus('all');
                setSearchQuery('');
              }}
            >
              Reset Filter
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item, idx) => {
            const isUpdating = updatingId === item.id;
            const categoryInfo = CATEGORY_MAP[item.category] || {
              label: item.category,
              color: 'bg-slate-100 text-slate-800 border-slate-300',
            };
            const statusInfo = STATUS_MAP[item.status] || STATUS_MAP.pending;
            const isDone = item.status === 'completed' || item.status === 'verified';
            const isVerified = item.status === 'verified';

            return (
              <div
                key={item.id}
                className={cn(
                  'rounded-2xl border transition-all bg-white p-4 md:p-5 shadow-2xs print:shadow-none print:border-slate-300 print:rounded-none print:p-3',
                  isVerified
                    ? 'border-blue-300/80 bg-blue-50/20'
                    : isDone
                    ? 'border-emerald-200 bg-emerald-50/20'
                    : 'border-[var(--m-border)] hover:border-slate-300'
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    {/* Interactive Checkbox Button */}
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => handleQuickStatusChange(item)}
                      title="Klik untuk ubah status checklist"
                      className={cn(
                        'mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border transition-all cursor-pointer print:border-slate-800',
                        isVerified
                          ? 'bg-blue-600 border-blue-600 text-white shadow-2xs'
                          : isDone
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-2xs'
                          : 'bg-white border-slate-300 hover:border-slate-500 text-transparent'
                      )}
                    >
                      {isUpdating ? (
                        <BrandedSpinner className="h-3.5 w-3.5 text-slate-600" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4" />
                      )}
                    </button>

                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-400">
                          #{idx + 1}
                        </span>
                        <h3
                          className={cn(
                            'text-sm md:text-base font-bold text-[var(--m-ink)] leading-snug',
                            isDone && 'line-through decoration-slate-400/60 text-slate-600'
                          )}
                        >
                          {item.title}
                        </h3>

                        {/* Category Badge */}
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] font-semibold py-0 px-2 rounded-md', categoryInfo.color)}
                        >
                          {categoryInfo.label}
                        </Badge>

                        {/* Status Badge */}
                        <Badge
                          variant="outline"
                          className={cn('text-[10px] font-semibold py-0 px-2 rounded-md', statusInfo.badgeClass)}
                        >
                          {statusInfo.label}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed pr-2">
                        {item.description}
                      </p>

                      {/* Metadata row */}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-1 text-[11px] text-[var(--m-muted)]">
                        {item.scheduledTime && (
                          <span className="inline-flex items-center gap-1 font-medium text-slate-700">
                            <Clock className="h-3 w-3 text-sky-600" />
                            {item.scheduledTime}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-rose-500" />
                          {item.location}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <UserCheck className="h-3 w-3 text-indigo-500" />
                          PIC: <b className="font-semibold text-slate-700">{item.pic}</b>
                        </span>

                        {item.verifiedBy && (
                          <span className="inline-flex items-center gap-1 text-blue-700 font-medium">
                            <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                            Verifikasi: {item.verifiedBy}
                          </span>
                        )}
                      </div>

                      {/* Notes Box */}
                      {item.notes && (
                        <div className="mt-2 rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 text-xs text-slate-700 flex items-start gap-2">
                          <FileText className="h-3.5 w-3.5 text-slate-400 mt-0.5 shrink-0" />
                          <div className="space-y-0.5">
                            <span className="font-bold text-[11px] text-slate-800">Catatan Lapangan:</span>
                            <p className="text-slate-600 text-xs italic">{item.notes}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions Column (Hidden on print) */}
                  <div className="flex items-center gap-1.5 shrink-0 print:hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleOpenNote(item)}
                      className="text-xs h-8 px-2.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                      title="Tambah / Ubah Catatan"
                    >
                      Catatan
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Print Document Official Footer Signatures */}
      <div className="hidden print:block pt-8 mt-8 border-t border-slate-300">
        <p className="text-xs text-slate-600 mb-6 text-center italic">
          Demikian Berita Acara &amp; Daftar Kesiapan Teknis Pertandingan ini disahkan bersama oleh Technical Delegate dan Panitia Pelaksana.
        </p>
        <div className="grid grid-cols-2 gap-12 text-center text-xs">
          <div>
            <p className="text-slate-600">Mengetahui,</p>
            <p className="font-bold text-slate-950 mt-1">Meet Director (Ketua Panitia)</p>
            <div className="h-20" />
            <p className="font-bold text-slate-950 underline">( .................................................... )</p>
            <p className="text-[10px] text-slate-500">Panitia Pelaksana Rajendra SCMS</p>
          </div>
          <div>
            <p className="text-slate-600">Disahkan oleh,</p>
            <p className="font-bold text-slate-950 mt-1">Technical Delegate (TD)</p>
            <div className="h-20" />
            <p className="font-bold text-slate-950 underline">Drs. H. Bambang Subagyo</p>
            <p className="text-[10px] text-slate-500">Pengprov Akuatik Indonesia / WA Ref.</p>
          </div>
        </div>
      </div>

      {/* Modal Edit Note */}
      {activeItemForNote && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-[var(--m-border)] bg-white p-5 shadow-pop space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-[var(--m-ink)]">
                  Catatan Teknis Lapangan
                </h3>
                <p className="text-xs text-[var(--m-muted)] truncate max-w-xs">
                  {activeItemForNote.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveItemForNote(null)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">
                Catatan / Keterangan Kondisi Lapangan:
              </label>
              <textarea
                rows={4}
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                placeholder="Contoh: Suhu air 26.5°C terukur stabil, sensor touchpad lane 4 normal..."
                className="w-full rounded-xl border border-[var(--m-border)] bg-white p-3 text-xs text-[var(--m-ink)] focus:border-[var(--m-aqua)] focus:ring-2 focus:ring-[var(--m-aqua-soft)] outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActiveItemForNote(null)}
                className="text-xs rounded-xl"
              >
                Batal
              </Button>
              <Button
                size="sm"
                disabled={savingNote}
                onClick={handleSaveNote}
                className="text-xs rounded-xl bg-[var(--m-aqua)] hover:bg-[var(--m-aqua-ink)] text-white"
              >
                {savingNote ? <BrandedSpinner className="h-3.5 w-3.5 text-white" /> : 'Simpan Catatan'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Add Checklist Item */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-lg rounded-2xl border border-[var(--m-border)] bg-white p-6 shadow-pop space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-[var(--m-ink)]">
                  Tambah Item Checklist Teknis
                </h3>
                <p className="text-xs text-[var(--m-muted)]">
                  Tambahkan agenda rekognisi kolam atau pengecekan arena lomba.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800">
                  Judul Checklist <span className="text-rose-500">*</span>
                </label>
                <Input
                  required
                  placeholder="Contoh: Uji Coba Lampu Arena Malam Sesi 2"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl border-[var(--m-border)] bg-white text-xs text-[var(--m-ink)]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800">Deskripsi / Ruang Lingkup</label>
                <textarea
                  rows={2}
                  placeholder="Penjelasan detail pengujian atau prosedur inspeksi..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full rounded-xl border border-[var(--m-border)] bg-white p-2.5 text-xs text-[var(--m-ink)] focus:border-[var(--m-aqua)] outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800">Kategori</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ChecklistCategory)}
                    className="w-full h-9 rounded-xl border border-[var(--m-border)] bg-white px-3 text-xs text-[var(--m-ink)] outline-none"
                  >
                    {Object.entries(CATEGORY_MAP).map(([val, info]) => (
                      <option key={val} value={val}>
                        {info.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800">Jadwal Pelaksanaan</label>
                  <Input
                    placeholder="Contoh: 06:00 - 07:30 WIB"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="rounded-xl border-[var(--m-border)] bg-white text-xs text-[var(--m-ink)]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800">Lokasi Arena</label>
                  <Input
                    placeholder="Contoh: Kolam Pemanasan / Call Room"
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="rounded-xl border-[var(--m-border)] bg-white text-xs text-[var(--m-ink)]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-800">Penanggung Jawab (PIC)</label>
                  <Input
                    placeholder="Contoh: Technical Delegate / Starter"
                    value={newPic}
                    onChange={(e) => setNewPic(e.target.value)}
                    className="rounded-xl border-[var(--m-border)] bg-white text-xs text-[var(--m-ink)]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-800">Catatan Awal (Opsional)</label>
                <Input
                  placeholder="Catatan tambahan teknis..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="rounded-xl border-[var(--m-border)] bg-white text-xs text-[var(--m-ink)]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddModal(false)}
                  className="text-xs rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={savingNewItem}
                  className="text-xs rounded-xl bg-[var(--m-aqua)] hover:bg-[var(--m-aqua-ink)] text-white"
                >
                  {savingNewItem ? <BrandedSpinner className="h-3.5 w-3.5 text-white" /> : 'Simpan Item'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
