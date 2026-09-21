'use client';

import { useState, useMemo } from 'react';
import {
  DollarSign,
  Plus,
  Search,
  Calendar,
  Filter,
  Trash2,
  Edit2,
  X,
  Building2,
  TrendingDown,
  Receipt
} from 'lucide-react';
import { Expense, ExpenseCategory } from '@/types/database';
import { formatRupiah } from '@/lib/utils';

interface EventOption {
  id: string;
  name: string;
}

interface ExpensesManagerProps {
  initialExpenses: Expense[];
  events: EventOption[];
}

const CATEGORY_LABELS: Record<string, string> = {
  operasional: 'Operasional',
  medali_piala: 'Medali & Piala',
  juri_wasit: 'Honor Juri & Wasit',
  sewa_kolam: 'Sewa Kolam & Fasilitas',
  konsumsi: 'Konsumsi Tim & Panitia',
  cetak_banner: 'Cetak Banner & Backdrop',
  lainnya: 'Lain-lain',
};

export function ExpensesManager({ initialExpenses, events }: ExpensesManagerProps) {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses);
  const [search, setSearch] = useState('');
  const [period, setPeriod] = useState<'harian' | 'bulanan' | 'tahunan' | 'semua'>('semua');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedEventId, setSelectedEventId] = useState<string>('all');

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formEventId, setFormEventId] = useState('');
  const [formType, setFormType] = useState<ExpenseCategory>('operasional');
  const [formAmount, setFormAmount] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().slice(0, 10));
  const [formDescription, setFormDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const openAddModal = () => {
    setEditingId(null);
    setFormEventId(events[0]?.id || '');
    setFormType('operasional');
    setFormAmount('');
    setFormDate(new Date().toISOString().slice(0, 10));
    setFormDescription('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: Expense) => {
    setEditingId(item.id);
    setFormEventId(item.event_id || '');
    setFormType((item.type as ExpenseCategory) || 'operasional');
    setFormAmount(String(item.amount));
    setFormDate(item.expense_date);
    setFormDescription(item.description);
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formAmount || Number(formAmount) <= 0) {
      showToast('Jumlah pengeluaran harus lebih dari 0');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        id: editingId || undefined,
        event_id: formEventId || null,
        type: formType,
        amount: Number(formAmount),
        expense_date: formDate,
        description: formDescription,
      };

      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success && data.item) {
        if (editingId) {
          setExpenses((prev) => prev.map((x) => (x.id === editingId ? data.item : x)));
          showToast('Pengeluaran berhasil diperbarui!');
        } else {
          setExpenses((prev) => [data.item, ...prev]);
          showToast('Pengeluaran berhasil ditambahkan!');
        }
        setIsModalOpen(false);
      } else {
        showToast('Gagal menyimpan: ' + (data.error || 'Terjadi kesalahan'));
      }
    } catch {
      showToast('Error menyimpan pengeluaran');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus catatan pengeluaran ini?')) return;
    try {
      const res = await fetch(`/api/expenses?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setExpenses((prev) => prev.filter((x) => x.id !== id));
        showToast('Pengeluaran berhasil dihapus!');
      }
    } catch {
      showToast('Gagal menghapus pengeluaran');
    }
  };

  // Filter logic
  const filteredExpenses = useMemo(() => {
    return expenses.filter((item) => {
      // Event filter
      if (selectedEventId !== 'all' && item.event_id !== selectedEventId) {
        return false;
      }
      // Period filter
      if (period === 'harian' && item.expense_date !== selectedDate) {
        return false;
      }
      if (period === 'bulanan' && item.expense_date.slice(0, 7) !== selectedDate.slice(0, 7)) {
        return false;
      }
      if (period === 'tahunan' && item.expense_date.slice(0, 4) !== selectedDate.slice(0, 4)) {
        return false;
      }
      // Search filter
      if (search.trim()) {
        const q = search.toLowerCase();
        const evName = events.find((e) => e.id === item.event_id)?.name.toLowerCase() || '';
        const typeLabel = (CATEGORY_LABELS[item.type] || item.type).toLowerCase();
        const desc = (item.description || '').toLowerCase();
        return evName.includes(q) || typeLabel.includes(q) || desc.includes(q);
      }
      return true;
    });
  }, [expenses, selectedEventId, period, selectedDate, search, events]);

  // Total amount
  const totalAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  }, [filteredExpenses]);

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 rounded-xl bg-slate-900 border border-white/20 text-white px-4 py-3 shadow-2xl text-sm animate-in fade-in">
          {toastMsg}
        </div>
      )}

      {/* 1. Filter Header Bar (Mirip screenshot media_1789719805209.png) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Periode :</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="block w-40 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="semua">Semua Periode</option>
              <option value="harian">Harian</option>
              <option value="bulanan">Bulanan</option>
              <option value="tahunan">Tahunan</option>
            </select>
          </div>

          {period !== 'semua' && (
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500">Tanggal :</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="block w-44 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>
          )}

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Kejuaraan / Event :</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="block w-56 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">Semua Event</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Total Card (Mirip screenshot: Laba Kotor / Total Pengeluaran merah) */}
      <div className="rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 text-white p-6 shadow-md max-w-md">
        <span className="text-xs font-medium uppercase tracking-wider text-rose-100">
          Total Pengeluaran (Expenses)
        </span>
        <div className="mt-2 text-3xl font-black tracking-tight">
          {formatRupiah(totalAmount)}
        </div>
        <p className="mt-1 text-xs text-rose-100/90">
          {filteredExpenses.length} transaksi pengeluaran tercatat
        </p>
      </div>

      {/* 3. Action Bar: Search & Create Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search pengeluaran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
          />
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm px-5 py-2.5 shadow-md transition-colors w-full sm:w-auto"
        >
          <Plus className="h-4 w-4" /> Create Expenses
        </button>
      </div>

      {/* 4. Table */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/80 text-xs font-bold text-slate-600 uppercase border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Event</th>
                <th className="py-3.5 px-4">Type / Kategori</th>
                <th className="py-3.5 px-4">Amount</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4 text-center w-28">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 text-sm">
                    No data available in table
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((item, idx) => {
                  const ev = events.find((e) => e.id === item.event_id);
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-4 text-center text-slate-400 font-semibold">
                        {idx + 1}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-800">
                        {ev?.name || 'Operasional Umum'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                          {CATEGORY_LABELS[item.type] || item.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-rose-600">
                        {formatRupiah(item.amount)}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs">
                        {item.expense_date}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 text-xs max-w-xs truncate">
                        {item.description || '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="h-4 w-4" />
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

        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <span>
            Showing {filteredExpenses.length > 0 ? 1 : 0} to {filteredExpenses.length} of {filteredExpenses.length} entries
          </span>
        </div>
      </div>

      {/* 5. Modal Form Tambah / Edit Pengeluaran */}
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
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? 'Edit Pengeluaran' : 'Tambah Pengeluaran Baru'}
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
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Kejuaraan / Event Terkait</label>
                <select
                  value={formEventId}
                  onChange={(e) => setFormEventId(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                >
                  <option value="">-- Tanpa Event (Operasional Umum) --</option>
                  {events.map((ev) => (
                    <option key={ev.id} value={ev.id}>
                      {ev.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Kategori Pengeluaran</label>
                  <select
                    value={formType}
                    onChange={(e) => setFormType(e.target.value as any)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Jumlah / Nominal (Rp)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1000"
                  placeholder="Contoh: 500000"
                  value={formAmount}
                  onChange={(e) => setFormAmount(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700">Deskripsi / Keterangan</label>
                <textarea
                  rows={3}
                  placeholder="Rincian keperluan pengeluaran..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
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
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Pengeluaran'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
