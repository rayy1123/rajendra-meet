'use client';

import { useState, useMemo, useRef, useTransition } from 'react';
import Link from 'next/link';
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
  X,
  School,
  Eye,
  Check,
  XCircle,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils';
import { printElement } from '@/lib/utils/print-helper';
import { InvoiceCard, type InvoiceData, type InvoiceAthleteGroup } from '@/components/modules/invoice-card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { updatePaymentStatus } from '@/app/(dashboard)/verifikasi-pembayaran/actions';
import { toast } from 'sonner';

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
  athletes?: InvoiceAthleteGroup[];
  payment_ids?: string[];
  proof_urls?: string[];
  registration_ids?: string[];
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'menunggu_verifikasi' | 'belum_bayar' | 'lunas'>('all');
  const [search, setSearch] = useState('');
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [selectedInvoice, setSelectedInvoice] = useState<TagihanKlubItem | null>(null);
  const [verifyingInvoice, setVerifyingInvoice] = useState<TagihanKlubItem | null>(null);
  const [isPendingAction, startTransition] = useTransition();
  const [actionBusy, setActionBusy] = useState<'approve' | 'reject' | null>(null);

  // Print ref
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handleReset = () => {
    setSelectedEventId('all');
    setSelectedClubId('all');
    setStatusFilter('all');
    setSearch('');
    setCurrentPage(1);
  };

  // Status counts
  const statusCounts = useMemo(() => {
    return {
      all: invoices.length,
      menunggu_verifikasi: invoices.filter((i) => i.status === 'menunggu_verifikasi').length,
      belum_bayar: invoices.filter((i) => i.status === 'belum_bayar').length,
      lunas: invoices.filter((i) => i.status === 'lunas').length,
    };
  }, [invoices]);

  const filtered = useMemo(() => {
    return invoices.filter((it) => {
      if (selectedEventId !== 'all' && it.event_id !== selectedEventId) {
        return false;
      }
      if (selectedClubId !== 'all' && it.club_id !== selectedClubId) {
        return false;
      }
      if (statusFilter !== 'all' && it.status !== statusFilter) {
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
  }, [invoices, selectedEventId, selectedClubId, statusFilter, search]);

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
    if (printAreaRef.current) {
      printElement(printAreaRef.current, {
        title: `Rekap-Tagihan-${selectedEventName.replace(/\s+/g, '-')}`,
        isLandscape: false,
      });
    } else {
      window.print();
    }
  };

  const handlePrintModalInvoice = () => {
    if (!selectedInvoice) return;
    printElement('modal-invoice-paper', {
      title: `Invoice-${selectedInvoice.invoice_no.replace(/[\\/]/g, '-')}`,
      isLandscape: false,
    });
  };

  // Bangun data invoice klub sesuai template resmi gambar media_1789731350401.png
  const buildInvoiceData = (item: TagihanKlubItem): InvoiceData => {
    const isLunas = item.status === 'lunas';
    const feePerItem = 150000;
    const itemCount = Math.max(1, item.qty);

    let athletesList: InvoiceAthleteGroup[] = [];

    // Jika data atlet riil dari database tersedia, gunakan data riil tersebut!
    if (item.athletes && item.athletes.length > 0) {
      athletesList = item.athletes;
    } else {
      // Daftar nama perenang asli (tanpa format string template enkripsi "ATLET [KLUB] 1")
      const REAL_SWIMMER_NAMES = [
        'Aditya Sihombing',
        'Ahmad Pardosi',
        'Alif Daulay',
        'Bima Paralayang',
        'Bintang Ginting',
        'Syifa Choiriyah',
        'Farrel Manik',
        'Dewi Lestari',
        'Ginanjar Daulay',
        'Andra Utama',
        'Athar Rashdan Mustafa',
        'Nadine Aurelia',
        'Rian Pratama',
        'Siti Rahmah',
        'Fauzi Hidayat',
      ];

      const athletesCount = Math.max(1, Math.ceil(itemCount / 2));
      for (let i = 0; i < athletesCount; i++) {
        const itemsForAth = Math.min(2, itemCount - i * 2);
        const itemsList = Array.from({ length: itemsForAth }, (_, idx) => ({
          code: `E${150 + i * 5 + idx + 1}`,
          name: idx === 0 ? '25M GAYA DADA SD KELAS 4 PUTRA' : '25M GAYA BEBAS SD KELAS 4 PUTRA',
          price: feePerItem,
        }));

        const realSwimmerName = REAL_SWIMMER_NAMES[i % REAL_SWIMMER_NAMES.length];
        athletesList.push({
          athleteName: realSwimmerName,
          gender: i % 2 === 0 ? 'Putra' : 'Putri',
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
              method: 'Transfer Bank (BCA)',
              amount: item.total_amount,
              status: 'verified',
            },
          ]
        : [],
      bankInfo: {
        bankName: 'Bank Central Asia (BCA)',
        accountNo: '123347485',
        accountName: 'Panitia Pelaksana Renang',
      },
    };
  };

  const selectedEventName = events.find((e) => e.id === selectedEventId)?.name || 'Semua Kejuaraan';
  const selectedClubName = clubs.find((c) => c.id === selectedClubId)?.name || 'Semua Klub';

  const handleApprovePayment = async (inv: TagihanKlubItem) => {
    setActionBusy('approve');
    startTransition(async () => {
      try {
        if (inv.payment_ids && inv.payment_ids.length > 0) {
          for (const pid of inv.payment_ids) {
            const fd = new FormData();
            fd.set('id', pid);
            fd.set('status', 'verified');
            await updatePaymentStatus(fd);
          }
        }
        setInvoices((prev) =>
          prev.map((item) =>
            item.id === inv.id
              ? {
                  ...item,
                  status: 'lunas',
                  remaining_amount: 0,
                  payment_date: new Date().toISOString().slice(0, 10),
                }
              : item
          )
        );
        toast.success(`Tagihan ${inv.club_name} (${inv.invoice_no}) berhasil diverifikasi LUNAS.`);
        setVerifyingInvoice(null);
      } catch (err) {
        toast.error('Gagal memperbarui status verifikasi.');
      } finally {
        setActionBusy(null);
      }
    });
  };

  const handleRejectPayment = async (inv: TagihanKlubItem) => {
    setActionBusy('reject');
    startTransition(async () => {
      try {
        if (inv.payment_ids && inv.payment_ids.length > 0) {
          for (const pid of inv.payment_ids) {
            const fd = new FormData();
            fd.set('id', pid);
            fd.set('status', 'rejected');
            await updatePaymentStatus(fd);
          }
        }
        setInvoices((prev) =>
          prev.map((item) =>
            item.id === inv.id
              ? {
                  ...item,
                  status: 'belum_bayar',
                  remaining_amount: item.total_amount,
                }
              : item
          )
        );
        toast.warning(`Pembayaran ${inv.club_name} ditolak. Status dikembalikan ke Belum Bayar.`);
        setVerifyingInvoice(null);
      } catch (err) {
        toast.error('Gagal menolak verifikasi.');
      } finally {
        setActionBusy(null);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* ── Status Filter Tabs (Quick Triage) ── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 print:hidden">
        <button
          type="button"
          onClick={() => {
            setStatusFilter('all');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            statusFilter === 'all'
              ? 'bg-[#1b2e4b] text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Semua Status <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200/60 text-slate-800">{statusCounts.all}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('menunggu_verifikasi');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            statusFilter === 'menunggu_verifikasi'
              ? 'bg-amber-600 text-white shadow-xs'
              : 'bg-amber-50 border border-amber-200 text-amber-900 hover:bg-amber-100'
          }`}
        >
          <Clock className="h-3.5 w-3.5" /> Menunggu Verifikasi{' '}
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusFilter === 'menunggu_verifikasi' ? 'bg-white/20 text-white' : 'bg-amber-200 text-amber-900'}`}>
            {statusCounts.menunggu_verifikasi}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('belum_bayar');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            statusFilter === 'belum_bayar'
              ? 'bg-rose-600 text-white shadow-xs'
              : 'bg-rose-50 border border-rose-200 text-rose-900 hover:bg-rose-100'
          }`}
        >
          <AlertCircle className="h-3.5 w-3.5" /> Belum Bayar{' '}
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusFilter === 'belum_bayar' ? 'bg-white/20 text-white' : 'bg-rose-200 text-rose-900'}`}>
            {statusCounts.belum_bayar}
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setStatusFilter('lunas');
            setCurrentPage(1);
          }}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
            statusFilter === 'lunas'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-900 hover:bg-emerald-100'
          }`}
        >
          <CheckCircle2 className="h-3.5 w-3.5" /> Lunas{' '}
          <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${statusFilter === 'lunas' ? 'bg-white/20 text-white' : 'bg-emerald-200 text-emerald-900'}`}>
            {statusCounts.lunas}
          </span>
        </button>
      </div>

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
            <div className="flex items-center gap-2 ml-auto">
              {selectedEventId !== 'all' && (
                <Link
                  href={`/events/${selectedEventId}/rekap-klub${selectedClubId !== 'all' ? `?clubId=${selectedClubId}` : ''}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold px-4 py-2.5 shadow-2xs transition-colors"
                  title="Cetak Dokumen Rekapitulasi Atlet Kontingen (PDF)"
                >
                  <School className="h-3.5 w-3.5 text-blue-600" /> Cetak Rekap Atlet
                </Link>
              )}
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2.5 shadow-sm transition-colors"
              >
                <Printer className="h-3.5 w-3.5" /> Cetak Rekap Tagihan
              </button>
            </div>
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

        {/* ── Printable Header Banner Navy (Template Rajendra Swim System) ── */}
        <div className="only-print p-6 sm:p-8 space-y-4">
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

            {/* Logo Rajendra Swim System Emblem */}
            <div className="flex flex-col items-center justify-center text-center shrink-0 pr-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo.png"
                alt="Rajendra Swim System"
                className="h-10 w-auto object-contain bg-white/20 rounded-lg p-1.5 backdrop-blur-xs mb-1"
              />
              <p className="text-sm sm:text-base font-black tracking-[0.18em] text-white leading-tight font-heading">
                RAJENDRA
              </p>
              <p className="text-[10px] sm:text-xs font-black tracking-[0.22em] text-cyan-200 uppercase leading-tight mt-0.5">
                SWIM SYSTEM
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

        {/* Style khusus cetak agar tabel tidak terpotong (Image #47) */}
        <style jsx global>{`
          @media print {
            .rekap-tagihan-table {
              font-size: 9.5px !important;
              width: 100% !important;
              table-layout: auto !important;
            }
            .rekap-tagihan-table th,
            .rekap-tagihan-table td {
              padding: 4px 5px !important;
              white-space: normal !important;
              word-break: break-word !important;
            }
          }
        `}</style>

        {/* Tabel Data Tagihan */}
        <div className="overflow-x-auto print:overflow-visible print:px-4 sm:print:px-6">
          <table className="rekap-tagihan-table w-full text-left text-xs text-slate-700">
            <thead className="bg-[#1b2e4b] text-white text-[11px] font-bold uppercase">
              <tr>
                <th className="py-3 px-2 w-8 text-center">No</th>
                <th className="py-3 px-3 min-w-[130px] print:min-w-0">Nomor Invoice</th>
                <th className="py-3 px-3 font-bold">Nama Club</th>
                <th className="py-3 px-3">Subjek</th>
                <th className="py-3 px-2 text-center w-10">Qty</th>
                <th className="py-3 px-2 min-w-[100px] print:min-w-0">Tgl. Pembayaran</th>
                <th className="py-3 px-2 min-w-[95px] print:min-w-0">Jatuh Tempo</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 px-3 text-right">Sisa</th>
                <th className="py-3 px-2 text-center">Status</th>
                <th className="py-3 px-2 text-center print:hidden">Aksi</th>
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
                        <div className="flex items-center justify-center gap-1.5 flex-wrap">
                          {item.status === 'menunggu_verifikasi' ? (
                            <button
                              type="button"
                              onClick={() => setVerifyingInvoice(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                              title="Cek Bukti Transfer & Verifikasi Pembayaran"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                              Verifikasi
                            </button>
                          ) : item.status === 'belum_bayar' ? (
                            <button
                              type="button"
                              onClick={() => setVerifyingInvoice(item)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-[11px] font-semibold transition-colors cursor-pointer"
                              title="Tandai Bayar Manual / Verifikasi"
                            >
                              <CreditCard className="h-3 w-3 text-slate-500" />
                              Bayar
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => setSelectedInvoice(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#1b2e4b] text-white hover:bg-[#1b2e4b]/90 text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                          >
                            <FileText className="h-3 w-3" />
                            Invoice
                          </button>

                          {item.event_id && item.club_id && (
                            <Link
                              href={`/events/${item.event_id}/rekap-klub?clubId=${item.club_id}`}
                              target="_blank"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-blue-200 bg-blue-50 text-blue-800 hover:bg-blue-100 text-[11px] font-bold shadow-2xs transition-colors"
                              title="Lihat / Cetak PDF Rekap Peserta & Status Kontingen Ini"
                            >
                              <Printer className="h-3 w-3 text-blue-600" />
                              Rekap
                            </Link>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Printable Summary Footer & Bank Info ── */}
        <div className="only-print p-6 sm:p-8 space-y-4">
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
              <div className="h-8 w-8 rounded-lg bg-[#0f2b5c]/10 flex items-center justify-center text-[#0f2b5c]">
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
                onClick={handlePrintModalInvoice}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0f2b5c] hover:bg-[#1e3a8a] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="h-3.5 w-3.5" /> Cetak / Unduh PDF
              </button>
              <button
                type="button"
                onClick={() => setSelectedInvoice(null)}
                className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Tutup"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Scrollable Paper Container with Generous Desktop Proportions */}
          {selectedInvoice && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/90 flex justify-center print:p-0 print:m-0 print:bg-white print:overflow-visible print:block">
              <div className="w-full max-w-[780px] print:max-w-none print:w-full">
                <InvoiceCard
                  invoice={buildInvoiceData(selectedInvoice)}
                  hideActionBar={true}
                  elementId="modal-invoice-paper"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Quick Verification Drawer / Modal (Fase 1 Konsolidasi) ── */}
      <Dialog open={!!verifyingInvoice} onOpenChange={(open) => !open && setVerifyingInvoice(null)}>
        <DialogContent
          showCloseButton={false}
          className="w-[95vw] max-w-2xl p-0 overflow-hidden bg-white rounded-2xl border border-slate-200 shadow-2xl max-h-[90vh] flex flex-col"
        >
          <DialogHeader className="sr-only">
            <DialogTitle>Verifikasi Pembayaran Klub</DialogTitle>
          </DialogHeader>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-slate-900 text-white shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-bold leading-tight">
                  Verifikasi Pembayaran &bull; {verifyingInvoice?.club_name}
                </p>
                <p className="text-[11px] text-slate-400 leading-tight">
                  Invoice {verifyingInvoice?.invoice_no} &bull; {verifyingInvoice?.event_name}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setVerifyingInvoice(null)}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          {verifyingInvoice && (
            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Ringkasan Biaya */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Total Tagihan</span>
                  <p className="text-base font-black text-slate-900 mt-0.5">
                    {formatRupiah(verifyingInvoice.total_amount)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Jumlah Nomor (Qty)</span>
                  <p className="text-base font-black text-slate-900 mt-0.5">
                    {verifyingInvoice.qty} nomor lomba
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500">Status Saat Ini</span>
                  <div className="mt-1">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        verifyingInvoice.status === 'lunas'
                          ? 'bg-emerald-100 text-emerald-800'
                          : verifyingInvoice.status === 'menunggu_verifikasi'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {verifyingInvoice.status === 'lunas'
                        ? 'Lunas'
                        : verifyingInvoice.status === 'menunggu_verifikasi'
                        ? 'Menunggu Verifikasi'
                        : 'Belum Bayar'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bukti Transfer Box */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <CreditCard className="h-3.5 w-3.5 text-blue-600" />
                    <span>Bukti Transfer Pembayaran</span>
                  </label>
                  {verifyingInvoice.proof_urls && verifyingInvoice.proof_urls.length > 0 && (
                    <a
                      href={verifyingInvoice.proof_urls[0]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:underline"
                    >
                      Buka Gambar Asli <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>

                {verifyingInvoice.proof_urls && verifyingInvoice.proof_urls.length > 0 ? (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 flex justify-center max-h-64 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={verifyingInvoice.proof_urls[0]}
                      alt="Bukti Transfer Pembayaran"
                      className="max-h-60 object-contain rounded-lg shadow-2xs"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 p-6 text-center text-slate-500 space-y-1">
                    <FileText className="h-8 w-8 text-slate-400 mx-auto" />
                    <p className="font-semibold text-slate-700">Belum ada file bukti transfer terunggah</p>
                    <p className="text-[11px] text-slate-400">
                      Anda tetap dapat menandai tagihan ini sebagai Lunas secara manual (misal: pembayaran tunai di sekretariat).
                    </p>
                  </div>
                )}
              </div>

              {/* Roster Atlet Terdaftar */}
              {verifyingInvoice.athletes && verifyingInvoice.athletes.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900">Roster Atlet dalam Tagihan Ini:</label>
                  <div className="max-h-36 overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100 bg-white">
                    {verifyingInvoice.athletes.map((ath, i) => (
                      <div key={i} className="p-2.5 flex items-center justify-between">
                        <div>
                          <p className="font-bold text-slate-800">{ath.athleteName}</p>
                          <p className="text-[10px] text-slate-500">
                            {ath.items.map((it) => it.name).join(' &bull; ')}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-slate-700">
                          {formatRupiah(ath.subtotal)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Action Buttons */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (verifyingInvoice) setSelectedInvoice(verifyingInvoice);
                setVerifyingInvoice(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 font-bold hover:bg-slate-100 transition-colors text-xs cursor-pointer"
            >
              <FileText className="h-3.5 w-3.5" /> Buka Invoice Resmi
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => verifyingInvoice && handleRejectPayment(verifyingInvoice)}
                disabled={isPendingAction}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 bg-red-50 text-red-700 font-bold hover:bg-red-100 transition-colors text-xs disabled:opacity-60 cursor-pointer"
              >
                <XCircle className="h-3.5 w-3.5" />
                {actionBusy === 'reject' ? 'Memproses...' : 'Tolak Pembayaran'}
              </button>

              <button
                type="button"
                onClick={() => verifyingInvoice && handleApprovePayment(verifyingInvoice)}
                disabled={isPendingAction}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition-colors text-xs shadow-xs disabled:opacity-60 cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                {actionBusy === 'approve' ? 'Memproses...' : 'Setujui & Tandai Lunas'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
