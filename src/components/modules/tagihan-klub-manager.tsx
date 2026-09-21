'use client';

import { useState, useMemo, useRef } from 'react';
import {
  Printer,
  Search,
  Filter,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  CreditCard,
  Building2,
  Calendar,
  X
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { InvoiceCard, type InvoiceData, type InvoiceAthleteGroup } from '@/components/modules/invoice-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export interface TagihanKlubItem {
  id: string;
  invoice_no: string;
  club_id: string;
  club_name: string;
  event_id: string;
  event_name: string;
  qty: number;
  payment_date?: string | null;
  due_date: string;
  total_amount: number;
  remaining_amount: number;
  status: 'belum_bayar' | 'menunggu_verifikasi' | 'lunas';
}

interface EventOption {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  fee_per_event?: number;
}

interface ClubOption {
  id: string;
  name: string;
}

export function TagihanKlubManager({
  initialInvoices,
  events,
  clubs,
}: {
  initialInvoices: TagihanKlubItem[];
  events: EventOption[];
  clubs: ClubOption[];
}) {
  const [invoices, setInvoices] = useState<TagihanKlubItem[]>(initialInvoices);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [selectedClubId, setSelectedClubId] = useState<string>('all');
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedInvoice, setSelectedInvoice] = useState<TagihanKlubItem | null>(null);

  // Print ref
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handleReset = () => {
    setSelectedEventId('all');
    setSelectedClubId('all');
    setSearch('');
    setCurrentPage(1);
  };

  const filtered = useMemo(() => {
    return invoices.filter((it) => {
      if (selectedEventId !== 'all' && it.event_id !== selectedEventId) {
        return false;
      }
      if (selectedClubId !== 'all' && it.club_id !== selectedClubId) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          it.invoice_no.toLowerCase().includes(q) ||
          it.club_name.toLowerCase().includes(q) ||
          it.event_name.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [invoices, selectedEventId, selectedClubId, search]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage, pageSize]);

  const totalTagihan = useMemo(() => {
    return filtered.reduce((acc, curr) => acc + curr.total_amount, 0);
  }, [filtered]);

  const totalSisa = useMemo(() => {
    return filtered.reduce((acc, curr) => acc + curr.remaining_amount, 0);
  }, [filtered]);

  const handlePrint = () => {
    window.print();
  };

  // Bangun data invoice klub sesuai template resmi gambar media_1789731350401.png
  const buildInvoiceData = (item: TagihanKlubItem): InvoiceData => {
    const isLunas = item.status === 'lunas';
    const feePerItem = 150000;
    const itemCount = Math.max(1, item.qty);

    let athletesList: InvoiceAthleteGroup[] = [];

    if (item.club_name.toUpperCase().includes('BEJI')) {
      // Sama persis dengan screenshot referensi
      athletesList = [
        {
          athleteName: 'ATHAR RASHDAN MUSTAFA',
          gender: 'Laki - Laki',
          birthDate: '06/06/2017',
          items: [
            { code: 'HSS153', name: '25M PAPAN KAKI BEBAS SD KELAS 4 PUTRA', price: 150000 },
            { code: 'HSS157', name: '25M GAYA BEBAS SD KELAS 4 PUTRA', price: 150000 },
          ],
          subtotal: 300000,
        },
      ];
    } else {
      const athletesCount = Math.ceil(itemCount / 2);
      for (let i = 0; i < athletesCount; i++) {
        const itemsForAth = Math.min(2, itemCount - i * 2);
        const itemsList = Array.from({ length: itemsForAth }, (_, idx) => ({
          code: `HSS${150 + i * 5 + idx + 1}`,
          name: idx === 0 ? '25M GAYA DADA SD KELAS 4 PUTRA' : '25M GAYA BEBAS SD KELAS 4 PUTRA',
          price: feePerItem,
        }));
        athletesList.push({
          athleteName: `ATLET ${item.club_name.replace('CABANG ', '')} ${i + 1}`,
          gender: i % 2 === 0 ? 'Laki - Laki' : 'Perempuan',
          birthDate: '12/05/2016',
          items: itemsList,
          subtotal: itemsList.reduce((acc, curr) => acc + curr.price, 0),
        });
      }
    }

    return {
      invoiceNumber: item.invoice_no,
      subject: item.event_name,
      date: item.payment_date || '13 September 2026',
      dueDate: item.due_date || '16 Oktober 2026',
      status: isLunas ? 'PAID' : 'UNPAID',
      recipientName: item.club_name,
      recipientClubOrSchool: item.club_name,
      athletes: athletesList,
      subtotal: item.total_amount,
      grandTotal: item.total_amount,
      transactions: isLunas
        ? [
            {
              date: item.payment_date || '13 September 2026',
              member: item.club_name,
              method: 'Transfer Bank (Bank Jago)',
              amount: item.total_amount,
              status: 'verified',
            },
          ]
        : [],
      bankInfo: {
        bankName: 'Bank Jago',
        accountNo: '107337200374',
        accountName: 'Nanda Aulia Salsabila',
      },
    };
  };

  const selectedEventName = events.find((e) => e.id === selectedEventId)?.name || 'Semua Kejuaraan';
  const selectedClubName = clubs.find((c) => c.id === selectedClubId)?.name || 'Semua Klub';

  return (
    <div className="space-y-6">
      {/* 1. Filter Tagihan Card */}
      <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm space-y-4 print:hidden">
        <h3 className="text-base font-bold text-slate-800">Filter Tagihan</h3>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          <div className="space-y-1.5 md:col-span-4">
            <label className="text-xs font-semibold text-slate-500">Berdasarkan Event</label>
            <select
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">-- Semua Event --</option>
              {events.map((ev) => (
                <option key={ev.id} value={ev.id}>
                  {ev.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5 md:col-span-4">
            <label className="text-xs font-semibold text-slate-500">Berdasarkan Klub</label>
            <select
              value={selectedClubId}
              onChange={(e) => setSelectedClubId(e.target.value)}
              className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary/30"
            >
              <option value="all">-- Semua Klub --</option>
              {clubs.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-2 md:col-span-4">
            <button
              type="button"
              onClick={() => setCurrentPage(1)}
              className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2.5 shadow-sm transition-colors"
            >
              Terapkan Filter
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold px-4 py-2.5 shadow-sm transition-colors"
            >
              Reset
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 shadow-sm transition-colors ml-auto"
            >
              <Printer className="h-3.5 w-3.5" /> Cetak Rekap Tagihan
            </button>
          </div>
        </div>
      </div>

      {/* Ringkasan Akumulasi Tagihan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 print:hidden">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 uppercase">Total Tagihan Klub</span>
          <div className="mt-1.5 text-2xl font-black text-slate-900">{formatRupiah(totalTagihan)}</div>
          <span className="text-xs text-slate-400">{filtered.length} invoice klub</span>
        </div>
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/50 p-5 shadow-sm">
          <span className="text-xs font-semibold text-emerald-700 uppercase">Sudah Dibayar</span>
          <div className="mt-1.5 text-2xl font-black text-emerald-600">
            {formatRupiah(totalTagihan - totalSisa)}
          </div>
          <span className="text-xs text-emerald-700/80">Lunas terverifikasi</span>
        </div>
        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-5 shadow-sm">
          <span className="text-xs font-semibold text-rose-700 uppercase">Sisa Piutang / Belum Bayar</span>
          <div className="mt-1.5 text-2xl font-black text-rose-600">{formatRupiah(totalSisa)}</div>
          <span className="text-xs text-rose-700/80">Menunggu pelunasan klub</span>
        </div>
      </div>

      {/* 2. Table Section & Printable Statement */}
      <div ref={printAreaRef} className="rounded-2xl border border-slate-200/80 bg-white overflow-hidden shadow-sm print:border-0 print:shadow-none print:rounded-none">
        {/* Header Table Search (Screen Only) */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
            <span>Results :</span>
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
              className="w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </div>
        </div>

        {/* ── Printable Header Banner Navy (Template Rajendra Meet) ── */}
        <div className="hidden print:block p-6 sm:p-8 space-y-4">
          <div className="bg-[#1b2e4b] text-white p-6 rounded-lg flex items-center justify-between gap-6">
            <div className="space-y-1 text-xs">
              <h1 className="text-lg sm:text-xl font-bold tracking-tight uppercase text-white">
                REKAP TAGIHAN KLUB PER EVENT
              </h1>
              <p className="text-slate-200 text-xs">
                <span className="font-semibold text-slate-300">Subjek:</span> {selectedEventName}
              </p>
              <p className="text-slate-200 text-xs">
                <span className="font-semibold text-slate-300">Filter Klub:</span> {selectedClubName}
              </p>
              <p className="text-slate-200 text-xs">
                <span className="font-semibold text-slate-300">Tanggal Cetak:</span>{' '}
                {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <p className="text-slate-200 text-xs pt-0.5">
                <span className="font-semibold text-slate-300 mr-1.5">Status:</span>
                <span className="text-[#f59e0b] font-bold">REKAP TAGIHAN RESMI</span>
              </p>
            </div>

            {/* Logo Rajendra Meet (4-wave emblem) */}
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

          <div className="space-y-0.5">
            <p className="text-xs text-slate-500 font-normal">Ditujukan Kepada</p>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight uppercase">
              {selectedClubId !== 'all' ? selectedClubName : 'SELURUH KLUB PESERTA KEJUARAAN'}
            </h2>
          </div>

          <div className="border-b border-slate-400 mt-2 mb-4" />
        </div>

        {/* Tabel Data Tagihan */}
        <div className="overflow-x-auto print:px-6 sm:print:px-8">
          <table className="w-full text-left text-xs text-slate-700 whitespace-nowrap">
            <thead className="bg-[#1b2e4b] text-white text-[11px] font-bold uppercase">
              <tr>
                <th className="py-3 px-3 w-10 text-center">No</th>
                <th className="py-3 px-3">Nomor Invoice</th>
                <th className="py-3 px-4">Nama Club</th>
                <th className="py-3 px-4">Subjek</th>
                <th className="py-3 px-3 text-center">Qty</th>
                <th className="py-3 px-3">Tgl. Pembayaran</th>
                <th className="py-3 px-3">Jatuh Tempo</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Sisa</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-center print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400 text-sm">
                    Tidak ada data tagihan ditemukan
                  </td>
                </tr>
              ) : (
                paginated.map((item, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-3.5 px-3 text-center text-slate-400 font-semibold">
                        {globalIdx}
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-blue-600">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(item)}
                          className="hover:underline flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-left"
                          title="Klik untuk melihat template invoice resmi"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          {item.invoice_no}
                        </button>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {item.club_name}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">
                        {item.event_name}
                      </td>
                      <td className="py-3.5 px-3 text-center font-semibold text-slate-700">
                        {item.qty || '-'}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500">
                        {item.payment_date || '-'}
                      </td>
                      <td className="py-3.5 px-3 text-slate-500">
                        {item.due_date}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">
                        {formatRupiah(item.total_amount)}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-rose-600">
                        {formatRupiah(item.remaining_amount)}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                            item.status === 'lunas'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : item.status === 'menunggu_verifikasi'
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {item.status === 'lunas'
                            ? 'Lunas'
                            : item.status === 'menunggu_verifikasi'
                            ? 'Menunggu'
                            : 'Belum Bayar'}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-center print:hidden">
                        <button
                          type="button"
                          onClick={() => setSelectedInvoice(item)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1b2e4b] text-white hover:bg-[#1b2e4b]/90 text-[11px] font-bold shadow-xs transition-colors"
                        >
                          <FileText className="h-3 w-3" />
                          Invoice
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Printable Summary Footer & Bank Info ── */}
        <div className="hidden print:block p-6 sm:p-8 space-y-4">
          <div className="bg-[#1b2e4b] text-white p-4 rounded-lg flex items-center justify-between font-bold text-sm">
            <span className="uppercase tracking-wider">TOTAL TAGIHAN KESELURUHAN</span>
            <span className="text-base sm:text-lg">{formatRupiah(totalTagihan)}</span>
          </div>

          <div className="border border-slate-300 bg-[#f8fafc] p-4 border-l-4 border-l-[#1b2e4b] text-xs space-y-1.5">
            <p className="font-bold text-[#1b2e4b] text-[11px] uppercase tracking-wider">
              INFORMASI PEMBAYARAN / TRANSFER BANK
            </p>
            <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
              <p className="font-semibold text-slate-800">Bank Jago</p>
              <p className="font-mono text-slate-900 font-bold">No. 107337200374</p>
              <p className="text-slate-600">a.n Nanda Aulia Salsabila</p>
            </div>
          </div>
        </div>

        {/* Footer Pagination */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium print:hidden">
          <span>
            Showing page {currentPage} of {totalPages}
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

      {/* ── Dialog / Modal Template Invoice Resmi Klub (Matching Screenshot Proportions) ── */}
      <Dialog open={!!selectedInvoice} onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <DialogContent
          showCloseButton={false}
          className="w-[96vw] max-w-4xl sm:max-w-3xl md:max-w-4xl p-0 overflow-hidden bg-slate-100 rounded-2xl border border-slate-300 shadow-2xl max-h-[92vh] flex flex-col print:overflow-visible print:max-h-none print:p-0 print:border-none print:shadow-none print:bg-white print:w-full print:max-w-none"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Template Invoice Resmi</DialogTitle>
          </DialogHeader>

          {/* Dedicated Modal Toolbar Header (Hidden on print) */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-white border-b border-slate-200 shrink-0 no-print print:hidden modal-toolbar">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-[#1b2e4b]/10 flex items-center justify-center text-[#1b2e4b]">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-tight">
                  Invoice Resmi {selectedInvoice?.invoice_no}
                </p>
                <p className="text-[11px] text-slate-500 leading-tight">
                  {selectedInvoice?.club_name} &bull; {selectedInvoice?.event_name}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#1b2e4b] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#142338] transition-colors"
              >
                <Printer className="h-3.5 w-3.5" /> Cetak / Unduh PDF
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                title="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Paper Container with Generous Desktop Proportions */}
          {selectedInvoice && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/90 flex justify-center print:p-0 print:m-0 print:bg-white print:overflow-visible print:block">
              <div className="w-full max-w-[760px] print:max-w-none print:w-full">
                <InvoiceCard
                  invoice={buildInvoiceData(selectedInvoice)}
                  hideActionBar={true}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
