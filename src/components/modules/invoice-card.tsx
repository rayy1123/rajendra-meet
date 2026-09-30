'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Printer,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Copy,
  Check,
  Building,
  User,
  ShieldCheck,
  CreditCard,
  ExternalLink,
  Sparkles,
  MapPin,
  Calendar,
  FileText,
  BadgeCheck,
} from 'lucide-react';
import { QrCodeSvg } from './qr-code-svg';
import { Button } from '@/components/ui/button';
import { printElement } from '@/lib/utils/print-helper';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export interface InvoiceItem {
  code?: string;
  name: string;
  price: number;
}

export interface InvoiceAthleteGroup {
  athleteName: string;
  gender: string;
  birthDate?: string | null;
  items: InvoiceItem[];
  subtotal: number;
}

export interface InvoicePaymentTransaction {
  date: string;
  member: string;
  method: string;
  amount: number;
  status: string;
}

export interface InvoiceData {
  invoiceNumber: string;
  subject: string;
  date: string;
  dueDate: string;
  status: 'PAID' | 'UNPAID' | 'VERIFIED' | 'PENDING' | 'REJECTED';
  recipientName: string;
  recipientClubOrSchool?: string | null;
  athletes: InvoiceAthleteGroup[];
  subtotal: number;
  uniqueCode?: number;
  grandTotal: number;
  transactions: InvoicePaymentTransaction[];
  bankInfo: {
    bankName: string;
    accountNo: string;
    accountName: string;
  };
}

export function InvoiceCard({
  invoice,
  backUrl = '/pendaftaran-saya',
  hideActionBar = false,
  autoPrint = false,
  elementId = 'official-invoice-sheet',
  className = '',
}: {
  invoice: InvoiceData;
  backUrl?: string;
  hideActionBar?: boolean;
  autoPrint?: boolean;
  elementId?: string;
  className?: string;
}) {
  const [copiedBank, setCopiedBank] = useState(false);

  const handlePrintDocument = () => {
    printElement(elementId, {
      title: `Invoice-${invoice.invoiceNumber.replace(/[\\/]/g, '-')}`,
      isLandscape: false,
    });
  };

  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        handlePrintDocument();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [autoPrint]);

  const isPaid = invoice.status === 'PAID' || invoice.status === 'VERIFIED';
  const isPending = invoice.status === 'PENDING' || invoice.status === 'UNPAID';
  const isRejected = invoice.status === 'REJECTED';

  const handleCopyAccountNo = () => {
    if (invoice.bankInfo?.accountNo) {
      navigator.clipboard.writeText(invoice.bankInfo.accountNo);
      setCopiedBank(true);
      toast.success('Nomor rekening berhasil disalin!');
      setTimeout(() => setCopiedBank(false), 2000);
    }
  };

  const verificationPayload = `RAJENDRA-MEET:INVOICE:${invoice.invoiceNumber}:${invoice.grandTotal}:${invoice.status}`;

  const totalEntriesCount = invoice.athletes.reduce((acc, curr) => acc + curr.items.length, 0);

  return (
    <div className={`mx-auto w-full max-w-4xl space-y-4 ${className}`}>
      {/* ── ACTION BAR (SCREEN ONLY) ── */}
      {!hideActionBar && (
        <div className="flex items-center justify-between no-print px-2 sm:px-0">
          <Link
            href={backUrl}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-slate-950 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>

          <div className="flex items-center gap-2">
            <Button
              onClick={handlePrintDocument}
              className="gap-2 bg-[#0f2b5c] hover:bg-[#1e3a8a] text-white font-bold text-xs shadow-sm h-9 px-4 rounded-xl cursor-pointer"
            >
              <Printer className="h-4 w-4" /> Cetak / Unduh PDF (A4)
            </Button>
          </div>
        </div>
      )}

      {/* ── DOKUMEN RESMI INVOICE (A4 PROPORTIONED PAPER) ── */}
      <div
        id={elementId}
        className="invoice-paper-sheet invoice-paper relative rounded-2xl bg-white text-slate-900 shadow-md border border-slate-300 overflow-hidden p-6 sm:p-9 print:p-0 print:border-none print:shadow-none print:rounded-none"
      >
        {/* 1. KOP HEADER BANNER DARK NAVY #0f2b5c DENGAN LOGO RESMI */}
        <div className="bg-[#0f2b5c] text-white p-6 sm:p-7 rounded-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 relative overflow-hidden">
          <div className="space-y-1.5 text-xs relative z-10">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-black tracking-widest text-cyan-300 uppercase flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-cyan-300" />
                SURAT TAGIHAN RESMI KEJUARAAN
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase text-white font-heading">
              INVOICE #{invoice.invoiceNumber}
            </h1>

            <p className="text-slate-200 text-xs">
              <span className="font-semibold text-slate-300">Subjek Kejuaraan:</span>{' '}
              <b className="text-white">{invoice.subject}</b>
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-slate-300 text-xs pt-0.5">
              <span>
                <span className="text-slate-400">Tanggal Terbit:</span> {invoice.date}
              </span>
              <span>•</span>
              <span>
                <span className="text-slate-400">Jatuh Tempo:</span> {invoice.dueDate}
              </span>
            </div>

            {/* Status Pill Badge */}
            <div className="pt-1.5 flex items-center gap-2">
              <span className="text-slate-400 text-xs font-semibold">Status Pembayaran:</span>
              <span
                className={cn(
                  'inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase shadow-2xs border',
                  isPaid
                    ? 'bg-emerald-500/25 text-emerald-300 border-emerald-400/50'
                    : isRejected
                    ? 'bg-rose-500/25 text-rose-300 border-rose-400/50'
                    : 'bg-amber-500/25 text-amber-300 border-amber-400/50'
                )}
              >
                {isPaid ? (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> LUNAS (PAID)
                  </>
                ) : isRejected ? (
                  <>
                    <XCircle className="h-3.5 w-3.5 text-rose-400" /> DITOLAK (REJECTED)
                  </>
                ) : (
                  <>
                    <Clock className="h-3.5 w-3.5 text-amber-400" /> MENUNGGU PEMBAYARAN (UNPAID)
                  </>
                )}
              </span>
            </div>
          </div>

          {/* Logo Rajendra Swim System Emblem */}
          <div className="flex flex-col items-start sm:items-center justify-center text-center shrink-0 pr-1 relative z-10">
            <div className="flex flex-col items-center">
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
        </div>

        {/* Separator Line */}
        <div className="border-b border-slate-300 my-4" />

        {/* 2. DITUJUKAN KEPADA (DUAL-PANEL BILATERAL INFO) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200/90 text-xs">
          <div className="space-y-1">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Ditujukan Kepada (Kontingen / Klub)
            </p>
            <h2 className="text-base font-black text-slate-950 uppercase font-heading">
              {invoice.recipientClubOrSchool || invoice.recipientName}
            </h2>
            {invoice.recipientClubOrSchool && invoice.recipientName !== invoice.recipientClubOrSchool && (
              <p className="text-xs text-slate-600 font-medium">
                Penanggung Jawab / Official: <b>{invoice.recipientName}</b>
              </p>
            )}
            <p className="text-[11px] text-slate-500 font-mono">
              Total Rombongan: <b>{invoice.athletes.length} Atlet</b> • <b>{totalEntriesCount} Nomor Lomba</b>
            </p>
          </div>

          <div className="space-y-1 sm:border-l sm:border-slate-200 sm:pl-4">
            <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
              Diterbitkan Oleh (Penyelenggara)
            </p>
            <p className="font-bold text-slate-950 text-sm">
              Panitia Pelaksana Kejuaraan Renang Rajendra Swim System
            </p>
            <p className="text-[11px] text-slate-600 leading-snug">
              Sekretariat Pertandingan &amp; Tim Keuangan
            </p>
            <p className="text-[10px] font-mono text-emerald-700 font-bold flex items-center gap-1">
              <BadgeCheck className="h-3 w-3" /> OFFICIAL TOURNAMENT INVOICE
            </p>
          </div>
        </div>

        {/* 3. RINCIAN BIAYA PER ATLET & NOMOR LOMBA */}
        <div className="space-y-2 mt-5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Rincian Biaya Nomor Perlombaan
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Mata Uang: IDR (Rupiah)</span>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-300 shadow-2xs">
            {/* Table Header Navy */}
            <div className="bg-[#0f2b5c] text-white px-4 py-2.5 text-xs font-bold flex justify-between items-center">
              <span className="uppercase tracking-wider">Deskripsi Atlet &amp; Nomor Perlombaan</span>
              <span className="uppercase tracking-wider">Biaya Pendaftaran</span>
            </div>

            {/* Athletes and events breakdown */}
            {invoice.athletes.map((group, gIdx) => (
              <div key={gIdx} className="border-b border-slate-200 last:border-b-0">
                {/* Participant Group Bar */}
                <div className="bg-slate-100/90 px-4 py-2 flex items-center justify-between border-b border-slate-200">
                  <div className="text-xs flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#0f2b5c] text-white text-[10px] font-mono font-bold">
                      {gIdx + 1}
                    </span>
                    <span className="font-bold text-slate-950 uppercase tracking-tight">
                      {group.athleteName}
                    </span>
                    <span className="text-slate-500 text-[11px] font-semibold">
                      ({group.gender === 'female' || group.gender === 'Perempuan' || group.gender === 'Putri' ? 'Putri' : 'Putra'})
                    </span>
                  </div>
                </div>

                {/* Individual Event Rows */}
                {group.items.map((item, iIdx) => (
                  <div
                    key={iIdx}
                    className="px-4 py-2 text-xs flex justify-between items-center text-slate-700 bg-white border-b border-slate-100 last:border-b-0 hover:bg-slate-50/60"
                  >
                    <span className="text-xs font-medium pl-6">
                      • {item.code ? <b className="font-mono text-blue-900 mr-1.5">{item.code}</b> : ''}
                      {item.name}
                    </span>
                    <span className="font-mono font-bold text-slate-900 shrink-0">
                      Rp {item.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}

                {/* Subtotal Peserta */}
                <div className="bg-slate-50/80 px-4 py-1.5 text-[11px] font-bold flex justify-between items-center text-slate-700 border-t border-slate-200">
                  <span className="pl-6 text-slate-500">Subtotal Atlet #{gIdx + 1}</span>
                  <span className="font-mono font-bold text-blue-950">
                    Rp {group.subtotal.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            ))}

            {/* Subtotal Total */}
            <div className="bg-white px-4 py-2.5 flex justify-between items-center border-t-2 border-slate-300">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">SUBTOTAL</span>
              <span className="text-sm font-bold text-slate-900 font-mono">
                Rp {invoice.subtotal.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Unique Code Row (if configured) */}
            {invoice.uniqueCode && invoice.uniqueCode > 0 ? (
              <div className="bg-amber-50 px-4 py-2 flex justify-between items-center border-t border-amber-200 text-xs">
                <span className="font-bold text-amber-900 flex items-center gap-1.5 text-[11px]">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Kode Unik Verifikasi Otomatis:
                </span>
                <span className="font-mono font-extrabold text-amber-900">
                  +Rp {invoice.uniqueCode.toLocaleString('id-ID')}
                </span>
              </div>
            ) : null}

            {/* Grand Total Bar Navy */}
            <div className="bg-[#0f2b5c] text-white px-4 py-3 flex justify-between items-center">
              <span className="text-sm sm:text-base font-black tracking-wider uppercase font-heading">
                TOTAL PEMBAYARAN (GRAND TOTAL)
              </span>
              <span className="text-base sm:text-xl font-black font-mono">
                Rp {invoice.grandTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* 4. RIWAYAT TRANSAKSI PEMBAYARAN */}
        {invoice.transactions.length > 0 && (
          <div className="space-y-2 mt-5">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              Riwayat Pembayaran &amp; Rekonsiliasi Kas
            </h3>

            <div className="overflow-hidden rounded-xl border border-slate-200 text-xs">
              <div className="bg-slate-100 px-4 py-2 font-bold text-slate-700 grid grid-cols-4 gap-2">
                <span>Tanggal</span>
                <span>Penyetor / Member</span>
                <span>Metode Pembayaran</span>
                <span className="text-right">Nominal</span>
              </div>

              {invoice.transactions.map((t, idx) => (
                <div
                  key={idx}
                  className="px-4 py-2.5 grid grid-cols-4 gap-2 items-center bg-white border-t border-slate-100"
                >
                  <span className="text-slate-600 font-mono text-[11px]">{t.date}</span>
                  <span className="font-semibold text-slate-900 truncate">{t.member}</span>
                  <span className="text-slate-600 truncate">{t.method}</span>
                  <span className="text-right font-mono font-bold text-emerald-700">
                    Rp {t.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. INFORMASI REKENING BANK & PETUNJUK TRANSFER */}
        <div className="mt-5 p-4 rounded-xl border border-blue-200 bg-blue-50/50 text-xs space-y-2">
          <div className="flex items-center justify-between border-b border-blue-200/80 pb-2">
            <span className="font-bold text-blue-950 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
              <CreditCard className="h-4 w-4 text-blue-600" /> REKENING RESMI TUJUAN TRANSFER
            </span>
            <span className="text-[10px] text-blue-700 font-medium">Panitia Kejuaraan Renang</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div className="space-y-0.5">
              <p className="font-bold text-slate-900 text-sm">{invoice.bankInfo.bankName}</p>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black text-blue-950 tracking-wider">
                  {invoice.bankInfo.accountNo}
                </span>
                <button
                  type="button"
                  onClick={handleCopyAccountNo}
                  className="no-print inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-blue-200 text-[10px] font-bold text-blue-700 hover:bg-blue-100 transition-colors cursor-pointer"
                  title="Salin Nomor Rekening"
                >
                  {copiedBank ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  {copiedBank ? 'Tersalin' : 'Salin Rekening'}
                </button>
              </div>
              <p className="text-slate-600 text-[11px]">
                Atas Nama: <b>{invoice.bankInfo.accountName}</b>
              </p>
            </div>

            <div className="text-left sm:text-right max-w-xs text-[11px] text-slate-600 leading-snug">
              <p className="font-bold text-blue-900">Petunjuk Penting:</p>
              <p>
                Cantumkan nomor invoice <b>#{invoice.invoiceNumber}</b> pada berita transfer untuk percepatan verifikasi data atlet.
              </p>
            </div>
          </div>
        </div>

        {/* 6. TANDA TANGAN & PENGESAHAN DOKUMEN + QR CODE */}
        <div className="mt-6 pt-4 border-t border-slate-300 flex items-center justify-between text-xs text-slate-800">
          {/* QR Code Verifikasi */}
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-slate-300 bg-white p-1 shadow-2xs">
              <QrCodeSvg value={verificationPayload} size={48} />
            </div>
            <div className="text-[10px] text-slate-500 space-y-0.5">
              <p className="font-mono font-black text-slate-900 uppercase">INVOICE VERIFIED</p>
              <p className="text-slate-600">Sistem Keuangan Rajendra Swim System</p>
              <p className="text-[9px] text-slate-400 font-mono">Status: {invoice.status}</p>
            </div>
          </div>

          {/* Pengesahan Bendahara */}
          <div className="text-center w-52 space-y-0.5">
            <p className="text-[11px] text-slate-500">Jakarta, {invoice.date}</p>
            <p className="font-bold text-slate-900 text-xs uppercase">Bendahara Kejuaraan,</p>
            <div className="h-12 flex items-center justify-center">
              <span className="text-[9px] uppercase font-mono font-bold text-slate-300 border border-dashed border-slate-300 px-3 py-1 rounded">
                STEMPEL LUNAS
              </span>
            </div>
            <p className="font-semibold text-slate-900 border-t border-slate-400 pt-1 text-xs">
              ( Seksi Keuangan Panitia )
            </p>
          </div>
        </div>

        {/* Footer Microtext */}
        <div className="mt-4 pt-2 border-t border-slate-200 flex items-center justify-between text-[9px] text-slate-400 font-mono">
          <span>Rajendra Swim System · Dokumen Invoice Kejuaraan Resmi</span>
          <span>Dicetak: {new Date().toLocaleString('id-ID')}</span>
        </div>
      </div>
    </div>
  );
}
