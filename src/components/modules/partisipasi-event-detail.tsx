'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar,
  MapPin,
  Clock,
  ArrowLeft,
  FileSpreadsheet,
  Printer,
  Search,
  Check,
  Edit2,
  Trash2,
  Trophy,
  Filter,
  Users,
  UserPlus
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Event } from '@/types/database';

export interface ParticipantItem {
  id: string;
  athlete_name: string;
  club_id: string;
  club_name: string;
  comp_event_name: string;
  seed_time?: string | null;
  gender: 'male' | 'female';
}

interface PartisipasiEventDetailProps {
  event: Event & {
    tm_date?: string;
    reg_start_date?: string;
    reg_end_date?: string;
  };
  participants: ParticipantItem[];
  clubs: { id: string; name: string }[];
}

export function PartisipasiEventDetail({
  event,
  participants,
  clubs,
}: PartisipasiEventDetailProps) {
  const [activeTab, setActiveTab] = useState<'detail' | 'susunan' | 'buku_acara' | 'hasil' | 'best_swimmer' | 'juara'>('detail');
  const [selectedClubId, setSelectedClubId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filtered = useMemo(() => {
    return participants.filter((p) => {
      if (selectedClubId !== 'all' && p.club_id !== selectedClubId) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          p.athlete_name.toLowerCase().includes(q) ||
          p.club_name.toLowerCase().includes(q) ||
          p.comp_event_name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [participants, selectedClubId, search]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const handleExportExcel = () => {
    showToast('Mengunduh daftar partisipasi format Excel...');
    const tableHtml = `
      <table border="1">
        <thead>
          <tr style="background-color: #0b1e3b; color: #fff;">
            <th>No</th>
            <th>Nama Peserta</th>
            <th>Klub / Kontingen</th>
            <th>Nomor Lomba</th>
            <th>Gender</th>
          </tr>
        </thead>
        <tbody>
          ${filtered
            .map(
              (p, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${p.athlete_name}</td>
              <td>${p.club_name}</td>
              <td>${p.comp_event_name}</td>
              <td>${p.gender === 'male' ? 'Laki-Laki' : 'Perempuan'}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `partisipasi-${event.name.toLowerCase().replace(/\s+/g, '-')}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {toastMsg && (
        <div className="fixed top-5 right-5 z-50 rounded-xl bg-slate-900 border border-white/20 text-white px-4 py-3 shadow-2xl text-sm animate-in fade-in">
          {toastMsg}
        </div>
      )}

      {/* Top Tabs Bar (Matching screenshot media_1789719753044.png) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-slate-200 gap-4 pb-2 print:hidden">
        <h2 className="text-xl font-black text-slate-900">Perlombaan</h2>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs font-bold text-slate-500">
          <button
            type="button"
            onClick={() => setActiveTab('detail')}
            className={`pb-2 transition-colors ${
              activeTab === 'detail'
                ? 'border-b-2 border-blue-600 text-blue-600 font-bold'
                : 'hover:text-slate-800'
            }`}
          >
            Detail
          </button>
          <Link
            href={`/buku-acara?eventId=${event.id}`}
            className="pb-2 hover:text-slate-800 transition-colors"
          >
            Susunan Acara Lomba
          </Link>
          <Link
            href={`/buku-acara?eventId=${event.id}`}
            className="pb-2 hover:text-slate-800 transition-colors"
          >
            Buku Acara
          </Link>
          <Link
            href={`/results?eventId=${event.id}`}
            className="pb-2 hover:text-slate-800 transition-colors"
          >
            Buku Hasil
          </Link>
          <Link
            href={`/awards?eventId=${event.id}`}
            className="pb-2 hover:text-slate-800 transition-colors"
          >
            Perenang Terbaik
          </Link>
          <Link
            href={`/medals?eventId=${event.id}`}
            className="pb-2 hover:text-slate-800 transition-colors"
          >
            Juara
          </Link>
        </div>
      </div>

      {/* Section 1: Detail Metadata Event (Matching screenshot media_1789719753044.png) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Detail</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs text-slate-600">
          <div className="space-y-1">
            <span className="font-semibold text-slate-400">Nama</span>
            <p className="text-sm font-bold text-slate-900">{event.name}</p>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-slate-400">Perlombaan</span>
            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>{event.start_date}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-slate-400">Lokasi</span>
            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
              <MapPin className="h-4 w-4 text-slate-400" />
              <span>{event.location}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-slate-400">Technical Meeting</span>
            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span>{event.tm_date || event.start_date}</span>
            </div>
          </div>

          <div className="space-y-1">
            <span className="font-semibold text-slate-400">Pendaftaran</span>
            <div className="flex items-center gap-1.5 text-sm font-bold text-slate-800">
              <Clock className="h-4 w-4 text-slate-400" />
              <span>{event.reg_start_date || event.start_date} - {event.reg_end_date || event.end_date}</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 print:hidden">
          <Link
            href="/perlombaan"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 shadow-sm transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Semua Partisipasi
          </Link>
          <Link
            href={`/daftar-lomba/${event.id}`}
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 shadow-sm transition-colors"
          >
            <UserPlus className="h-3.5 w-3.5" /> + Tambah / Daftar Atlet Manual
          </Link>
        </div>
      </div>

      {/* Section 2: Partisipasi Table & Filters (Matching screenshot media_1789719753044.png) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-6">
        <h3 className="text-base font-bold text-slate-900">Partisipasi</h3>

        {/* Filter Club + Export Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 print:hidden">
          <div className="space-y-1.5 w-full sm:w-80">
            <label className="text-xs font-semibold text-slate-500">Filter Berdasarkan Klub:</label>
            <select
              value={selectedClubId}
              onChange={(e) => setSelectedClubId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">-- Semua Klub --</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleExportExcel}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 shadow-sm transition-colors"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
            </button>
            <button
              type="button"
              onClick={handlePrintPDF}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2 shadow-sm transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Cetak PDF
            </button>
          </div>
        </div>

        {/* Search & Entries */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-slate-100 print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <span>Tampilkan</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-bold text-slate-700"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
            <span>data</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
            />
          </div>
        </div>

        {/* Table (Matching screenshot media_1789719753044.png) */}
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
            <thead className="bg-slate-50/80 text-[11px] font-bold text-slate-600 uppercase border-b border-slate-200/80">
              <tr>
                <th className="py-3 px-3 w-10 text-center">
                  <input
                    type="checkbox"
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-4 min-w-[200px]">Nama Peserta</th>
                <th className="py-3 px-4">Klub</th>
                <th className="py-3 px-4">Nomor Lomba</th>
                <th className="py-3 px-3 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 text-sm">
                    Belum ada atlet yang berpartisipasi pada kriteria ini
                  </td>
                </tr>
              ) : (
                paginated.map((item, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="py-3.5 px-3 text-center text-slate-400 font-semibold">
                        {globalIdx}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {item.athlete_name}
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-700">
                        {item.club_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {item.comp_event_name}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => showToast(`Edit peserta: ${item.athlete_name}`)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => showToast(`Hapus partisipasi: ${item.athlete_name}`)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Hapus"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

        {/* Footer Pagination */}
        <div className="flex items-center justify-between text-xs text-slate-500 font-medium print:hidden">
          <span>
            Menampilkan {filtered.length > 0 ? 1 : 0} sampai {Math.min(pageSize, filtered.length)} dari {filtered.length} entri
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="rounded-lg border border-slate-200 px-2 py-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              &larr;
            </button>
            <span className="rounded-lg bg-blue-600 text-white px-2.5 py-1 font-bold">
              {currentPage}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="rounded-lg border border-slate-200 px-2 py-1 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
