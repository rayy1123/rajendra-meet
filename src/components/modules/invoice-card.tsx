'use client';

import { Printer, ArrowLeft, CheckCircle2, Clock, XCircle } from 'lucide-react';
import Link from 'next/link';

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
  className = '',
}: {
  invoice: InvoiceData;
  backUrl?: string;
  hideActionBar?: boolean;
  className?: string;
}) {
  const isPaid = invoice.status === 'PAID' || invoice.status === 'VERIFIED';
  const isPending = invoice.status === 'PENDING' || invoice.status === 'UNPAID';

  const statusBadge = isPaid ? (
    <span className="text-[#10b981] font-bold uppercase tracking-wider">
      PAID
    </span>
  ) : invoice.status === 'REJECTED' ? (
    <span className="text-red-400 font-bold uppercase tracking-wider">
      REJECTED
    </span>
  ) : (
    <span className="text-[#f59e0b] font-bold uppercase tracking-wider">
      UNPAID
    </span>
  );

  return (
    <div className={`mx-auto w-full max-w-3xl space-y-4 ${className}`}>
      {/* Action Bar (Hidden on Print & can be hidden if modal has dedicated toolbar) */}
      {!hideActionBar && (
        <div className="flex items-center justify-between no-print px-2 sm:px-0">
          <Link
            href={backUrl}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Link>
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-lg bg-[#1b2e4b] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#14243b] transition-colors"
          >
            <Printer className="h-4 w-4" /> Cetak / Unduh PDF
          </button>
        </div>
      )}

      {/* INVOICE SHEET (A4 ratio friendly, matching reference image) */}
      <div className="invoice-paper relative rounded-xl bg-white text-slate-900 shadow-md border border-slate-200 overflow-hidden p-6 sm:p-9 print:p-0 print:border-0 print:shadow-none print:rounded-none">
        
        {/* 1. Header Banner Dark Navy Blue #1b2e4b */}
        <div className="bg-[#1b2e4b] text-white p-6 sm:p-7 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-1.5 text-xs">
            <h1 className="text-lg sm:text-xl font-extrabold tracking-tight uppercase text-white">
              INVOICE #{invoice.invoiceNumber}
            </h1>
            <p className="text-slate-200 text-xs">
              <span className="font-semibold text-slate-300">Subjek:</span> {invoice.subject}
            </p>
            <p className="text-slate-200 text-xs">
              <span className="font-semibold text-slate-300">Tanggal:</span> {invoice.date}
            </p>
            <p className="text-slate-200 text-xs">
              <span className="font-semibold text-slate-300">Jatuh Tempo:</span> {invoice.dueDate}
            </p>
            <p className="text-slate-200 text-xs pt-0.5">
              <span className="font-semibold text-slate-300 mr-1.5">Status:</span>
              {statusBadge}
            </p>
          </div>

          {/* Logo Rajendra Meet (4-wave emblem + typography matching reference image) */}
          <div className="flex flex-col items-start sm:items-center justify-center text-center shrink-0 pr-1">
            <div className="flex flex-col items-center">
              {/* 4-layer Wavy Swimming Emblem */}
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
        </div>

        {/* Separator Line beneath Banner */}
        <div className="border-b border-slate-300 my-4" />

        {/* 2. Ditujukan Kepada */}
        <div className="space-y-1">
          <p className="text-xs text-slate-500 font-normal">Ditujukan Kepada</p>
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight uppercase">
            {invoice.recipientClubOrSchool || invoice.recipientName}
          </h2>
          {invoice.recipientClubOrSchool && invoice.recipientName !== invoice.recipientClubOrSchool && (
            <p className="text-xs text-slate-500">Pendaftar: {invoice.recipientName}</p>
          )}
        </div>

        {/* Divider beneath Ditujukan Kepada */}
        <div className="border-b border-slate-400/90 my-3.5" />

        {/* 3. Rincian Biaya */}
        <div className="space-y-2.5">
          <h3 className="text-sm font-bold text-slate-900">Rincian Biaya</h3>

          <div className="overflow-hidden border border-slate-200">
            {/* Table Header Navy */}
            <div className="bg-[#1b2e4b] text-white px-4 py-2 text-xs font-bold flex justify-between items-center">
              <span>Deskripsi</span>
              <span>Harga</span>
            </div>

            {/* Athletes and events breakdown */}
            {invoice.athletes.map((group, gIdx) => (
              <div key={gIdx} className="border-b border-slate-200 last:border-b-0">
                {/* Participant Bar */}
                <div className="bg-white px-4 py-2 flex items-center justify-between border-b border-slate-200">
                  <div className="text-xs">
                    <span className="font-bold text-slate-900 uppercase tracking-tight">{group.athleteName}</span>
                    <span className="text-slate-500 ml-2 font-normal">
                      ({group.gender}{group.birthDate ? `, ${group.birthDate}` : ''})
                    </span>
                  </div>
                </div>

                {/* Individual Event Rows */}
                {group.items.map((item, iIdx) => (
                  <div key={iIdx} className="px-4 py-2 text-xs flex justify-between items-center text-slate-700 bg-white border-b border-slate-100 last:border-b-0">
                    <span className="text-xs">
                      - {item.code ? `${item.code} - ` : ''}{item.name}
                    </span>
                    <span className="font-medium text-slate-800 shrink-0">
                      Rp. {item.price.toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}

                {/* Subtotal Peserta */}
                <div className="bg-[#1b2e4b] text-white px-4 py-2 text-xs font-bold flex justify-between items-center">
                  <span>Subtotal Peserta</span>
                  <span>Rp. {group.subtotal.toLocaleString('id-ID')}</span>
                </div>
              </div>
            ))}

            {/* Subtotal Total */}
            <div className="bg-white px-4 py-3 flex justify-between items-center border-t border-slate-300">
              <span className="text-base font-extrabold text-slate-900 uppercase tracking-wide">SUBTOTAL</span>
              <span className="text-base font-extrabold text-slate-900">
                Rp. {invoice.subtotal.toLocaleString('id-ID')}
              </span>
            </div>

            {/* Unique Code Row (if configured) */}
            {invoice.uniqueCode && invoice.uniqueCode > 0 ? (
              <div className="bg-amber-50/70 px-4 py-2 flex justify-between items-center border-t border-amber-200 text-xs">
                <span className="font-semibold text-amber-900 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  Kode Unik Transfer:
                </span>
                <span className="font-extrabold text-amber-900">
                  +Rp. {invoice.uniqueCode.toLocaleString('id-ID')}
                </span>
              </div>
            ) : null}

            {/* Grand Total Bar Navy */}
            <div className="bg-[#1b2e4b] text-white px-4 py-3 flex justify-between items-center">
              <span className="text-base sm:text-lg font-black tracking-wider uppercase">GRAND TOTAL</span>
              <span className="text-base sm:text-lg font-black">
                Rp. {invoice.grandTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Transaksi */}
        <div className="space-y-2.5 mt-6">
          <h3 className="text-sm font-bold text-slate-900">Transaksi</h3>

          <div className="overflow-hidden border border-slate-200">
            <div className="bg-[#1b2e4b] text-white px-4 py-2 text-xs font-bold grid grid-cols-4 gap-2">
              <span>Tanggal Transaksi</span>
              <span>Nama Anggota</span>
              <span>Metode Pembayaran</span>
              <span className="text-right">Jumlah</span>
            </div>

            {invoice.transactions.length === 0 ? (
              <div className="p-3 text-center text-xs text-slate-600 bg-white">
                Belum Ada Transaksi
              </div>
            ) : (
              invoice.transactions.map((t, idx) => (
                <div key={idx} className="px-4 py-2.5 text-xs grid grid-cols-4 gap-2 items-center bg-white border-t border-slate-100">
                  <span className="text-slate-600">{t.date}</span>
                  <span className="font-medium text-slate-800">{t.member}</span>
                  <span className="text-slate-600">{t.method}</span>
                  <span className="text-right font-bold text-slate-900">
                    Rp. {t.amount.toLocaleString('id-ID')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 5. Informasi Pembayaran / Transfer Bank Box */}
        <div className="border border-slate-300 bg-[#f8fafc] p-4 border-l-4 border-l-[#1b2e4b] mt-7 text-xs space-y-1.5">
          <p className="font-bold text-[#1b2e4b] text-[11px] uppercase tracking-wider">
            INFORMASI PEMBAYARAN / TRANSFER BANK
          </p>
          <div className="border-t border-dashed border-slate-300 pt-2 space-y-1">
            <p className="font-semibold text-slate-800">{invoice.bankInfo.bankName}</p>
            <p className="font-mono text-slate-900 font-bold">
              No. {invoice.bankInfo.accountNo}
            </p>
            <p className="text-slate-600">a.n {invoice.bankInfo.accountName}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
