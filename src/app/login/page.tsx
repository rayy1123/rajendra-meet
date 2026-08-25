'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Waves, Lock, Mail, Loader2, Trophy, Timer, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/modules/theme-toggle';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const msg = error.message.toLowerCase();
        if (error.message.includes('API key')) {
          setErrorMsg('Kunci API Supabase tidak valid. Periksa konfigurasi server.');
        } else if (msg.includes('not confirmed') || msg.includes('email not confirmed')) {
          setErrorMsg('Email belum dikonfirmasi. Silakan cek kotak masuk Anda untuk verifikasi.');
        } else {
          setErrorMsg('Email atau password salah. Silakan coba lagi.');
        }
        setLoading(false);
        return;
      }

      const ADMIN_ROLES = ['super_admin', 'event_admin', 'operator'];
      const userId = data.user?.id;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId ?? '')
        .single();
      const role = (profile as { role?: string } | null)?.role;
      const target = role && ADMIN_ROLES.includes(role) ? '/events' : '/dashboard-viewer';

      window.location.assign(target);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      {/* Panel brand (kiri) — tersembunyi di mobile */}
      <div className="relative hidden w-1/2 overflow-hidden bg-gradient-to-br from-[var(--m-aqua)] via-[var(--brand-2)] to-[var(--brand-3)] lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="absolute -left-20 top-10 h-72 w-72 rounded-full bg-white/15 blur-3xl animate-blob" />
        <div className="absolute -right-16 bottom-20 h-80 w-80 rounded-full bg-white/10 blur-3xl animate-blob-slow" />
        <div className="relative flex items-center gap-3 text-white">
          <img src="/brand/logo.png" alt="Rajendra Meet" className="h-10 w-auto rounded-lg bg-white/90 p-1" />
          <span className="text-xl font-bold tracking-tight">Rajendra Meet</span>
        </div>
        <div className="relative space-y-6 text-white">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            Selenggarakan lomba renang jadi lebih mudah & terukur.
          </h2>
          <ul className="space-y-3 text-white/90">
            {[
              { icon: Timer, t: 'Live scoreboard real-time' },
              { icon: Trophy, t: 'Rekap medali & ranking otomatis' },
              { icon: Users, t: 'Pendaftaran peserta online' },
            ].map((f) => (
              <li key={f.t} className="flex items-center gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                  <f.icon className="h-4 w-4" />
                </span>
                {f.t}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-sm text-white/70">We Organize, You Achieve.</p>
      </div>

      {/* Form (kanan) */}
      <div className="flex w-full flex-col px-4 lg:w-1/2">
        <div className="flex justify-end p-4">
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center pb-10">
          <div className="w-full max-w-md">
            <div className="mb-6 flex items-center gap-3 lg:hidden">
              <img src="/brand/logo.png" alt="Rajendra Meet" className="h-9 w-auto rounded-md" />
              <span className="text-lg font-bold tracking-tight text-foreground">Rajendra Meet</span>
            </div>
            <div className="rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-card)]">
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Masuk</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Pantau pertandingan, daftarkan atlet, dan kelola kejuaraan.
              </p>

              <form onSubmit={handleLogin} className="mt-6 space-y-4">
                {errorMsg && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="Masukkan email Anda"
                      className="pl-9"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="Masukkan password Anda"
                      className="pl-9"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button type="submit" className="mt-2 w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...
                    </>
                  ) : (
                    'Masuk'
                  )}
                </Button>
              </form>

              <p className="mt-5 text-center text-sm text-muted-foreground">
                Belum punya akun?{' '}
                <Link href="/register" className="font-medium text-primary hover:underline">
                  Daftar sebagai viewer
                </Link>
              </p>
              <p className="mt-1 text-center text-sm text-muted-foreground">
                <Link href="/forgot-password" className="font-medium text-primary hover:underline">
                  Lupa password?
                </Link>
              </p>
              <p className="mt-4 text-center">
                <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-ui hover:text-primary">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
                    <path d="m12 19-7-7 7-7" />
                    <path d="M19 12H5" />
                  </svg>
                  Kembali ke beranda
                </Link>
              </p>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Licensed By Rayvanes Arrasyid
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
