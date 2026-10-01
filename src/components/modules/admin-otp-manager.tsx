'use client';

import { useState, useMemo } from 'react';
import {
  KeyRound,
  Copy,
  MessageCircle,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  RefreshCw,
  Mail,
  ShieldCheck,
  Headphones,
  Check,
  Send,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { type AdminOtpRecord } from '@/lib/data/admin-otp-server';

export interface AdminOtpManagerProps {
  initialRecords: AdminOtpRecord[];
}

export function AdminOtpManager({ initialRecords }: AdminOtpManagerProps) {
  const [records, setRecords] = useState<AdminOtpRecord[]>(initialRecords);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'fallback' | 'active' | 'verified'>('all');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/admin/otp');
      const json = await res.json();
      if (res.ok && json.data) {
        setRecords(json.data);
        toast.success('Daftar kode OTP berhasil diperbarui');
      } else {
        toast.error(json.error || 'Gagal menyinkronkan data OTP');
      }
    } catch {
      toast.error('Gagal terhubung ke server');
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success(`Kode OTP ${code} disalin ke clipboard!`);
  };

  const handleOpenWhatsApp = (item: AdminOtpRecord) => {
    const text = encodeURIComponent(
      `Halo *${item.fullName || 'Peserta'}*, berikut adalah 6-digit kode OTP resmi verifikasi akun Rajendra Swim System Anda: *${item.code}*. Silakan masukkan kode ini pada formulir pendaftaran akun Anda. Kode berlaku selama 5 menit. Terima kasih.`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const filteredRecords = useMemo(() => {
    const now = Date.now();
    return records.filter((r) => {
      const isExpired = r.status === 'expired' || now > r.expiresAt;
      const isFallback = r.status === 'fallback_to_admin';
      const isVerified = r.status === 'verified';
      const isActive = !isExpired && !isVerified;

      if (statusFilter === 'fallback' && !isFallback) return false;
      if (statusFilter === 'active' && !isActive) return false;
      if (statusFilter === 'verified' && !isVerified) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchEmail = r.email.toLowerCase().includes(q);
        const matchName = (r.fullName || '').toLowerCase().includes(q);
        const matchCode = r.code.includes(q);
        return matchEmail || matchName || matchCode;
      }

      return true;
    });
  }, [records, statusFilter, searchQuery]);

  // Statistik KPI
  const stats = useMemo(() => {
    const now = Date.now();
    const fallbackCount = records.filter((r) => r.status === 'fallback_to_admin').length;
    const verifiedCount = records.filter((r) => r.status === 'verified').length;
    const activeCount = records.filter(
      (r) => r.status !== 'verified' && r.status !== 'expired' && now <= r.expiresAt
    ).length;
    const total = records.length;

    return { fallbackCount, verifiedCount, activeCount, total };
  }, [records]);

  return (
    <div className="space-y-6">
      {/* ── 1. BANNER NOTIFIKASI EDUKATIF KONDISI LIMITASI BREVO ── */}
      <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-r from-amber-50 via-orange-50/70 to-yellow-50 p-5 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-500 text-white shadow-xs">
              <Headphones className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-heading font-black text-sm text-amber-950">
                  Pusat Bantuan &amp; Darurat Kode OTP (Bypass Limitasi Email)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-200 text-amber-900 border border-amber-300">
                  Mode Penyelamat Admin
                </span>
              </div>
              <p className="text-xs text-amber-800 leading-relaxed max-w-3xl">
                Halaman ini difungsikan khusus ketika kuota pengiriman email Brevo mencapai batas harian (300 email/hari) atau email peserta terlambat masuk. Kode OTP 6-digit pendaftar otomatis terekam di sini sehingga panitia dapat memberikan kode langsung ke peserta via WhatsApp atau telepon.
              </p>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleRefresh}
            disabled={refreshing}
            variant="outline"
            className="h-9 px-3.5 text-xs font-bold rounded-xl border-amber-300 bg-white hover:bg-amber-100/60 text-amber-900 gap-1.5 shadow-2xs shrink-0 cursor-pointer"
          >
            <RefreshCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} />
            <span>Sinkronkan Ulang</span>
          </Button>
        </div>
      </div>

      {/* ── 2. KPI METRICS CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Kuota Habis / Perlu Bantuan Admin */}
        <div className="glass-panel p-5 border border-amber-200 bg-gradient-to-br from-amber-50/50 to-white rounded-2xl shadow-xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-amber-900">Perlu Bantuan Admin</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
              <AlertTriangle className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-heading font-black text-3xl text-amber-950 font-mono">
              {stats.fallbackCount}
            </span>
            <span className="text-xs font-semibold text-amber-700">Permintaan</span>
          </div>
          <p className="text-[11px] text-amber-600 mt-1">Kuota email habis / langsung ke panitia</p>
        </div>

        {/* Card 2: Kode OTP Aktif (Belum Kedaluwarsa) */}
        <div className="glass-panel p-5 border border-blue-200 bg-gradient-to-br from-blue-50/50 to-white rounded-2xl shadow-xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-blue-900">Kode OTP Aktif</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-800">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-heading font-black text-3xl text-blue-950 font-mono">
              {stats.activeCount}
            </span>
            <span className="text-xs font-semibold text-blue-700">Dalam 5 Menit</span>
          </div>
          <p className="text-[11px] text-blue-600 mt-1">Siap disalin &amp; diverifikasi</p>
        </div>

        {/* Card 3: Berhasil Diverifikasi */}
        <div className="glass-panel p-5 border border-emerald-200 bg-gradient-to-br from-emerald-50/50 to-white rounded-2xl shadow-xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-emerald-900">Telah Terverifikasi</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-heading font-black text-3xl text-emerald-950 font-mono">
              {stats.verifiedCount}
            </span>
            <span className="text-xs font-semibold text-emerald-700">Akun Valid</span>
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">Pendaftaran berhasil diselesaikan</p>
        </div>

        {/* Card 4: Total Rekaman OTP */}
        <div className="glass-panel p-5 border border-slate-200 bg-white rounded-2xl shadow-xs">
          <div className="flex items-start justify-between">
            <span className="text-xs font-bold text-slate-700">Total Riwayat OTP</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
              <KeyRound className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-heading font-black text-3xl text-slate-950 font-mono">
              {stats.total}
            </span>
            <span className="text-xs font-semibold text-slate-500">Log</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Tersimpan di sistem server</p>
        </div>
      </div>

      {/* ── 3. FILTER & PENCARIAN ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Cari berdasarkan email, nama, atau 6 digit OTP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9.5 h-10 text-xs rounded-xl border-slate-200 focus-visible:ring-blue-500/20"
            />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <Button
              type="button"
              variant={statusFilter === 'all' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('all')}
              className={cn(
                'h-9 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer',
                statusFilter === 'all'
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'border-slate-200 text-slate-600'
              )}
            >
              Semua ({records.length})
            </Button>

            <Button
              type="button"
              variant={statusFilter === 'fallback' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('fallback')}
              className={cn(
                'h-9 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer',
                statusFilter === 'fallback'
                  ? 'bg-amber-600 hover:bg-amber-700 text-white'
                  : 'border-amber-200 bg-amber-50 text-amber-900 hover:bg-amber-100/70'
              )}
            >
              ⚠️ Kuota Habis ({stats.fallbackCount})
            </Button>

            <Button
              type="button"
              variant={statusFilter === 'active' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('active')}
              className={cn(
                'h-9 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer',
                statusFilter === 'active'
                  ? 'bg-cyan-600 hover:bg-cyan-700 text-white'
                  : 'border-cyan-200 bg-cyan-50 text-cyan-900 hover:bg-cyan-100/70'
              )}
            >
              Aktif ({stats.activeCount})
            </Button>

            <Button
              type="button"
              variant={statusFilter === 'verified' ? 'default' : 'outline'}
              onClick={() => setStatusFilter('verified')}
              className={cn(
                'h-9 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer',
                statusFilter === 'verified'
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100/70'
              )}
            >
              Terverifikasi ({stats.verifiedCount})
            </Button>
          </div>
        </div>

        {/* ── 4. TABEL DAFTAR KODE OTP LENGKAP ── */}
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Pendaftar / Email</th>
                <th className="py-3 px-4 text-center">Kode OTP Resmi</th>
                <th className="py-3 px-4 text-center">Status / Metode</th>
                <th className="py-3 px-4">Waktu Dibuat</th>
                <th className="py-3 px-4 text-center">Sisa Waktu</th>
                <th className="py-3 px-4 text-center">Tindakan Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    <p className="font-semibold text-xs">Tidak ada rekaman kode OTP yang sesuai kriteria.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Setiap peserta yang menekan tombol verifikasi email akan otomatis tercatat di sini.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((item) => {
                  const now = Date.now();
                  const isExpired = item.status === 'expired' || now > item.expiresAt;
                  const isVerified = item.status === 'verified';
                  const isFallback = item.status === 'fallback_to_admin';
                  const remainingSeconds = Math.max(0, Math.floor((item.expiresAt - now) / 1000));
                  const remainingMinutes = Math.floor(remainingSeconds / 60);
                  const remainingSecMod = remainingSeconds % 60;

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        'hover:bg-slate-50/80 transition-colors',
                        isFallback && 'bg-amber-50/30'
                      )}
                    >
                      {/* Pendaftar */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <p className="font-bold text-slate-900 text-xs">
                            {item.fullName || 'Peserta Baru'}
                          </p>
                          <p className="font-mono text-[11px] text-slate-600 flex items-center gap-1">
                            <Mail className="h-3 w-3 text-slate-400" />
                            {item.email}
                          </p>
                        </div>
                      </td>

                      {/* Kode OTP (Hitam Tebal Kontras Tinggi) */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="inline-flex items-center gap-2 bg-slate-900 text-white px-3 py-1.5 rounded-xl shadow-xs">
                          <KeyRound className="h-3.5 w-3.5 text-amber-400" />
                          <span className="font-mono font-black text-base tracking-[3px] text-white">
                            {item.code}
                          </span>
                        </div>
                      </td>

                      {/* Status / Metode */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={cn(
                            'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border tracking-wide',
                            isVerified
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : isFallback
                              ? 'bg-amber-100 text-amber-900 border-amber-300 animate-pulse'
                              : isExpired
                              ? 'bg-slate-100 text-slate-600 border-slate-200'
                              : 'bg-blue-50 text-blue-900 border-blue-200'
                          )}
                        >
                          <span
                            className={cn(
                              'h-1.5 w-1.5 rounded-full',
                              isVerified
                                ? 'bg-emerald-600'
                                : isFallback
                                ? 'bg-amber-600'
                                : isExpired
                                ? 'bg-slate-400'
                                : 'bg-blue-600'
                            )}
                          />
                          {isVerified
                            ? 'Terverifikasi'
                            : isFallback
                            ? 'Bypass Kuota (Ke Admin)'
                            : isExpired
                            ? 'Kedaluwarsa'
                            : 'Terkirim via Email'}
                        </span>
                      </td>

                      {/* Waktu Dibuat */}
                      <td className="py-3.5 px-4 text-slate-600 text-[11px]">
                        {new Date(item.createdAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}{' '}
                        •{' '}
                        {new Date(item.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </td>

                      {/* Sisa Waktu */}
                      <td className="py-3.5 px-4 text-center">
                        {isVerified ? (
                          <span className="text-[11px] font-semibold text-emerald-700 inline-flex items-center gap-1">
                            <Check className="h-3 w-3" /> Sukses
                          </span>
                        ) : isExpired ? (
                          <span className="text-[11px] font-semibold text-slate-400">00:00 (Habis)</span>
                        ) : (
                          <span className="font-mono text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            {String(remainingMinutes).padStart(2, '0')}:
                            {String(remainingSecMod).padStart(2, '0')}
                          </span>
                        )}
                      </td>

                      {/* Aksi Cepat */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopyCode(item.code)}
                            className="h-8 px-2.5 text-[11px] font-bold rounded-lg border-slate-300 hover:bg-blue-50 hover:text-blue-700 gap-1 cursor-pointer"
                            title="Salin kode OTP ke clipboard"
                          >
                            <Copy className="h-3 w-3" />
                            <span>Salin</span>
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            onClick={() => handleOpenWhatsApp(item)}
                            className="h-8 px-2.5 text-[11px] font-bold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white gap-1 shadow-2xs cursor-pointer"
                            title="Kirim kode ke WhatsApp peserta"
                          >
                            <MessageCircle className="h-3 w-3" />
                            <span>WhatsApp</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
