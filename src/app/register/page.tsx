'use client';

import { useMemo } from 'react';
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
  Plus,
  X,
  Building2,
  Search,
  ChevronDown,
} from 'lucide-react';
import { SplitAuthShell } from '@/components/layout/split-auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BrandedSpinner } from '@/components/ui/branded-loading';
import { EmailOtpDialog } from '@/components/modules/email-otp-dialog';
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
  const [showAddClubModal, setShowAddClubModal] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubCity, setNewClubCity] = useState('');
  const [savingNewClub, setSavingNewClub] = useState(false);
  const [clubSearchQuery, setClubSearchQuery] = useState('');
  const [isClubDropdownOpen, setIsClubDropdownOpen] = useState(false);

  // OTP Verification States
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [targetOtpEmail, setTargetOtpEmail] = useState('');

  const filteredSchools = useMemo(() => {
    if (!clubSearchQuery.trim()) return schools;
    const q = clubSearchQuery.toLowerCase();
    return schools.filter((s) => s.name.toLowerCase().includes(q));
  }, [schools, clubSearchQuery]);

  const selectedSchool = schools.find((s) => s.id === selectedSchoolId);

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

  const handleCreateClub = async () => {
    const trimmedName = newClubName.trim();
    if (!trimmedName) {
      toast.error('Nama klub atau kontingen sekolah wajib diisi.');
      return;
    }
    setSavingNewClub(true);
    try {
      const res = await fetch('/api/schools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          city: newClubCity.trim() || null,
        }),
      });
      const data = await res.json();
      if (res.ok && data?.data) {
        const created: SchoolOption = {
          id: data.data.id,
          name: data.data.name,
        };
        setSchools((prev) => [created, ...prev.filter((s) => s.id !== created.id)]);
        setSelectedSchoolId(created.id);
        setShowAddClubModal(false);
        setNewClubName('');
        setNewClubCity('');
        toast.success(`Klub "${created.name}" berhasil ditambahkan dan dipilih!`);
      } else {
        toast.error(data.error || 'Gagal menambahkan klub.');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menambahkan klub.');
    } finally {
      setSavingNewClub(false);
    }
  };

  useEffect(() => {
    if (!schoolsLoaded) {
      loadSchools();
    }
  }, [schoolsLoaded]);

  const passwordsMatch = form.password && form.confirm_password && form.password === form.confirm_password;
  const passwordLengthOk = form.password.length >= 6;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (affiliationType === 'club' && !selectedSchoolId) {
      setErrorMsg('Pilih klub atau kontingen asal Anda. Jika belum terafiliasi, pilih opsi Perorangan / Mandiri.');
      return;
    }

    if (!form.full_name || !form.username || !form.password) {
      setErrorMsg('Nama lengkap, username, dan kata sandi wajib diisi.');
      return;
    }

    if (form.password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      return;
    }

    if (form.password !== form.confirm_password) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    // Tentukan email pendaftaran (jika input username berupa email atau username biasa)
    const rawUsername = form.username.trim().toLowerCase();
    const resolvedEmail = rawUsername.includes('@')
      ? rawUsername
      : `${rawUsername}@gmail.com`;

    setTargetOtpEmail(resolvedEmail);
    setShowOtpModal(true);
  };

  const executeFinalRegistration = async () => {
    setShowOtpModal(false);
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          username: form.username,
          email: targetOtpEmail,
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

      setSuccessMsg('Email terverifikasi & Pendaftaran akun berhasil! Mengalihkan ke halaman masuk...');
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
          <div className="space-y-1.5 relative">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <School className="h-3.5 w-3.5 text-blue-600" />
                <span>Nama Klub / Kontingen Sekolah</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setNewClubName(clubSearchQuery || '');
                  setShowAddClubModal(true);
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                <Plus className="h-3 w-3" /> Tambah Klub Baru
              </button>
            </div>

            {/* Custom Searchable Select Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsClubDropdownOpen((v) => !v)}
                className="flex h-10 w-full items-center justify-between rounded-xl bg-white border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
              >
                <span className={selectedSchool ? 'text-slate-900 font-bold truncate' : 'text-slate-400 font-medium truncate'}>
                  {selectedSchool ? selectedSchool.name : '-- Pilih Kontingen Klub / Sekolah --'}
                </span>
                <ChevronDown className="h-4 w-4 text-slate-400 shrink-0 ml-1" />
              </button>

              {/* Searchable Dropdown Popup */}
              {isClubDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsClubDropdownOpen(false)}
                  />
                  <div className="absolute left-0 right-0 top-11 z-50 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl animate-in fade-in zoom-in-95 space-y-1.5 max-h-72 flex flex-col">
                    {/* Search Input Bar */}
                    <div className="relative shrink-0 px-1 pt-1">
                      <Search className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari nama klub atau sekolah..."
                        value={clubSearchQuery}
                        onChange={(e) => setClubSearchQuery(e.target.value)}
                        className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-8 pr-3 py-1.5 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                        autoFocus
                      />
                    </div>

                    {/* Action Item: Tambahkan Klub Baru */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsClubDropdownOpen(false);
                        setNewClubName(clubSearchQuery || '');
                        setShowAddClubModal(true);
                      }}
                      className="flex w-full items-center gap-1.5 rounded-xl bg-blue-50/80 px-3 py-2 text-xs font-bold text-blue-700 hover:bg-blue-100 transition-colors shrink-0 text-left cursor-pointer border border-blue-100"
                    >
                      <Plus className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                      <span className="truncate">+ Tambahkan Klub Baru {clubSearchQuery ? `"${clubSearchQuery}"` : ''}...</span>
                    </button>

                    {/* List Option Items */}
                    <div className="flex-1 overflow-y-auto space-y-0.5 pr-0.5 max-h-48">
                      {filteredSchools.length === 0 ? (
                        <div className="p-3 text-center text-xs text-slate-500 space-y-1">
                          <p className="font-medium text-slate-600">Tidak ada klub yang cocok dengan &quot;{clubSearchQuery}&quot;</p>
                          <button
                            type="button"
                            onClick={() => {
                              setIsClubDropdownOpen(false);
                              setNewClubName(clubSearchQuery);
                              setShowAddClubModal(true);
                            }}
                            className="font-bold text-blue-600 hover:underline cursor-pointer inline-block pt-0.5"
                          >
                            + Daftarkan Klub &quot;{clubSearchQuery}&quot; Sekarang
                          </button>
                        </div>
                      ) : (
                        filteredSchools.map((s) => {
                          const isSel = s.id === selectedSchoolId;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => {
                                setSelectedSchoolId(s.id);
                                setIsClubDropdownOpen(false);
                              }}
                              className={cn(
                                'flex w-full items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-colors text-left cursor-pointer',
                                isSel
                                  ? 'bg-blue-50 text-blue-900 font-bold'
                                  : 'text-slate-800 hover:bg-slate-50'
                              )}
                            >
                              <span className="truncate">{s.name}</span>
                              {isSel && <Check className="h-3.5 w-3.5 text-blue-600 shrink-0 ml-1" />}
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
            <p className="text-[10px] text-slate-500">
              Klub Anda belum ada di daftar? Cari di atas atau klik{' '}
              <button
                type="button"
                onClick={() => {
                  setNewClubName(clubSearchQuery || '');
                  setShowAddClubModal(true);
                }}
                className="text-blue-600 font-bold underline cursor-pointer"
              >
                Tambah Klub Baru
              </button>{' '}
              untuk mendaftarkannya secara instan.
            </p>
          </div>
        )}

        {/* Username (Nama Lengkap) */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-slate-900">Username (Nama Lengkap)</label>
          <div className="relative">
            <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Nama lengkap / identitas resmi"
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
            <label className="text-xs font-bold text-slate-900">Email Login</label>
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
          Data atlet terlindungi dan terhubung langsung ke basis data Rajendra Swim System.
        </p>
      </div>

      {/* Modal Tambah Klub / Kontingen Baru */}
      {showAddClubModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <School className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Tambah Klub / Kontingen Baru</h3>
                  <p className="text-[11px] text-slate-500">Daftarkan nama klub Anda untuk akun pendaftaran</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddClubModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Nama Klub / Sekolah *</label>
                <Input
                  type="text"
                  placeholder="Contoh: Tirta Jaya Swimming Club"
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                  autoFocus
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-900">Kota / Kabupaten</label>
                <Input
                  type="text"
                  placeholder="Contoh: Jakarta Selatan / Tangerang"
                  value={newClubCity}
                  onChange={(e) => setNewClubCity(e.target.value)}
                  className="h-10 text-xs rounded-xl"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddClubModal(false)}
                className="h-9 px-3 text-xs"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleCreateClub}
                disabled={savingNewClub || !newClubName.trim()}
                className="h-9 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5"
              >
                {savingNewClub ? <BrandedSpinner className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
                Simpan &amp; Pilih Klub
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog Konfirmasi Email & Verifikasi Kode OTP */}
      <EmailOtpDialog
        open={showOtpModal}
        email={targetOtpEmail}
        fullName={form.full_name}
        onClose={() => setShowOtpModal(false)}
        onVerified={executeFinalRegistration}
      />
    </SplitAuthShell>
  );
}
