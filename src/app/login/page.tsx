'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff, HelpCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { SplitAuthShell } from '@/components/layout/split-auth-shell';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

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
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginIdentifier.includes('@') ? loginIdentifier : `${loginIdentifier}@scms.local`,
        password: loginPassword,
      });

      if (error || !data.session) {
        setErrorMsg('Login gagal. Periksa kembali email/username dan kata sandi Anda.');
        setLoading(false);
        return;
      }

      const userId = data.user.id;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, username')
        .eq('id', userId)
        .maybeSingle();

      const role =
        (profile as { role?: string } | null)?.role ||
        (data.user.user_metadata?.role as string) ||
        (data.user.app_metadata?.role as string);

      const ADMIN_ROLES = [
        'super_admin',
        'event_admin',
        'operator',
        'admin',
        'admin_kejuaraan',
        'admin_keuangan',
      ];
      const target = role && ADMIN_ROLES.includes(role) ? '/dashboard' : '/dashboard-viewer';

      toast.success('Login berhasil.');
      setTimeout(() => {
        window.location.assign(target);
      }, 200);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
      setLoading(false);
    }
  };

  return (
    <SplitAuthShell
      title="Masuk ke SCMS"
      subtitle="Sistem Manajemen Kompetisi Renang"
      footerLinks={[
        { label: 'Bantuan Teknis', href: '#' },
        { label: 'Privasi', href: '#' },
      ]}
    >
      {errorMsg && (
        <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-sm font-medium text-red-700 shadow-2xs">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleLogin} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--m-ink)]">Email atau Username</label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Masukkan email atau username"
              className="h-11 bg-white text-[var(--m-ink)] placeholder-[var(--m-muted)] border-[var(--m-border)] focus-visible:ring-primary/40 text-sm"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--m-ink)]">Kata Sandi</label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="h-11 bg-white pr-10 text-[var(--m-ink)] placeholder-[var(--m-muted)] border-[var(--m-border)] focus-visible:ring-primary/40 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-3 text-[var(--m-muted)] hover:text-[var(--m-ink)]"
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-[var(--m-muted)] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-[var(--m-border)] text-primary focus:ring-primary/40"
              />
              Ingat saya di perangkat ini
            </label>
            <Link href="/forgot-password" className="text-xs font-medium text-primary hover:underline">
              Lupa kata sandi?
            </Link>
          </div>
        </div>

        <Button
          type="submit"
          className="w-full h-11 bg-[var(--m-aqua)] hover:bg-[var(--m-aqua)]/90 text-white font-semibold text-sm shadow-sm transition-ui"
          disabled={loading}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Memproses Masuk...
            </>
          ) : (
            'Masuk'
          )}
        </Button>
      </form>

      <div className="mt-8 space-y-3 text-center text-sm text-[var(--m-muted)]">
        <p>
          Belum memiliki akun?{' '}
          <Link href="/register" className="font-semibold text-primary hover:underline">
            Daftar akun
          </Link>
        </p>
        <p>
          <Link href="/scoreboard" className="inline-flex items-center gap-1.5 hover:text-[var(--m-ink)] transition-colors">
            <HelpCircle className="h-4 w-4" /> Lihat Live Scoreboard Publik
          </Link>
        </p>
      </div>
    </SplitAuthShell>
  );
}
