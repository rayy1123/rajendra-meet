'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Waves, Lock, Mail, Loader2, User, CheckCircle2, Send, Trophy, Timer, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ThemeToggle } from '@/components/modules/theme-toggle';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');
  const [needConfirm, setNeedConfirm] = useState(false);
  const [resending, setResending] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    if (password.length < 6) {
      setErrorMsg('Password minimal 6 karakter.');
      setLoading(false);
      return;
    }
    if (password !== confirm) {
      setErrorMsg('Konfirmasi password tidak cocok.');
      setLoading(false);
      return;
    }

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard-viewer`,
        },
      });

      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (
          error.status === 422 ||
          msg.includes('already registered') ||
          msg.includes('already been registered') ||
          msg.includes('user already') ||
          msg.includes('email already')
        ) {
          setErrorMsg('Email sudah terdaftar. Silakan masuk dengan akun tersebut.');
        } else if (error.status === 429 || msg.includes('rate limit')) {
          setErrorMsg('Pengiriman email dibatasi sementara. Mohon tunggu beberapa saat dan coba lagi.');
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
        return;
      }

      if (data.session === null) {
        setNeedConfirm(true);
        setInfoMsg(
          'Pendaftaran diterima! Silakan cek email Anda untuk verifikasi, lalu masuk. ' +
            'Jika tidak ada email, klik "Kirim Ulang Email" di bawah.'
        );
        setLoading(false);
        return;
      }

      router.push('/dashboard-viewer');
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setErrorMsg('');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard-viewer` },
      });
      if (error) {
        if (error.status === 429 || (error.message || '').includes('rate limit')) {
          setErrorMsg('Pengiriman email dibatasi sementara. Mohon tunggu beberapa saat.');
        } else {
          setErrorMsg(error.message);
        }
      } else {
        setInfoMsg('Email verifikasi telah dikirim ulang. Silakan cek kotak masuk Anda.');
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Gagal mengirim ulang email.');
    } finally {
      setResending(false);
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
            Daftar sebagai viewer untuk kelola atlet Anda sendiri.
          </h2>
          <ul className="space-y-3 text-white/90">
            {[
              { icon: Users, t: 'Kelola data atlet sendiri' },
              { icon: Timer, t: 'Daftarkan ke nomor lomba' },
              { icon: Trophy, t: 'Pantau hasil & peringkat' },
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

            {!needConfirm ? (
              <div className="rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-card)]">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Daftar Akun Viewer</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Buat akun untuk menginput data sendiri. Anda akan masuk sebagai viewer.
                </p>

                <form onSubmit={handleRegister} className="mt-6 space-y-4">
                  {errorMsg && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                      {errorMsg}
                    </div>
                  )}

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Nama Lengkap</label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Nama Anda"
                        className="pl-9"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="email@gmail.com"
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
                        placeholder="Buat password Anda"
                        className="pl-9"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground">Konfirmasi Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="password"
                        placeholder="Tulis Ulang Password Anda"
                        className="pl-9"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
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
                      'Daftar'
                    )}
                  </Button>
                </form>

                <p className="mt-5 text-center text-sm text-muted-foreground">
                  Sudah punya akun?{' '}
                  <Link href="/login" className="font-medium text-primary hover:underline">
                    Masuk di sini
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
            ) : (
              <div className="rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-card)]">
                <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/10 p-4">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm text-primary-ink">{infoMsg}</p>
                </div>
                {errorMsg && (
                  <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm font-medium text-destructive">
                    {errorMsg}
                  </div>
                )}
                <Button
                  variant="outline"
                  className="mt-5 w-full"
                  onClick={handleResend}
                  disabled={resending}
                >
                  {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                  Kirim Ulang Email
                </Button>
                <p className="mt-5 text-center">
                  <Link href="/login" className="font-medium text-primary hover:underline">
                    Kembali ke halaman masuk
                  </Link>
                </p>
              </div>
            )}

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Licensed By Rayvanes Arrasyid
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
