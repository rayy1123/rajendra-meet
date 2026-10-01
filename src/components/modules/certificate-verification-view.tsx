'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Award,
  Trophy,
  CheckCircle2,
  Calendar,
  School,
  User,
  Clock,
  Sparkles,
  Printer,
  ExternalLink,
  ArrowRight,
  Search,
  Check,
  Flame,
  Radio,
  Building2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatMsToTime } from '@/lib/utils';
import { formatCompEventSubtitle } from '@/lib/age-category';

export interface VerifiedCertificateData {
  id: string;
  certNumber: string;
  athleteName: string;
  athleteNumber?: string;
  schoolName: string;
  gender: string;
  ageGroup: string;
  eventName: string;
  eventDate?: string;
  eventLocation?: string;
  competitionEventName: string;
  stroke?: string;
  distanceMeters?: number;
  rank: number;
  finishTimeMs: number | null;
  formattedTime: string;
  isNewRecord?: boolean;
  recordType?: string;
  verifiedAt: string;
  technicalDelegate?: string;
  chairmanName?: string;
}

export function CertificateVerificationView({
  certData,
  searchId = '',
}: {
  certData: VerifiedCertificateData | null;
  searchId?: string;
}) {
  const [searchInput, setSearchInput] = useState(searchId);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    window.location.assign(`/verifikasi/${encodeURIComponent(searchInput.trim())}`);
  };

  const isMedalist = certData && certData.rank <= 3;
  const isGold = certData?.rank === 1;
  const isSilver = certData?.rank === 2;
  const isBronze = certData?.rank === 3;

  const medalLabel = isGold
    ? 'JUARA I (MEDALI EMAS)'
    : isSilver
    ? 'JUARA II (MEDALI PERAK)'
    : isBronze
    ? 'JUARA III (MEDALI PERUNGGU)'
    : `PERINGKAT KE-${certData?.rank || 1}`;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* ── Search Bar Lookup (Cari No. Sertifikat / ID) ── */}
      <div className="rounded-2xl border border-[var(--m-border)] bg-white p-5 shadow-xs">
        <form onSubmit={handleSearch} className="space-y-2">
          <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
            <span>Cek Keabsahan Sertifikat &amp; Piagam Juara</span>
            <span className="text-[10px] text-slate-400 font-normal">
              Masukkan ID Hasil / Nomor Sertifikat / Pindai QR
            </span>
          </label>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                type="text"
                placeholder="Contoh: RM-CERT-2026 atau ID Atlet / Hasil..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-10 h-10 text-xs rounded-xl bg-slate-50 border-slate-200"
              />
            </div>
            <Button
              type="submit"
              className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs"
            >
              Verifikasi
            </Button>
          </div>
        </form>
      </div>

      {certData ? (
        /* ── Official Verified Certificate Card ── */
        <div className="rounded-3xl border border-emerald-200 bg-white p-6 sm:p-8 shadow-sm space-y-6 relative overflow-hidden">
          {/* Top Verification Status Strip */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3.5">
              <div className="h-12 w-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-sm shrink-0">
                <ShieldCheck className="h-7 w-7 stroke-[2.5]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full border border-emerald-300">
                    ✓ TERVERIFIKASI RESMI
                  </span>
                  <span className="text-xs font-mono text-slate-400">
                    ID: {certData.id.slice(0, 16)}
                  </span>
                </div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 mt-1 leading-tight">
                  Sertifikat &amp; Piagam Prestasi Terdaftar
                </h1>
                <p className="text-xs text-slate-500">
                  Diverifikasi oleh Rajendra Swim System Official Meet Sanction Engine.
                </p>
              </div>
            </div>

            <div className="text-left sm:text-right shrink-0">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">
                Nomor Register Sertifikat
              </span>
              <p className="font-mono font-black text-slate-900 text-sm mt-0.5">
                {certData.certNumber}
              </p>
            </div>
          </div>

          {/* Award / Medal Banner */}
          <div
            className={`p-5 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-4 ${
              isGold
                ? 'bg-gradient-to-r from-amber-500/10 via-amber-100/40 to-amber-500/10 border-amber-300'
                : isSilver
                ? 'bg-gradient-to-r from-slate-200/50 via-slate-100/50 to-slate-200/50 border-slate-300'
                : isBronze
                ? 'bg-gradient-to-r from-amber-700/10 via-amber-600/10 to-amber-700/10 border-amber-600/30'
                : 'bg-blue-50/50 border-blue-200'
            }`}
          >
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div
                className={`h-14 w-14 rounded-2xl flex items-center justify-center text-white shadow-sm shrink-0 ${
                  isGold
                    ? 'bg-amber-500 ring-4 ring-amber-200'
                    : isSilver
                    ? 'bg-slate-400 ring-4 ring-slate-200'
                    : isBronze
                    ? 'bg-amber-700 ring-4 ring-amber-200'
                    : 'bg-blue-600 ring-4 ring-blue-200'
                }`}
              >
                {isMedalist ? <Trophy className="h-7 w-7" /> : <Award className="h-7 w-7" />}
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                  Peringkat / Pencapaian Lomba
                </span>
                <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                  {medalLabel}
                </h2>
                {certData.isNewRecord && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full border border-rose-300 mt-1">
                    <Sparkles className="h-3 w-3" /> Rekor Baru Terpecahkan
                  </span>
                )}
              </div>
            </div>

            <div className="text-center sm:text-right bg-white/80 backdrop-blur-xs px-4 py-2.5 rounded-xl border border-slate-200 shadow-2xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 block">
                Catatan Waktu Resmi
              </span>
              <p className="text-xl sm:text-2xl font-mono font-black text-slate-900 mt-0.5">
                {certData.formattedTime} detik
              </p>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Biodata Atlet Card */}
            <div className="p-4.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                <User className="h-4 w-4 text-blue-600" /> Data Perenang
              </h3>

              <div className="space-y-2 divide-y divide-slate-100">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500">Nama Atlet:</span>
                  <span className="font-bold text-slate-900 text-sm">{certData.athleteName}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500">Klub / Sekolah:</span>
                  <span className="font-semibold text-slate-800">{certData.schoolName}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500">Gender &amp; Kelompok Usia:</span>
                  <span className="font-semibold text-slate-800">
                    {certData.gender === 'female' || certData.gender === 'Putri' ? 'Putri' : 'Putra'} &bull; {certData.ageGroup}
                  </span>
                </div>
                {certData.athleteNumber && (
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-slate-500">No. Dada Atlet:</span>
                    <span className="font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      #{certData.athleteNumber}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Event & Kejuaraan Card */}
            <div className="p-4.5 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3 text-xs">
              <h3 className="font-bold text-slate-900 flex items-center gap-2 text-xs uppercase tracking-wider">
                <Calendar className="h-4 w-4 text-blue-600" /> Kejuaraan &amp; Nomor Acara
              </h3>

              <div className="space-y-2 divide-y divide-slate-100">
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500">Kejuaraan:</span>
                  <span className="font-bold text-slate-900 text-right max-w-[200px] truncate">
                    {certData.eventName}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500">Nomor Perlombaan:</span>
                  <span className="font-bold text-blue-900 text-right">
                    {certData.competitionEventName}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500">Tanggal Perlombaan:</span>
                  <span className="text-slate-700">{certData.eventDate || 'Oktober 2026'}</span>
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-slate-500">Lokasi Kolam:</span>
                  <span className="text-slate-700">{certData.eventLocation || 'Kolam Renang Resmi'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Otoritas & Tanda Tangan Digital Stamp */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo.png"
                alt="Rajendra Swim System"
                className="h-8 w-auto object-contain bg-white rounded-lg p-1 border border-slate-200"
              />
              <div>
                <p className="font-bold text-slate-900">Pengesahan Otoritas Teknis</p>
                <p className="text-[11px] text-slate-500">
                  Technical Delegate: {certData.technicalDelegate || 'Official TD'} &bull; Ketua Panitia: {certData.chairmanName || 'Panitia Pelaksana'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl">
              <Check className="h-4 w-4 text-emerald-600 stroke-[3]" />
              <span>Tanda Tangan Terotentikasi</span>
            </div>
          </div>

          {/* Action Footer Buttons */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 hover:underline"
            >
              &larr; Kembali ke Beranda
            </Link>

            <div className="flex items-center gap-2">
              <Link
                href="/scoreboard"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors shadow-2xs"
              >
                <Radio className="h-3.5 w-3.5 text-blue-600" /> Cek Live Scoreboard
              </Link>
              <Link
                href="/rankings"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-colors shadow-xs"
              >
                <Trophy className="h-3.5 w-3.5" /> Lihat Hasil Lengkap
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* ── Empty / Prompt State ── */
        <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-slate-500 space-y-3">
          <Award className="h-12 w-12 mx-auto text-slate-300" />
          <div>
            <h2 className="text-base font-bold text-slate-800">Verifikasi Dokumen Kejuaraan</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">
              Gunakan kamera ponsel Anda untuk memindai QR code pada piagam juara, atau ketikkan nomor register sertifikat pada kolom pencarian di atas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
