'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Waves, Lock, Mail, Loader2, User, CheckCircle2, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/scoreboard`,
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

      router.push('/scoreboard');
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
        options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/scoreboard` },
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
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border bg-card shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Waves className="w-7 h-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Daftar Akun Viewer</CardTitle>
          <CardDescription>
            Buat akun untuk menginput data sendiri. Anda akan masuk sebagai viewer.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!needConfirm ? (
            <form onSubmit={handleRegister} className="space-y-4">
              {errorMsg && (
                <div className="border border-destructive/20 bg-destructive/10 p-3 rounded-lg font-medium text-destructive text-sm">
                  {errorMsg}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold">Nama Lengkap</label>
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

              <div className="space-y-1">
                <label className="text-xs font-semibold">Email</label>
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

              <div className="space-y-1">
                <label className="text-xs font-semibold">Password</label>
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

              <div className="space-y-1">
                <label className="text-xs font-semibold">Konfirmasi Password</label>
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
          ) : (
            <div className="space-y-4">
              <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/10 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <p className="text-sm text-primary-ink">{infoMsg}</p>
              </div>
              {errorMsg && (
                <div className="border border-destructive/20 bg-destructive/10 p-3 rounded-lg font-medium text-destructive text-sm">
                  {errorMsg}
                </div>
              )}
              <Button
                variant="outline"
                className="w-full"
                onClick={handleResend}
                disabled={resending}
              >
                {resending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Kirim Ulang Email
              </Button>
            </div>
          )}

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Sudah punya akun?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Masuk di sini
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
