'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import {
  updateProfileName,
  updatePassword,
  updateProfilePhoto,
  type ProfileState,
} from '@/app/profile/actions';
import { AvatarUpload } from '@/components/modules/avatar-upload';
import { ConfirmDialog } from '@/components/modules/confirm-dialog';
import {
  User,
  KeyRound,
  LogOut,
  Pencil,
  ShieldCheck,
  Calendar,
  Users,
  Trophy,
  ClipboardList,
  CheckCircle2,
  Lock,
  Mail,
  Building,
  Sparkles,
  ExternalLink,
  IdCard,
  ArrowRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { BrandedSpinner } from '@/components/ui/branded-loading';
import { cn } from '@/lib/utils';
import { formatKuDisplay } from '@/lib/age-category';

const ROLE_LABELS: Record<string, { label: string; badgeCls: string }> = {
  super_admin: { label: 'Super Admin Panitia', badgeCls: 'bg-purple-100 text-purple-900 border-purple-200' },
  event_admin: { label: 'Admin Kejuaraan', badgeCls: 'bg-blue-100 text-blue-900 border-blue-200' },
  operator: { label: 'Juri & Operator Waktu', badgeCls: 'bg-cyan-100 text-cyan-900 border-cyan-200' },
  viewer: { label: 'Peserta / Wali Atlet', badgeCls: 'bg-emerald-100 text-emerald-900 border-emerald-200' },
};

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export interface ProfileAthleteItem {
  id: string;
  fullName: string;
  athleteNumber: string;
  gender: string;
  ageGroup: string;
  schoolName: string;
}

export interface ProfileManagerProps {
  userId: string;
  email: string;
  fullName: string;
  username: string;
  role: string;
  avatarUrl: string;
  createdAt?: string;
  athletes?: ProfileAthleteItem[];
  registrationCount?: number;
  podiumCount?: number;
}

export function ProfileManager({
  userId,
  email,
  fullName,
  username,
  role,
  avatarUrl,
  createdAt,
  athletes = [],
  registrationCount = 0,
  podiumCount = 0,
}: ProfileManagerProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'security' | 'athletes'>('info');

  // Form Edit Profil State
  const [name, setName] = useState(fullName);
  const [userField, setUserField] = useState(username || fullName);
  const [avatar, setAvatar] = useState(avatarUrl);
  const [savingProfile, setSavingProfile] = useState(false);

  // Form Ganti Password State
  const [pw, setPw] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);
  const [showLogout, setShowLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSaveProfile(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSavingProfile(true);
    const fd = new FormData();
    fd.set('full_name', name.trim());
    fd.set('username', userField.trim());
    const res: ProfileState = await updateProfileName(fd);
    setSavingProfile(false);
    if (res.ok) {
      showToast(true, 'Data profil berhasil diperbarui.');
      router.refresh();
    } else {
      showToast(false, res.error ?? 'Gagal menyimpan profil.');
    }
  }

  async function handleSavePassword(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (pw.length < 6) {
      showToast(false, 'Password minimal 6 karakter.');
      return;
    }
    if (pw !== confirm) {
      showToast(false, 'Konfirmasi password tidak cocok.');
      return;
    }

    setSavingPw(true);
    const fd = new FormData();
    fd.set('password', pw);
    fd.set('confirm', confirm);
    const res: ProfileState = await updatePassword(fd);
    setSavingPw(false);
    if (res.ok) {
      setPw('');
      setConfirm('');
      showToast(true, 'Kata sandi berhasil diubah.');
    } else {
      showToast(false, res.error ?? 'Gagal mengubah password.');
    }
  }

  async function handlePhotoUploaded(url: string) {
    setAvatar(url);
    const fd = new FormData();
    fd.set('avatar_url', url);
    await updateProfilePhoto(fd);
    showToast(true, 'Foto profil berhasil diperbarui.');
    router.refresh();
  }

  async function handleLogout() {
    setLoggingOut(true);
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
    } catch {}
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign('/login');
  }

  const roleInfo = ROLE_LABELS[role] ?? {
    label: role,
    badgeCls: 'bg-slate-100 text-slate-800 border-slate-200',
  };

  const joinedDateStr = createdAt
    ? new Date(createdAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : '2026';

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div
          className={cn(
            'fixed bottom-6 right-6 z-[999] flex items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white shadow-xl animate-in fade-in slide-in-from-bottom-3 duration-200',
            toast.ok ? 'bg-emerald-600' : 'bg-rose-600'
          )}
        >
          {toast.ok ? <CheckCircle2 className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* ── 1. HEADER PROFILE HERO CARD (MODERN AQUATIC GLASSMORPHISM) ── */}
      <div className="glass-panel relative overflow-hidden p-6 sm:p-8 border border-slate-200/90 bg-white/95 rounded-2xl shadow-xs">
        <div className="pointer-events-none absolute -right-12 -top-12 h-56 w-56 rounded-full bg-[var(--m-aqua-soft)]/70 blur-3xl" />

        <div className="relative z-10 flex flex-col sm:flex-row items-center sm:items-start justify-between gap-6 text-center sm:text-left">
          {/* Avatar + Upload */}
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <div className="relative group">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-3 border-white bg-gradient-to-br from-[var(--m-aqua-soft)] to-blue-50 shadow-md ring-2 ring-slate-100">
                {avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatar} alt={fullName} className="h-full w-full object-cover" />
                ) : (
                  <div className="font-heading font-black text-3xl text-blue-900 font-mono">
                    {initials(fullName || email || 'SC')}
                  </div>
                )}
              </div>

              {/* Upload Overlay */}
              <div className="mt-2 flex justify-center">
                <AvatarUpload
                  folder="viewer"
                  uid={userId}
                  currentUrl={avatar}
                  onUploaded={handlePhotoUploaded}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-2 flex-wrap">
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs',
                    roleInfo.badgeCls
                  )}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {roleInfo.label}
                </span>

                <span className="text-[10px] font-mono text-slate-400 font-bold">
                  ID: #{userId.slice(0, 8)}
                </span>
              </div>

              <h1 className="font-heading text-2xl sm:text-3xl font-black text-slate-950 uppercase tracking-tight">
                {fullName || 'Pengguna Rajendra'}
              </h1>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-xs text-slate-600">
                <span className="flex items-center gap-1 font-mono">
                  <Mail className="h-3.5 w-3.5 text-blue-600" /> {email}
                </span>
                <span className="text-slate-300">•</span>
                <span className="font-mono text-slate-500">@{username || 'pengguna'}</span>
                <span className="text-slate-300">•</span>
                <span className="flex items-center gap-1 text-[11px] text-slate-500">
                  <Calendar className="h-3 w-3 text-slate-400" /> Terdaftar {joinedDateStr}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Header Actions */}
          <div className="flex flex-wrap items-center justify-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('info')}
              className={cn(
                'h-9 gap-1.5 text-xs font-bold shadow-2xs rounded-xl',
                activeTab === 'info' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white'
              )}
            >
              <Pencil className="h-3.5 w-3.5" /> Ubah Data
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setActiveTab('security')}
              className={cn(
                'h-9 gap-1.5 text-xs font-bold shadow-2xs rounded-xl',
                activeTab === 'security' ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-white'
              )}
            >
              <KeyRound className="h-3.5 w-3.5" /> Ganti Kata Sandi
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLogout(true)}
              className="h-9 gap-1.5 text-xs font-bold border-rose-200 text-rose-600 hover:bg-rose-50 shadow-2xs rounded-xl"
            >
              <LogOut className="h-3.5 w-3.5" /> Keluar
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. 4 STAT TILES ROW ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Atlet Terikat */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Atlet Binaan</p>
              <p className="text-2xl font-black text-slate-900 font-mono mt-0.5">
                {athletes.length} <span className="text-xs font-semibold text-slate-500">Perenang</span>
              </p>
            </div>
          </div>
        </div>

        {/* Stat 2: Nomor Lomba */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <ClipboardList className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Nomor Terdaftar</p>
              <p className="text-2xl font-black text-indigo-950 font-mono mt-0.5">
                {registrationCount} <span className="text-xs font-semibold text-slate-500">Nomor</span>
              </p>
            </div>
          </div>
        </div>

        {/* Stat 3: Prestasi Podium */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Sertifikat Juara</p>
              <p className="text-2xl font-black text-amber-600 font-mono mt-0.5">
                {podiumCount} <span className="text-xs font-semibold text-slate-500">Podium</span>
              </p>
            </div>
          </div>
        </div>

        {/* Stat 4: Status Akun */}
        <div className="rounded-2xl border border-slate-200 bg-white p-4.5 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">Status Autentikasi</p>
              <p className="text-sm font-black text-emerald-700 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" /> Terverifikasi Aktif
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. TABS NAVIGATION & DETAIL SECTIONS ── */}
      <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
        {/* Tab Headers */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/70 p-2 text-xs font-bold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={cn(
              'px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap',
              activeTab === 'info'
                ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <User className="h-4 w-4" /> Biodata &amp; Informasi Akun
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('security')}
            className={cn(
              'px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap',
              activeTab === 'security'
                ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <KeyRound className="h-4 w-4" /> Keamanan &amp; Kata Sandi
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('athletes')}
            className={cn(
              'px-4 py-2 rounded-xl transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap',
              activeTab === 'athletes'
                ? 'bg-white text-blue-700 shadow-2xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            )}
          >
            <Users className="h-4 w-4" /> Atlet Binaan ({athletes.length})
          </button>
        </div>

        {/* Tab 1: Biodata & Informasi Akun */}
        {activeTab === 'info' && (
          <div className="p-6 space-y-6">
            <div className="max-w-2xl space-y-4">
              <div>
                <h3 className="font-heading font-black text-base text-slate-900">
                  Ubah Informasi Akun
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pastikan nama lengkap dan username Anda selalu mutakhir untuk kebutuhan cetak invoice dan sertifikat kejuaraan.
                </p>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900">Nama Lengkap Penanggung Jawab</label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nama lengkap resmi"
                    className="h-10 rounded-xl text-xs bg-white border-slate-300 font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-900">Username Pengguna</label>
                    <Input
                      value={userField}
                      onChange={(e) => setUserField(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                      placeholder="Username login"
                      className="h-10 rounded-xl text-xs bg-white border-slate-300 font-mono"
                      required
                    />
                    <p className="text-[10px] text-slate-400">Gunakan huruf, angka, atau garis bawah.</p>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-900">Alamat Email Terdaftar</label>
                    <Input
                      value={email}
                      disabled
                      className="h-10 rounded-xl text-xs bg-slate-50 border-slate-200 font-mono text-slate-500"
                    />
                    <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Email utama terverifikasi
                    </p>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <Button
                    type="submit"
                    disabled={savingProfile}
                    className="h-9 px-4 gap-2 text-xs font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-2xs rounded-xl"
                  >
                    {savingProfile ? <BrandedSpinner className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
                    Simpan Perubahan Profil
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Keamanan & Password */}
        {activeTab === 'security' && (
          <div className="p-6 space-y-6">
            <div className="max-w-md space-y-4">
              <div>
                <h3 className="font-heading font-black text-base text-slate-900">
                  Perbarui Kata Sandi
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gunakan kombinasi minimal 6 karakter untuk menjaga keamanan akses data atlet dan transaksi pendaftaran Anda.
                </p>
              </div>

              <form onSubmit={handleSavePassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900">Kata Sandi Baru</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type={showPw ? 'text' : 'password'}
                      value={pw}
                      onChange={(e) => setPw(e.target.value)}
                      placeholder="Minimal 6 karakter"
                      className="h-10 pl-9 pr-9 rounded-xl text-xs bg-white border-slate-300 font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                    >
                      {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-900">Konfirmasi Kata Sandi Baru</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Ulangi kata sandi baru"
                      className="h-10 pl-9 pr-9 rounded-xl text-xs bg-white border-slate-300 font-medium"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                    >
                      {showConfirm ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end">
                  <Button
                    type="submit"
                    disabled={savingPw}
                    className="h-9 px-4 gap-2 text-xs font-bold bg-[#0284c7] hover:bg-[#0369a1] text-white shadow-2xs rounded-xl"
                  >
                    {savingPw ? <BrandedSpinner className="h-3.5 w-3.5" /> : <KeyRound className="h-3.5 w-3.5" />}
                    Perbarui Kata Sandi
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Tab 3: Roster Atlet Binaan */}
        {activeTab === 'athletes' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-heading font-black text-base text-slate-900">
                  Roster Atlet Binaan Anda
                </h3>
                <p className="text-xs text-slate-500">
                  Daftar atlet yang berada di bawah wewenang akun penanggung jawab ini.
                </p>
              </div>

              <Link href="/atlet-saya">
                <Button size="sm" className="h-8 gap-1.5 text-xs font-bold bg-blue-600 text-white">
                  Kelola Master Atlet &rarr;
                </Button>
              </Link>
            </div>

            {athletes.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl space-y-2">
                <Users className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="font-bold text-slate-800 text-xs">Belum ada atlet yang terdaftar</p>
                <p className="text-[11px] text-slate-500">
                  Tambahkan atlet Anda untuk membuka akses pendaftaran kejuaraan renang.
                </p>
                <Link href="/atlet-saya">
                  <Button size="sm" className="mt-1 text-xs font-bold bg-blue-600 text-white">
                    Tambah Atlet Sekarang
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {athletes.map((ath) => (
                  <div
                    key={ath.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white border border-slate-200 font-mono font-black text-xs text-blue-900 shadow-2xs">
                        {initials(ath.fullName)}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-xs truncate">
                          {ath.fullName}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                          ID: <span className="font-mono font-bold text-slate-700">{ath.athleteNumber}</span> • <span className="font-bold text-slate-700">{formatKuDisplay(ath.ageGroup)}</span> • {ath.schoolName}
                        </p>
                      </div>
                    </div>

                    <Link href={`/kartu-peserta?athleteId=${ath.id}`}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 gap-1 text-[11px] font-semibold border-slate-300 hover:bg-white"
                        title="Lihat ID Pass Peserta"
                      >
                        <IdCard className="h-3 w-3 text-blue-600" /> ID Pass
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Modal Logout */}
      <ConfirmDialog
        open={showLogout}
        title="Konfirmasi Keluar Akun"
        message="Apakah Anda yakin ingin keluar dari sesi akun Rajendra Meet saat ini?"
        confirmLabel={loggingOut ? 'Memproses...' : 'Ya, Keluar Akun'}
        destructive
        onConfirm={handleLogout}
        onCancel={() => setShowLogout(false)}
      />
    </div>
  );
}
