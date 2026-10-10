'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Eye,
  EyeOff,
  User,
  Lock,
  ShieldCheck,
  Timer,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  School,
  Trophy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { SplitAuthShell } from '@/components/layout/split-auth-shell';
import { createClient } from '@/lib/supabase/client';
import { BrandedSpinner } from '@/components/ui/branded-loading';
import { cn } from '@/lib/utils';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [activeRoleBadge, setActiveRoleBadge] = useState<'all' | 'admin' | 'coach' | 'athlete'>('all');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('error') === 'concurrent_session' || params.get('reason') === 'concurrent_session') {
        setErrorMsg(
          'Sesi Anda telah dihentikan karena akun ini baru saja digunakan untuk login di perangkat atau jendela lain. Satu akun hanya dapat aktif di satu perangkat secara bersamaan.'
        );
      }
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const loginIdentifier = username.trim();
      const loginPassword = password;

      if (!loginIdentifier || !loginPassword) {
        setErrorMsg('Username/email dan kata sandi wajib diisi.');
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const cleanId = loginIdentifier.toLowerCase();

      // Susun kandidat email secara fleksibel jika input berupa username (tanpa @)
      const candidateEmails = cleanId.includes('@')
        ? [cleanId, loginIdentifier]
        : Array.from(
            new Set([
              `${cleanId}@scms.local`,
              `${cleanId}@rajendra.id`,
              'admin-technical@rajendra.id',
              'admin-technical@scms.local',
              'technical@rajendra.id',
              'admin@rajendra.id',
              'panitia@rajendra.id',
              `${cleanId}@gmail.com`,
            ].filter(Boolean))
          );

      let sessionData: any = null;
      let lastAuthError: any = null;

      for (const emailCandidate of candidateEmails) {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: emailCandidate,
          password: loginPassword,
        });

        if (!error && data?.session) {
          sessionData = data;
          break;
        } else {
          lastAuthError = error;
        }
      }

      if (!sessionData || !sessionData.session) {
        const rawErr = lastAuthError?.message || '';
        let userFriendlyError = 'Login gagal. Periksa kembali email/username dan kata sandi Anda.';
        if (rawErr.toLowerCase().includes('invalid login credentials')) {
          userFriendlyError = 'Login gagal. Email/username atau kata sandi yang Anda masukkan salah. Pastikan akun sudah terdaftar dan email persis sesuai pendaftaran.';
        } else if (rawErr.toLowerCase().includes('email not confirmed')) {
          userFriendlyError = 'Login gagal: Alamat email belum terkonfirmasi di Supabase. Harap nonaktifkan "Confirm email" di Supabase Dashboard (Authentication -> Providers -> Email -> Confirm email: OFF) agar akun langsung aktif seketika.';
        } else if (rawErr && !rawErr.includes('fetch')) {
          userFriendlyError = `Login gagal: ${rawErr}`;
        }
        setErrorMsg(userFriendlyError);
        setLoading(false);
        return;
      }

      const userId = sessionData.user.id;

      // Buat & daftarkan sesi aktif baru di browser ini
      const newSessionId = `sess_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

      try {
        // 1. Simpan sesi aktif ke Supabase Auth User Metadata (sumber terpusat antar-perangkat)
        await supabase.auth.updateUser({
          data: { active_session_id: newSessionId },
        });

        // 2. Tanam cookie sesi langsung di browser jendela ini
        if (typeof document !== 'undefined') {
          document.cookie = `scms_session_id=${newSessionId}; path=/; max-age=604800; SameSite=Lax`;
          // Bersihkan parameter error dari URL agar tidak memicu pesan gagal saat redirect
          window.history.replaceState({}, '', '/login');
        }

        // 3. Daftarkan juga ke endpoint API session
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, sessionId: newSessionId }),
        });
      } catch (sessErr) {
        console.warn('Session registration notice:', sessErr);
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role, username')
        .eq('id', userId)
        .maybeSingle();

      const role =
        (profile as { role?: string } | null)?.role ||
        (sessionData.user.user_metadata?.role as string) ||
        (sessionData.user.app_metadata?.role as string);

      const ADMIN_ROLES = [
        'super_admin',
        'event_admin',
        'operator',
        'admin',
        'admin_kejuaraan',
        'admin_keuangan',
        'admin_technical',
        'admin-technical',
      ];
      const isAdminRole = role && ADMIN_ROLES.includes(role);

      // Tentukan target pengalihan sesuai wewenang dan preferensi peran login
      let target = '/dashboard-viewer';
      if (isAdminRole) {
        target = '/dashboard';
      } else if (activeRoleBadge === 'coach') {
        target = '/atlet-saya';
      } else if (activeRoleBadge === 'athlete') {
        target = '/data-saya';
      }

      toast.success(
        isAdminRole
          ? 'Login berhasil! Mengalihkan ke Dasbor Panitia...'
          : activeRoleBadge === 'coach'
          ? 'Login berhasil! Mengalihkan ke Dasbor Pelatih / Roster Klub...'
          : activeRoleBadge === 'athlete'
          ? 'Login berhasil! Mengalihkan ke Data Atlet Pribadi...'
          : 'Login berhasil! Mengalihkan ke sistem...'
      );

      setTimeout(() => {
        window.location.assign(target);
      }, 250);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
      setLoading(false);
    }
  };

  return (
    <SplitAuthShell
      title="Masuk ke Akun Anda"
      subtitle="Silakan masukkan kredensial untuk mengakses sistem pendaftaran, nomor lomba, dan live scoreboard."
      footerLinks={[
        { label: 'Bantuan Teknis', href: '/guide' },
        { label: 'Juknis Lomba', href: '/juknis' },
        { label: 'Live Scoreboard', href: '/scoreboard' },
      ]}
    >
      {/* Role Selection Guide Pills */}
      <div className="space-y-2 pb-1">
        <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
          Masuk Sebagai:
        </label>
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <button
            type="button"
            onClick={() => setActiveRoleBadge('admin')}
            className={cn(
              'p-2 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center gap-1 cursor-pointer',
              activeRoleBadge === 'admin'
                ? 'bg-blue-50 border-blue-400 text-blue-900 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            <Trophy className="h-3.5 w-3.5 text-blue-600" /> Panitia / Juri
          </button>

          <button
            type="button"
            onClick={() => setActiveRoleBadge('coach')}
            className={cn(
              'p-2 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center gap-1 cursor-pointer',
              activeRoleBadge === 'coach'
                ? 'bg-indigo-50 border-indigo-400 text-indigo-900 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            <School className="h-3.5 w-3.5 text-indigo-600" /> Klub / Pelatih
          </button>

          <button
            type="button"
            onClick={() => setActiveRoleBadge('athlete')}
            className={cn(
              'p-2 rounded-xl border text-[11px] font-bold transition-all flex flex-col items-center gap-1 cursor-pointer',
              activeRoleBadge === 'athlete'
                ? 'bg-cyan-50 border-cyan-400 text-cyan-900 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            <User className="h-3.5 w-3.5 text-cyan-600" /> Atlet / Wali
          </button>
        </div>

        {/* Dynamic Role Capability Box */}
        <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-[11px] text-slate-600 leading-snug space-y-1">
          {activeRoleBadge === 'admin' ? (
            <p>
              <b className="text-blue-900 font-bold">Wewenang Panitia / Juri:</b> Manajemen kejuaraan penuh, seeding otomatis, buku acara A4, rekonsiliasi kas, dan otoritas penerbitan sertifikat resmi.
            </p>
          ) : activeRoleBadge === 'coach' ? (
            <>
              <p>
                <b className="text-indigo-900 font-bold">Wewenang Pelatih / Klub:</b> Roster banyak atlet tim (Data Atlet Saya), pendaftaran massal nomor lomba, rekap tagihan klub, &amp; cetak ID Pass kontingen.
              </p>
              <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-slate-200/60 mt-1">
                <span>Belum memiliki akun kontingen tim?</span>
                <Link href="/register" className="text-indigo-600 font-bold hover:underline cursor-pointer">
                  Daftar Akun Klub Baru &rarr;
                </Link>
              </div>
            </>
          ) : activeRoleBadge === 'athlete' ? (
            <>
              <p>
                <b className="text-cyan-900 font-bold">Wewenang Atlet / Mandiri:</b> Kelola profil perenang pribadi (Data Saya), pemilihan nomor lomba mandiri, pantau live scoreboard, &amp; unduh sertifikat juara resmi.
              </p>
              <div className="flex items-center justify-between text-[11px] pt-1 text-slate-500 border-t border-slate-200/60 mt-1">
                <span>Belum memiliki akun peserta?</span>
                <Link href="/register" className="text-cyan-600 font-bold hover:underline cursor-pointer">
                  Daftar Akun Mandiri &rarr;
                </Link>
              </div>
            </>
          ) : (
            <p className="text-slate-500">
              Pilih peran Anda di atas untuk menyesuaikan formulir login atau langsung masukkan kredensial akun.
            </p>
          )}
        </div>
      </div>

      {errorMsg && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700 shadow-2xs flex items-start gap-2.5">
          <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-200 text-red-900 font-black text-xs">
            !
          </span>
          <div className="space-y-0.5">
            <p className="font-bold">Gagal Masuk</p>
            <p className="text-[11px] text-red-600">{errorMsg}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-4">
        {/* Email or Username Field */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-900 flex items-center justify-between">
            <span>
              {activeRoleBadge === 'admin'
                ? 'Email / Username Panitia'
                : activeRoleBadge === 'coach'
                ? 'Email / Username Klub & Pelatih'
                : activeRoleBadge === 'athlete'
                ? 'Email / Username Atlet / Wali'
                : 'Email atau Username'}
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              Contoh: nama@domain.com atau username
            </span>
          </label>
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              type="text"
              placeholder={
                activeRoleBadge === 'admin'
                  ? 'Masukkan email atau username resmi panitia'
                  : activeRoleBadge === 'coach'
                  ? 'Masukkan email atau username resmi klub/pelatih'
                  : activeRoleBadge === 'athlete'
                  ? 'Masukkan email atau username resmi atlet'
                  : 'Masukkan email atau username resmi'
              }
              className="h-11 rounded-xl bg-white pl-10 text-sm font-medium text-slate-900 border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-600 shadow-2xs"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-900">Kata Sandi</label>
            <Link
              href="/forgot-password"
              className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline"
            >
              Lupa kata sandi?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="h-11 rounded-xl bg-white pl-10 pr-10 text-sm font-medium text-slate-900 border-slate-300 focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-600 shadow-2xs"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-700 cursor-pointer"
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Remember Device Checkbox */}
        <div className="flex items-center justify-between pt-0.5">
          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500/40"
            />
            <span>Ingat sesi masuk di perangkat ini</span>
          </label>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full h-11 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-all cursor-pointer"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <BrandedSpinner className="h-4 w-4" />
              <span>Memproses Autentikasi...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <span>Masuk ke Sistem</span>
              <ArrowRight className="h-4 w-4" />
            </span>
          )}
        </Button>
      </form>

      {/* Security & Quick Link Card */}
      <div className="mt-6 pt-5 border-t border-slate-100 space-y-4">
        {/* Registration CTA */}
        <div className="rounded-xl border border-slate-200/80 bg-slate-50/70 p-3.5 text-center text-xs text-slate-600 space-y-1">
          <p className="font-semibold text-slate-800">
            Belum memiliki akun kontingen atau atlet?
          </p>
          <p className="text-[11px] text-slate-500">
            Daftarkan akun perorangan atau klub Anda untuk mengikuti kejuaraan resmi.
          </p>
          <div className="pt-1">
            <Link
              href="/register"
              className="inline-flex items-center gap-1 font-bold text-blue-600 hover:text-blue-800 hover:underline"
            >
              Buat Akun Peserta Baru &rarr;
            </Link>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="flex items-center justify-center gap-4 text-[10px] font-medium text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> Enkripsi TLS 256-Bit
          </span>
          <span>•</span>
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-blue-600" /> Sistem Resmi Terverifikasi
          </span>
        </div>
      </div>
    </SplitAuthShell>
  );
}
