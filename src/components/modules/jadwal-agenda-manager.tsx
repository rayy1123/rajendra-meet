'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  MapPin,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  PlayCircle,
  Sparkles,
  Tag,
  Filter,
  Printer,
  ChevronRight,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { BrandedSpinner } from '@/components/ui/branded-loading';
import { type ScheduleItem } from '@/lib/data/schedules-server';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export function JadwalAgendaManager({
  initialSchedules,
  events = [],
}: {
  initialSchedules: ScheduleItem[];
  events?: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [schedules, setSchedules] = useState<ScheduleItem[]>(initialSchedules);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedEventId, setSelectedEventId] = useState<string>('all');

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form State
  const [time, setTime] = useState('');
  const [category, setCategory] = useState('Sesi Lomba');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<'upcoming' | 'ongoing' | 'completed'>('upcoming');
  const [eventId, setEventId] = useState('');

  const openAddModal = () => {
    setEditingItem(null);
    setTime('08:00');
    setCategory('Sesi Lomba');
    setTitle('');
    setDescription('');
    setLocation('Kolam Utama (50M)');
    setStatus('upcoming');
    setEventId(events[0]?.id || '');
    setShowModal(true);
  };

  const openEditModal = (item: ScheduleItem) => {
    setEditingItem(item);
    setTime(item.time);
    setCategory(item.category);
    setTitle(item.title);
    setDescription(item.description);
    setLocation(item.location || '');
    setStatus(item.status);
    setEventId(item.eventId || '');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!time.trim() || !title.trim()) {
      toast.error('Waktu dan judul agenda wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/schedules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem?.id,
          time,
          category,
          title,
          description,
          location,
          status,
          eventId: eventId || null,
        }),
      });

      const json = await res.json();
      if (res.ok && json.data) {
        toast.success(editingItem ? 'Agenda berhasil diperbarui.' : 'Agenda baru berhasil dicatat.');
        setSchedules((prev) => {
          if (editingItem) {
            return prev.map((s) => (s.id === json.data.id ? json.data : s));
          }
          return [...prev, json.data].sort((a, b) => a.time.localeCompare(b.time));
        });
        setShowModal(false);
        router.refresh();
      } else {
        toast.error(json.error || 'Gagal menyimpan agenda.');
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Yakin ingin menghapus agenda jadwal ini?')) return;

    setDeletingId(id);
    try {
      const res = await fetch(`/api/schedules?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Agenda berhasil dihapus.');
        setSchedules((prev) => prev.filter((s) => s.id !== id));
        router.refresh();
      } else {
        toast.error('Gagal menghapus agenda.');
      }
    } catch {
      toast.error('Gagal menghubungi server.');
    } finally {
      setDeletingId(null);
    }
  };

  const categories = Array.from(new Set(schedules.map((s) => s.category).filter(Boolean)));

  const filtered = schedules.filter((s) => {
    if (filterStatus !== 'all' && s.status !== filterStatus) return false;
    if (filterCategory !== 'all' && s.category !== filterCategory) return false;
    if (selectedEventId !== 'all' && s.eventId && s.eventId !== selectedEventId) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* ── TOP STATS & QUICK ACTION ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Agenda</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <Calendar className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 font-mono mt-2">{schedules.length}</p>
          <p className="text-[11px] text-slate-500 mt-0.5">Jadwal tercatat di sistem</p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Berlangsung (Live)</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <PlayCircle className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-amber-600 font-mono mt-2">
            {schedules.filter((s) => s.status === 'ongoing').length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Sesi aktif saat ini</p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Akan Datang</span>
            <span className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
              <Clock className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-cyan-700 font-mono mt-2">
            {schedules.filter((s) => s.status === 'upcoming').length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Menunggu waktu sesi</p>
        </div>

        <div className="p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Selesai</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-600 font-mono mt-2">
            {schedules.filter((s) => s.status === 'completed').length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Tahap terselesaikan</p>
        </div>
      </div>

      {/* ── FILTER & ACTION TOOLBAR ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 bg-white shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5 mr-1">
            <Filter className="h-3.5 w-3.5 text-blue-600" /> Filter:
          </span>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="all">Semua Status</option>
            <option value="ongoing">Berlangsung (Live)</option>
            <option value="upcoming">Akan Datang</option>
            <option value="completed">Selesai</option>
          </select>

          {categories.length > 0 && (
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          )}

          {events.length > 0 && (
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="h-9 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none focus:border-blue-500 max-w-[200px] truncate"
            >
              <option value="all">Semua Event Kejuaraan</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => window.print()}
            className="h-9 px-3 gap-1.5 text-xs font-bold border-slate-200"
            title="Cetak Jadwal Acara"
          >
            <Printer className="h-3.5 w-3.5" /> Cetak
          </Button>

          <Button
            onClick={openAddModal}
            className="h-9 px-4 gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-2xs"
          >
            <Plus className="h-4 w-4" /> Catat Agenda Baru
          </Button>
        </div>
      </div>

      {/* ── TIMELINE LIST ── */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<Calendar className="h-6 w-6" />}
          title="Belum Ada Agenda Jadwal"
          description="Catat jadwal acara pertandingan, technical meeting, dan pemanasan atlet untuk ditampilkan pada dasbor panitia."
          action={
            <Button onClick={openAddModal} className="mt-2 text-xs font-bold bg-blue-600 text-white gap-1.5">
              <Plus className="h-4 w-4" /> Tambah Agenda Sekarang
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((item, idx) => {
            const isOngoing = item.status === 'ongoing';
            const isCompleted = item.status === 'completed';

            return (
              <div
                key={item.id || idx}
                className={cn(
                  'rounded-2xl border p-4 sm:p-5 transition-all shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4',
                  isOngoing
                    ? 'border-amber-300 bg-gradient-to-r from-amber-50/70 via-white to-orange-50/40 ring-1 ring-amber-300'
                    : isCompleted
                    ? 'border-slate-200 bg-slate-50/60 opacity-80'
                    : 'border-slate-200 bg-white hover:border-blue-300'
                )}
              >
                <div className="flex items-start gap-3.5 min-w-0">
                  {/* Waktu Badge */}
                  <div
                    className={cn(
                      'flex flex-col items-center justify-center rounded-xl p-2.5 min-w-[72px] text-center border font-mono shrink-0 shadow-2xs',
                      isOngoing
                        ? 'bg-amber-500 text-white border-amber-600'
                        : isCompleted
                        ? 'bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-blue-50 text-blue-900 border-blue-200'
                    )}
                  >
                    <span className="text-sm font-black tracking-tight">{item.time}</span>
                    <span className="text-[9px] font-bold uppercase opacity-85">WIB</span>
                  </div>

                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200">
                        {item.category}
                      </span>

                      {isOngoing && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-amber-600 animate-ping" />
                          SEDANG BERLANGSUNG
                        </span>
                      )}

                      {isCompleted && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-slate-600 bg-slate-200">
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" /> Selesai
                        </span>
                      )}
                    </div>

                    <h3 className="font-heading font-black text-base text-slate-900 truncate">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                        {item.description}
                      </p>
                    )}

                    {item.location && (
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 pt-0.5">
                        <MapPin className="h-3 w-3 text-blue-600 shrink-0" />
                        <span className="font-semibold text-slate-700">{item.location}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditModal(item)}
                    className="h-8 px-2.5 gap-1 text-xs border-slate-300 hover:bg-slate-50"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={deletingId === item.id}
                    onClick={() => handleDelete(item.id)}
                    className="h-8 px-2.5 text-xs text-red-600 border-red-200 hover:bg-red-50"
                  >
                    {deletingId === item.id ? <BrandedSpinner className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── MODAL TAMBAH / EDIT AGENDA ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleSave}
            className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingItem ? 'Edit Agenda Acara' : 'Catat Agenda Jadwal Baru'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Timeline operasional dan rundown kejuaraan</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Waktu Pelaksanaan *</label>
                  <Input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="h-10 text-xs rounded-xl font-mono font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Kategori / Tahap *</label>
                  <Input
                    type="text"
                    required
                    placeholder="Contoh: Sesi Lomba / Technical Meeting"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Judul Agenda Kegiatan *</label>
                <Input
                  type="text"
                  required
                  placeholder="Contoh: Sesi 1: Nomor 50m Gaya Bebas & Dada"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="h-10 text-xs rounded-xl font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Keterangan / Rincian Acara</label>
                <textarea
                  rows={3}
                  placeholder="Rincian acara, scratch batas waktu, atau kelompok umur yang berlomba..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-blue-500 leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Lokasi / Venue</label>
                  <Input
                    type="text"
                    placeholder="Contoh: Ruang Media / Kolam Senayan"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="h-10 text-xs rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-900">Status Agenda</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 outline-none focus:border-blue-500"
                  >
                    <option value="upcoming">Akan Datang</option>
                    <option value="ongoing">Sedang Berlangsung (Live)</option>
                    <option value="completed">Selesai</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowModal(false)}
                className="h-9 px-3 text-xs"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="h-9 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                {saving ? <BrandedSpinner className="h-3.5 w-3.5" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
                Simpan Agenda
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
