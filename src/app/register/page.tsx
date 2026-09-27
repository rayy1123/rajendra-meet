'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import {
  User,
  Lock,
  Phone,
  School,
  Eye,
  EyeOff,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  Info,
  Check,
} from 'lucide-react';
import { SplitAuthShell } from '@/components/layout/split-auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BrandedSpinner } from '@/components/ui/branded-loading';
import { cn } from '@/lib/utils';

interface SchoolOption {
  id: string;
  name: string;
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    password: '',
    confirm_password: '',
    phone: '',
  });
  const [affiliationType, setAffiliationType] = useState<'club' | 'independent'>('club');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [schoolsLoaded, setSchoolsLoaded] = useState(false);

  const loadSchools = async () => {
    try {
      const res = await fetch('/api/schools');
      if (res.ok) {
        const data = await res.json();
        const schoolsData = Array.isArray(data) ? data : data?.data ?? [];
        setSchools(
          schoolsData.map((s: any) => ({
            id: s.id,
            name: s.name,
          }))
        );
      }
    } finally {
      setSchoolsLoaded(true);
    }
  };

  useEffect(() => {
    if (!schoolsLoaded) {
      loadSchools();
    }
  }, [schoolsLoaded]);

  const passwordsMatch = form.password && form.confirm_password && form.password === form.confirm_password;
  const passwordLengthOk = form.password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (affiliationType === 'club' && !selectedSchoolId) {
      setErrorMsg('Pilih klub atau kontingen asal Anda. Jika belum terafiliasi, pilih opsi Perorangan / Mandiri.');
      setLoading(false);
      return;
    }

    if (!form.full_name || !form.username || !form.password) {
      setErrorMsg('Nama lengkap, username, dan kata sandi wajib diisi.');
      setLoading(false);
      return;
    }

    if (form.password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      setLoading(false);
      return;
    }

    if (form.password !== form.confirm_password) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          username: form.username,
          password: form.password,
          school_id: affiliationType === 'club' ? selectedSchoolId : null,
          phone: form.phone || null,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const msg = payload?.error || 'Gagal membuat akun.';
        throw new Error(msg);
      }

      setSuccessMsg('Pendaftaran akun berhasil! Mengalihkan ke halaman masuk...');
      toast.success('Pendaftaran akun berhasil!');
      setForm({
        full_name: '',
        username: '',
        password: '',
        confirm_password: '',
        phone: '',
      });
      setSelectedSchoolId(null);
      setTimeout(() => {
        window.location.assign('/login');
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SplitAuthShell
      title="Daftar Akun Peserta"
      subtitle="Buka akun resmi untuk mendaftarkan atlet, mengunggah bukti transfer, dan mengunduh ID Pass kejuaraan."
      footerLinks={[
        { label: 'Bantuan Teknis', href: '/guide' },
        { label: 'Juknis Lomba', href: '/juknis' },
        { label: 'Masuk Akun', href: '/login' },
      ]}
    >
      {/* Tipe Afiliasi: Klub vs Mandiri */}
      <div className="space-y-2 pb-1">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Kategori Pendaftar:
        </label>
        <div className="grid grid-cols-2 gap-2 text-center text-xs">
          <button
            type="button"
            onClick={() => setAffiliationType('club')}
            className={cn(
              'p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer',
              affiliationType === 'club'
                ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            <School className="h-4 w-4 text-blue-600" />
            <span>Afiliasi Klub / Sekolah</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setAffiliationType('independent');
              setSelectedSchoolId(null);
            }}
            className={cn(
              'p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer',
              affiliationType === 'independent'
                ? 'bg-cyan-50 border-cyan-400 text-cyan-900 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            <User className="h-4 w-4 text-cyan-600" />
            <span>Perorangan / Mandiri</span>
          </button>
        </div>
      </div>

      {(errorMsg || successMsg) && (
        <div className="space-y-2">
          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 shadow-2xs flex items-center gap-2">
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-red-200 text-red-900 font-bold">!</span>
              <span>{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800 shadow-2xs flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3.5">
        {/* Pilihan Kontingen Klub (Jika tipe klub) */}
        {affiliationType === 'club' && (
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
              <span>Nama Klub / Sekolah</span>
              <span className="text-[10px] text-blue-600 font-semibold">*Wajib dipilih</span>
            </label>
            <Select
              value={selectedSchoolId ?? ''}
              onValueChange={(v) => setSelectedSchoolId(v || null)}
            >
              <SelectTrigger className="h-10 rounded-xl bg-white border-slate-300 text-xs font-semibold text-slate-900 focus-visible:ring-2 focus-visible:ring-blue-500/20 shadow-2xs">
                <SelectValue placeholder="-- Pilih Kontingen Klub / Sekolah --" />
              </SelectTrigger>
              <SelectContent>
                {schools.map((s) => (
                  <SelectItem key={s.id} value={s.id} className="text-xs">
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Nama Lengkap */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-900">Nama Lengkap Penanggung Jawab / Wali</label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Nama sesuai KTP / Identitas resmi"
              className="h-10 rounded-xl bg-white pl-9 text-xs font-medium text-slate-900 border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 shadow-2xs"
              value={form.full_name}
              onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))}
              required
            />
          </div>
        </div>

        {/* Username & Nomor WhatsApp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900">Username Login</label>
            <Input
              type="text"
              placeholder="huruf_kecil_angka"
              className="h-10 rounded-xl bg-white text-xs font-mono text-slate-900 border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 shadow-2xs"
              value={form.username}
              onChange={(e) =>
                setForm((s) => ({
                  ...s,
                  username: e.target.value.toLowerCase().replace(/\s+/g, '_'),
                }))
              }
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900">Nomor WhatsApp / HP</label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                type="tel"
                placeholder="08xxxxxxxxxx"
                className="h-10 rounded-xl bg-white pl-9 text-xs font-medium text-slate-900 border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 shadow-2xs"
                value={form.phone}
                onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
              />
            </div>
          </div>
        </div>

        {/* Kata Sandi & Konfirmasi */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900">Kata Sandi</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Min. 6 karakter"
                className="h-10 rounded-xl bg-white pl-9 pr-8 text-xs font-medium text-slate-900 border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 shadow-2xs"
                value={form.password}
                onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
              <span>Ulangi Kata Sandi</span>
              {passwordsMatch && (
                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-0.5">
                  <Check className="h-3 w-3" /> Cocok
                </span>
              )}
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Ulangi kata sandi"
                className={cn(
                  'h-10 rounded-xl bg-white pl-9 pr-8 text-xs font-medium text-slate-900 border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 shadow-2xs',
                  passwordsMatch ? 'border-emerald-400 focus-visible:border-emerald-500' : ''
                )}
                value={form.confirm_password}
                onChange={(e) => setForm((s) => ({ ...s, confirm_password: e.target.value }))}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-700"
              >
                {showConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <Button
            type="submit"
            className="w-full h-11 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <BrandedSpinner className="h-4 w-4" />
                <span>Mendaftarkan Akun...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <span>Daftar Akun Peserta</span>
                <ArrowRight className="h-4 w-4" />
              </span>
            )}
          </Button>
        </div>
      </form>

      {/* Footer Link to Login */}
      <div className="mt-5 pt-4 border-t border-slate-100 text-center text-xs text-slate-600 space-y-2">
        <p>
          Sudah memiliki akun resmi?{' '}
          <Link href="/login" className="font-bold text-blue-600 hover:text-blue-800 hover:underline">
            Masuk Sekarang &rarr;
          </Link>
        </p>

        <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5 pt-1">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
          Data atlet terlindungi dan terhubung langsung ke basis data Rajendra Meet.
        </p>
      </div>
    </SplitAuthShell>
  );
}
