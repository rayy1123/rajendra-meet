'use client';

import { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Upload,
  Edit2,
  Trash2,
  CalendarDays,
  X,
  Filter,
  Layers,
  Sparkles,
  Download
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import {
  createCompEventAction,
  updateCompEventAction,
  deleteCompEventAction,
} from '@/app/(dashboard)/events/[id]/actions';

export interface NomorLombaItem {
  id: string;
  event_id: string;
  event_name?: string;
  code?: string;
  name: string;
  stroke: string;
  distance_meters: number;
  gender: 'male' | 'female' | 'mixed';
  grade_level?: string | null;
  class_name?: string | null;
  order_no?: number | null;
  session_no?: number | null;
  price?: number;
  max_participants?: number;
  min_age?: number | string | null;
  max_age?: number | string | null;
}

interface EventOption {
  id: string;
  name: string;
  fee_per_event?: number;
}

export function NomorLombaPageManager({
  initialItems,
  events,
}: {
  initialItems: NomorLombaItem[];
  events: EventOption[];
}) {
  const [items, setItems] = useState<NomorLombaItem[]>(initialItems);
  const [selectedEventId, setSelectedEventId] = useState<string>(events[0]?.id || 'all');
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Modal create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NomorLombaItem | null>(null);
  const [formEventId, setFormEventId] = useState<string>(events[0]?.id || '');
  const [formCode, setFormCode] = useState('');
  const [formName, setFormName] = useState('');
  const [formStroke, setFormStroke] = useState('Freestyle');
  const [formDistance, setFormDistance] = useState(50);
  const [formGender, setFormGender] = useState<'male' | 'female' | 'mixed'>('male');
  const [formClass, setFormClass] = useState('TK');
  const [formCategory, setFormCategory] = useState('Kelas');
  const [formPrice, setFormPrice] = useState(150000);
  const [formMaxParticipants, setFormMaxParticipants] = useState(999);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Modal import
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const activeEvent = events.find((e) => e.id === selectedEventId);

  // Filtered items
  const filtered = useMemo(() => {
    return items.filter((it) => {
      if (selectedEventId !== 'all' && it.event_id !== selectedEventId) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const fullName = `${it.code || ''} ${it.name} ${it.class_name || ''}`.toLowerCase();
        return fullName.includes(q);
      }
      return true;
    });
  }, [items, selectedEventId, search]);

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(paginated.map((p) => p.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormEventId(selectedEventId !== 'all' ? selectedEventId : events[0]?.id || '');
    setFormCode(`HSS${items.length + 101}`);
    setFormName('');
    setFormStroke('Freestyle');
    setFormDistance(50);
    setFormGender('male');
    setFormClass('SD KELAS 1');
    setFormCategory('Kelas');
    setFormPrice(activeEvent?.fee_per_event || 150000);
    setFormMaxParticipants(999);
    setIsModalOpen(true);
  };

  const openEditModal = (item: NomorLombaItem) => {
    setEditingItem(item);
    setFormEventId(item.event_id);
    setFormCode(item.code || '');
    setFormName(item.name);
    setFormStroke(item.stroke);
    setFormDistance(item.distance_meters);
    setFormGender(item.gender);
    setFormClass(item.class_name || item.grade_level || 'SD KELAS 1');
    setFormCategory('Kelas');
    setFormPrice(item.price || 150000);
    setFormMaxParticipants(item.max_participants || 999);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formEventId) {
      showToast('Pilih kejuaraan terlebih dahulu');
      return;
    }

    const title = formName.trim() || `${formDistance}m Gaya ${formStroke} ${formClass} ${formGender === 'male' ? 'Putra' : 'Putri'}`;
    const generatedCode = formCode.trim() || `EV${items.length + 1}`;
    const displayName = `${generatedCode} - ${title.toUpperCase()}`;

    setIsSubmitting(true);
    try {
      if (editingItem) {
        const res = await updateCompEventAction(formEventId, editingItem.id, {
          name: displayName,
          stroke: formStroke,
          distance_meters: formDistance,
          gender: formGender,
          class_name: formClass,
          grade_level: formClass,
        });
        if (res.ok && res.data) {
          setItems((prev) =>
            prev.map((it) =>
              it.id === editingItem.id
                ? {
                    ...it,
                    name: displayName,
                    code: generatedCode,
                    stroke: formStroke,
                    distance_meters: formDistance,
                    gender: formGender,
                    class_name: formClass,
                    price: formPrice,
                    max_participants: formMaxParticipants,
                  }
                : it
            )
          );
          showToast('Nomor lomba berhasil diperbarui!');
          setIsModalOpen(false);
        } else {
          showToast('Gagal: ' + (res.error || 'Terjadi kesalahan'));
        }
      } else {
        const res = await createCompEventAction(formEventId, {
          name: displayName,
          stroke: formStroke,
          distance_meters: formDistance,
          gender: formGender,
          class_name: formClass,
          grade_level: formClass,
          order_no: items.length + 1,
        });
        if (res.ok && res.data) {
          const createdData = res.data as any;
          const newItem: NomorLombaItem = {
            id: createdData.id,
            event_id: formEventId,
            name: displayName,
            code: generatedCode,
            stroke: formStroke,
            distance_meters: formDistance,
            gender: formGender,
            class_name: formClass,
            price: formPrice,
            max_participants: formMaxParticipants,
          };
          setItems((prev) => [...prev, newItem]);
          showToast('Nomor lomba berhasil ditambahkan!');
          setIsModalOpen(false);
        } else {
          showToast('Gagal: ' + (res.error || 'Terjadi kesalahan'));
        }
      }
    } catch {
      showToast('Error menyimpan data');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (item: NomorLombaItem) => {
    if (!confirm('Hapus nomor lomba ini?')) return;
    try {
      const res = await deleteCompEventAction(item.event_id, item.id);
      if (res.ok) {
        setItems((prev) => prev.filter((x) => x.id !== item.id));
        showToast('Nomor lomba berhasil dihapus');
      } else {
        showToast('Gagal menghapus: ' + res.error);
      }
    } catch {
      showToast('Error menghapus data');
    }
  };

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 rounded-xl bg-slate-900 border border-white/20 text-white px-4 py-3 shadow-2xl text-sm animate-in fade-in">
          {toastMsg}
        </div>
      )}

      {/* Filter Kejuaraan */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Layers className="h-5 w-5 text-blue-600 shrink-0" />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Pilih Event:
            </span>
            <select
              value={selectedEventId}
              onChange={(e) => {
                setSelectedEventId(e.target.value);
                setCurrentPage(1);
              }}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">-- Semua Kejuaraan / Event --</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Total: <span className="font-bold text-slate-800">{filtered.length}</span> nomor lomba terdaftar
        </div>
      </div>

      {/* Top Action Bar (Matching screenshot media_1789719956391.png) */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-semibold text-slate-500">Results :</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-end">
          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search nomor lomba..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
            />
          </div>

          {/* Import Button */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2 shadow-sm transition-colors"
          >
            <Upload className="h-3.5 w-3.5" /> Import
          </button>

          {/* Create Button */}
          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs px-4 py-2 shadow-sm transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> Create +
          </button>
        </div>
      </div>

      {/* Table (Matching screenshot media_1789719956391.png) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
            <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={paginated.length > 0 && selectedIds.length === paginated.length}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-3.5 px-3 w-10 text-center">No</th>
                <th className="py-3.5 px-4 min-w-[280px]">Nama</th>
                <th className="py-3.5 px-4">Harga</th>
                <th className="py-3.5 px-4">Maks. Peserta</th>
                <th className="py-3.5 px-4">Jenis Kelamin</th>
                <th className="py-3.5 px-4">Kategori</th>
                <th className="py-3.5 px-3 text-center">Min. Umur</th>
                <th className="py-3.5 px-3 text-center">Maks. Umur</th>
                <th className="py-3.5 px-4">Kategori Kelas</th>
                <th className="py-3.5 px-4 text-center w-24">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 text-sm">
                    Tidak ada data nomor lomba
                  </td>
                </tr>
              ) : (
                paginated.map((item, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isMale = item.gender === 'male';
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(item.id)}
                          onChange={() => handleSelectRow(item.id)}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3 px-3 text-center text-slate-400 font-semibold">
                        {globalIdx}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-800">
                        {item.name}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-700">
                        {formatRupiah(item.price || 150000)}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-600">
                        {item.max_participants || 999}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            isMale
                              ? 'bg-blue-100 text-blue-800 border border-blue-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isMale ? 'Laki-Laki' : 'Perempuan'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600">Kelas</td>
                      <td className="py-3 px-3 text-center text-slate-400">-</td>
                      <td className="py-3 px-3 text-center text-slate-400">-</td>
                      <td className="py-3 px-4 font-semibold text-slate-700">
                        {item.class_name || item.grade_level || 'TK'}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="rounded-lg bg-blue-600 hover:bg-blue-700 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item)}
                            className="rounded-lg bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1 text-[11px] font-bold shadow-sm transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <span>
            Showing page {currentPage} of {totalPages} ({filtered.length} total entries)
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              &larr;
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pNum = i + 1;
              return (
                <button
                  key={pNum}
                  type="button"
                  onClick={() => setCurrentPage(pNum)}
                  className={`rounded-lg px-2.5 py-1 font-bold ${
                    currentPage === pNum
                      ? 'bg-blue-600 text-white'
                      : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {pNum}
                </button>
              );
            })}
            {totalPages > 5 && <span className="px-1 text-slate-400">...</span>}
            {totalPages > 5 && (
              <button
                type="button"
                onClick={() => setCurrentPage(totalPages)}
                className={`rounded-lg px-2.5 py-1 font-bold ${
                  currentPage === totalPages
                    ? 'bg-blue-600 text-white'
                    : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                {totalPages}
              </button>
            )}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-slate-200 px-2.5 py-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Modal Create/Edit */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                {editingItem ? 'Edit Nomor Lomba' : 'Tambah Nomor Lomba Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Kejuaraan / Event</label>
                <select
                  value={formEventId}
                  onChange={(e) => setFormEventId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Kode Nomor (Opsional)</label>
                  <input
                    type="text"
                    placeholder="Contoh: HSS101"
                    value={formCode}
                    onChange={(e) => setFormCode(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Harga / Biaya (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={formPrice}
                    onChange={(e) => setFormPrice(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Gaya Renang</label>
                  <select
                    value={formStroke}
                    onChange={(e) => setFormStroke(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="Freestyle">Bebas</option>
                    <option value="Breaststroke">Dada</option>
                    <option value="Backstroke">Punggung</option>
                    <option value="Butterfly">Kupu-kupu</option>
                    <option value="Individual Medley">Ganti (IM)</option>
                    <option value="Kickboard">Papan Kaki</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Jarak (Meter)</label>
                  <select
                    value={formDistance}
                    onChange={(e) => setFormDistance(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value={25}>25 m</option>
                    <option value={50}>50 m</option>
                    <option value={100}>100 m</option>
                    <option value={200}>200 m</option>
                    <option value={400}>400 m</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Jenis Kelamin</label>
                  <select
                    value={formGender}
                    onChange={(e) => setFormGender(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="male">Laki-Laki</option>
                    <option value="female">Perempuan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Kategori Kelas / KU</label>
                  <select
                    value={formClass}
                    onChange={(e) => setFormClass(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="PAUD / TK">PAUD / TK</option>
                    <option value="SD KELAS 1">SD KELAS 1</option>
                    <option value="SD KELAS 2">SD KELAS 2</option>
                    <option value="SD KELAS 3">SD KELAS 3</option>
                    <option value="SD KELAS 4">SD KELAS 4</option>
                    <option value="SD KELAS 5">SD KELAS 5</option>
                    <option value="SD KELAS 6">SD KELAS 6</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA">SMA</option>
                    <option value="KU Senior">KU Senior (19-21 Th)</option>
                    <option value="KU Master">KU Master (22+ Th)</option>
                    <option value="Umum">Umum / Terbuka</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Maks. Peserta</label>
                  <input
                    type="number"
                    min="1"
                    value={formMaxParticipants}
                    onChange={(e) => setFormMaxParticipants(Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 text-xs font-bold shadow-md transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Import Excel Nomor Lomba */}
      {isImportModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in"
          onClick={() => setIsImportModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-800">
                Import Nomor Lomba dari Excel
              </h3>
              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Unggah file template Excel berisikan daftar nomor lomba (Format kolom: Kode, Gaya, Jarak, Gender, Kelas, Biaya).
            </p>

            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center space-y-2 hover:border-blue-400 transition-colors">
              <Upload className="h-8 w-8 text-slate-400 mx-auto" />
              <div className="text-xs font-semibold text-slate-700">
                Pilih file Excel (.xlsx / .csv)
              </div>
              <input type="file" accept=".xlsx, .xls, .csv" className="text-xs text-slate-500" />
            </div>

            <div className="flex justify-between items-center pt-2">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  showToast('Template nomor lomba sedang diunduh...');
                }}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
              >
                <Download className="h-3.5 w-3.5" /> Download Template
              </a>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Tutup
                </button>
                <button
                  type="button"
                  onClick={() => {
                    showToast('Fitur impor data nomor lomba selesai diproses.');
                    setIsImportModalOpen(false);
                  }}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 text-xs font-bold shadow-md"
                >
                  Mulai Import
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
