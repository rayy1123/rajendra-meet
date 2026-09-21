'use client';

import { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Search,
  Calendar,
  Filter,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { Expense } from '@/types/database';

export interface FinancialTransaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  description: string;
  amount: number;
  eventName?: string;
}

interface FinancialReportManagerProps {
  initialIncomeTransactions: FinancialTransaction[];
  initialExpenses: Expense[];
  events: { id: string; name: string }[];
}

export function FinancialReportManager({
  initialIncomeTransactions,
  initialExpenses,
  events,
}: FinancialReportManagerProps) {
  const [period, setPeriod] = useState<'harian' | 'bulanan' | 'tahunan' | 'semua'>('semua');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Combine income and expense transactions
  const allTransactions = useMemo(() => {
    const expenseTx: FinancialTransaction[] = initialExpenses.map((exp) => {
      const ev = events.find((e) => e.id === exp.event_id);
      return {
        id: exp.id,
        date: exp.expense_date,
        type: 'expense',
        category: exp.type,
        description: exp.description || 'Pengeluaran operasional',
        amount: Number(exp.amount),
        eventName: ev?.name,
      };
    });

    const combined = [...initialIncomeTransactions, ...expenseTx];
    return combined.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [initialIncomeTransactions, initialExpenses, events]);

  // Filtered transactions
  const filtered = useMemo(() => {
    return allTransactions.filter((tx) => {
      if (filterType !== 'all' && tx.type !== filterType) {
        return false;
      }
      if (period === 'harian' && tx.date !== selectedDate) {
        return false;
      }
      if (period === 'bulanan' && tx.date.slice(0, 7) !== selectedDate.slice(0, 7)) {
        return false;
      }
      if (period === 'tahunan' && tx.date.slice(0, 4) !== selectedDate.slice(0, 4)) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          tx.description.toLowerCase().includes(q) ||
          tx.category.toLowerCase().includes(q) ||
          (tx.eventName && tx.eventName.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [allTransactions, filterType, period, selectedDate, search]);

  // Totals
  const totalIncome = useMemo(() => {
    return filtered
      .filter((t) => t.type === 'income')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [filtered]);

  const totalExpense = useMemo(() => {
    return filtered
      .filter((t) => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [filtered]);

  const netProfit = totalIncome - totalExpense;

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['No', 'Tanggal', 'Tipe', 'Kategori', 'Keterangan', 'Event', 'Jumlah'];
    const rows = filtered.map((tx, idx) => [
      idx + 1,
      tx.date,
      tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran',
      tx.category,
      `"${tx.description.replace(/"/g, '""')}"`,
      `"${tx.eventName || '-'}"`,
      tx.amount,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `laporan-keuangan-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to Excel (via simple HTML spreadsheet download)
  const handleExportExcel = () => {
    const tableHtml = `
      <table border="1">
        <thead>
          <tr style="background-color: #0b1e3b; color: #fff;">
            <th>No</th>
            <th>Tanggal</th>
            <th>Tipe</th>
            <th>Kategori</th>
            <th>Keterangan</th>
            <th>Event</th>
            <th>Jumlah (IDR)</th>
          </tr>
        </thead>
        <tbody>
          ${filtered
            .map(
              (tx, idx) => `
            <tr>
              <td>${idx + 1}</td>
              <td>${tx.date}</td>
              <td>${tx.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</td>
              <td>${tx.category}</td>
              <td>${tx.description}</td>
              <td>${tx.eventName || '-'}</td>
              <td>${tx.amount}</td>
            </tr>
          `
            )
            .join('')}
          <tr style="font-weight: bold; background-color: #f1f5f9;">
            <td colspan="6">Total Pemasukan</td>
            <td>${totalIncome}</td>
          </tr>
          <tr style="font-weight: bold; background-color: #f1f5f9;">
            <td colspan="6">Total Pengeluaran</td>
            <td>${totalExpense}</td>
          </tr>
          <tr style="font-weight: bold; background-color: #e2e8f0;">
            <td colspan="6">Laba Bersih</td>
            <td>${netProfit}</td>
          </tr>
        </tbody>
      </table>
    `;

    const blob = new Blob([tableHtml], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan-keuangan-${new Date().toISOString().slice(0, 10)}.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* 1. Filter Bar (Matching screenshot media_1789719635908.png) */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-wrap items-center gap-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Periode :</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="block w-40 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="semua">Semua</option>
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
            <label className="text-xs font-semibold text-slate-500">Tipe Transaksi :</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="block w-40 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">Semua Tipe</option>
              <option value="income">Pemasukan Saja</option>
              <option value="expense">Pengeluaran Saja</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => setCurrentPage(1)}
            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-5 py-2.5 shadow-sm transition-colors mt-auto"
          >
            Generate
          </button>
        </div>
      </div>

      {/* 2. Metrics Cards (Screen Only) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 print:hidden">
        {/* Pemasukan (Green card) */}
        <div className="rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 text-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100">
              Pemasukan
            </span>
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowDownRight className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black tracking-tight">
            {formatRupiah(totalIncome)}
          </div>
          <p className="mt-1 text-xs text-emerald-100/90">
            Total penerimaan registrasi & sponsor
          </p>
        </div>

        {/* Pengeluaran (Red card) */}
        <div className="rounded-2xl bg-gradient-to-r from-rose-500 to-red-600 text-white p-6 shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-100">
              Pengeluaran
            </span>
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowUpRight className="h-4 w-4 text-white" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black tracking-tight">
            {formatRupiah(totalExpense)}
          </div>
          <p className="mt-1 text-xs text-rose-100/90">
            Total biaya operasional & pengadaan
          </p>
        </div>

        {/* Saldo Bersih */}
        <div className="rounded-2xl bg-gradient-to-r from-slate-900 to-blue-950 text-white p-6 shadow-md sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Laba Bersih / Sisa Saldo
            </span>
            <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-3 text-3xl font-black tracking-tight text-emerald-300">
            {formatRupiah(netProfit)}
          </div>
          <p className="mt-1 text-xs text-slate-300/90">
            Selisih penerimaan dikurangi pengeluaran
          </p>
        </div>
      </div>

      {/* 3. Action Buttons: Export to Excel, Export to CSV, Print, Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 shadow-sm transition-colors"
          >
            <FileSpreadsheet className="h-4 w-4" /> Export to Excel
          </button>
          <button
            type="button"
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 shadow-sm transition-colors"
          >
            <Download className="h-4 w-4" /> Export to CSV
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-4 py-2.5 shadow-sm transition-colors"
          >
            <Printer className="h-4 w-4" /> Print
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30 shadow-sm"
          />
        </div>
      </div>

      {/* 4. Table & Official Printable Financial Statement */}
      <div className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm print:border-0 print:shadow-none print:rounded-none">
        
        {/* ── Official Printable Header Banner Navy (#1b2e4b) ── */}
        <div className="hidden print:block p-6 sm:p-8 space-y-4">
          <div className="bg-[#1b2e4b] text-white p-6 rounded-lg flex items-center justify-between gap-6">
            <div className="space-y-1 text-xs">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight uppercase text-white">
                LAPORAN KEUANGAN & ARUS KAS
              </h1>
              <p className="text-slate-200 text-xs">
                <span className="font-semibold text-slate-300">Subjek:</span>{' '}
                {events.find((e) => e.id === selectedEventId)?.name || 'Seluruh Kejuaraan'}
              </p>
              <p className="text-slate-200 text-xs">
                <span className="font-semibold text-slate-300">Periode:</span>{' '}
                {period === 'semua' ? 'Semua Periode' : period.toUpperCase()}
              </p>
              <p className="text-slate-200 text-xs">
                <span className="font-semibold text-slate-300">Tanggal Cetak:</span>{' '}
                {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-slate-200 text-xs pt-0.5">
                <span className="font-semibold text-slate-300 mr-1.5">Status:</span>
                <span className="text-[#10b981] font-bold">DOKUMEN RESMI KEUANGAN</span>
              </p>
            </div>

            {/* Logo Rajendra Meet */}
            <div className="flex flex-col items-center justify-center text-center shrink-0 pr-1">
              <svg
                className="h-10 w-14 text-white fill-none stroke-current stroke-[2.4] mb-1.5 opacity-95"
                viewBox="0 0 52 36"
              >
                <path d="M4 6 Q 16 1, 26 6 T 48 6" strokeLinecap="round" />
                <path d="M4 14 Q 16 9, 26 14 T 48 14" strokeLinecap="round" />
                <path d="M4 22 Q 16 17, 26 22 T 48 22" strokeLinecap="round" />
                <path d="M4 30 Q 16 25, 26 30 T 48 30" strokeLinecap="round" />
              </svg>
              <p className="text-sm sm:text-base font-black tracking-[0.24em] text-white leading-tight">
                RAJENDRA
              </p>
              <p className="text-[11px] sm:text-xs font-black tracking-[0.38em] text-white/95 uppercase leading-tight mt-0.5">
                MEET
              </p>
            </div>
          </div>

          <div className="border-b border-slate-300 my-4" />

          {/* Printable Financial Summary Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">TOTAL PEMASUKAN</span>
              <span className="text-sm font-black text-emerald-700 mt-0.5 block">{formatRupiah(totalIncome)}</span>
            </div>
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs">
              <span className="text-[10px] font-bold text-rose-800 uppercase block">TOTAL PENGELUARAN</span>
              <span className="text-sm font-black text-rose-700 mt-0.5 block">{formatRupiah(totalExpense)}</span>
            </div>
            <div className="p-3 bg-slate-100 border border-slate-300 rounded-lg text-xs">
              <span className="text-[10px] font-bold text-slate-800 uppercase block">SALDO BERSIH / KAS</span>
              <span className="text-sm font-black text-slate-900 mt-0.5 block">{formatRupiah(netProfit)}</span>
            </div>
          </div>

          <div className="border-b border-slate-400 mt-2 mb-4" />
        </div>

        <div className="overflow-x-auto print:px-6 sm:print:px-8">
          <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
            <thead className="bg-[#1b2e4b] text-white text-[11px] font-bold uppercase">
              <tr>
                <th className="py-3 px-3 w-12 text-center">No</th>
                <th className="py-3 px-4">Tanggal</th>
                <th className="py-3 px-4">Tipe</th>
                <th className="py-3 px-4">Keterangan</th>
                <th className="py-3 px-4 text-right">Jumlah</th>
              </tr>
            </thead>
            
            {/* Screen Tbody (Paginated) */}
            <tbody className="divide-y divide-slate-100 font-medium print:hidden">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 text-sm">
                    No data available in table
                  </td>
                </tr>
              ) : (
                paginated.map((item, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const isIncome = item.type === 'income';
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3 text-center text-slate-400 font-semibold">
                        {globalIdx}
                      </td>
                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        {item.date}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isIncome
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {isIncome ? 'Pemasukan' : 'Pengeluaran'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-800 font-semibold max-w-md truncate">
                        {item.description}
                        {item.eventName && (
                          <span className="ml-2 text-xs font-normal text-slate-400">
                            ({item.eventName})
                          </span>
                        )}
                      </td>
                      <td
                        className={`py-3.5 px-4 text-right font-bold ${
                          isIncome ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isIncome ? '+' : '-'} {formatRupiah(item.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Print Tbody (All filtered entries for full report document) */}
            <tbody className="divide-y divide-slate-200 font-medium hidden print:table-row-group">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-sm">
                    Tidak ada mutasi kas untuk periode ini
                  </td>
                </tr>
              ) : (
                filtered.map((item, idx) => {
                  const isIncome = item.type === 'income';
                  return (
                    <tr key={item.id} className="border-b border-slate-100">
                      <td className="py-2 px-3 text-center text-slate-500 font-semibold">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-4 text-slate-700">
                        {item.date}
                      </td>
                      <td className="py-2 px-4 font-bold text-[11px]">
                        {isIncome ? 'PEMASUKAN' : 'PENGELUARAN'}
                      </td>
                      <td className="py-2 px-4 text-slate-800">
                        {item.description}
                        {item.eventName && ` (${item.eventName})`}
                      </td>
                      <td className="py-2 px-4 text-right font-bold text-slate-900">
                        {isIncome ? '+' : '-'} {formatRupiah(item.amount)}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Printable Signature Section */}
        <div className="hidden print:block p-8 pt-10">
          <div className="flex justify-between items-center text-center text-xs text-slate-700">
            <div className="space-y-16">
              <p className="font-semibold">Dibuat Oleh,<br />Bendahara Panitia</p>
              <p className="border-t border-slate-400 pt-1 font-bold">( ............................................ )</p>
            </div>
            <div className="space-y-16">
              <p className="font-semibold">Mengetahui,<br />Ketua Penyelenggara Rajendra Meet</p>
              <p className="border-t border-slate-400 pt-1 font-bold">( ............................................ )</p>
            </div>
          </div>
        </div>

        {/* Pagination Bar */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium print:hidden">
          <span>
            Showing {filtered.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} to{' '}
            {Math.min(currentPage * pageSize, filtered.length)} of {filtered.length} entries
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
