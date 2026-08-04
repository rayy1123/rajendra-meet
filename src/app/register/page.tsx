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

    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/scoreboard`,
        },
      });

      if (error) {
        // Tangani rate-limit email Supabase secara ramah
        if (error.status === 429 || error.message?.includes('rate limit')) {
          setErrorMsg('Pengiriman email dibatasi sementara. Mohon tunggu beberapa saat dan coba lagi.');
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
        return;
      }

      // Bila email belum dikonfirmasi, Supabase mengembalikan user tanpa session.
      if (data.session === null) {
        setNeedConfirm(true);
        setInfoMsg(
          'Pendaftaran diterima! Silakan cek email Anda untuk verifikasi, lalu masuk. ' +
            'Jika tidak ada email, klik “Kirim Ulang Email” di bawah.'
        );
        setLoading(false);
        return;
      }

      // Langsung aktif: arahkan ke scoreboard publik (viewer sudah login & bisa input sendiri).
      router.push('/scoreboard');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem.');
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setErrorMsg('');
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resend({ type: 'signup', email });
      if (error) {
        if (error.status === 429 || error.message?.includes('rate limit')) {
          setErrorMsg('Pengiriman email dibatasi sementara. Mohon tunggu beberapa saat.');
        } else {
          setErrorMsg(error.message);
        }
      } else {
        setInfoMsg('Email verifikasi telah dikirim ulang. Silakan cek kotak masuk Anda.');
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal mengirim ulang email.');
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <Card className="w-full max-w-md shadow-lg border-muted">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-blue-600 text-white p-3 rounded-2xl w-fit">
            <Waves className="w-8 h-8" />
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
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-lg font-medium border border-destructive/20">
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
                    placeholder="email@contoh.com"
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
                    placeholder="••••••••"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 mt-2" disabled={loading}>
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
              <div className="flex items-start gap-3 rounded-lg bg-emerald-500/15 border border-emerald-500/20 p-4">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                <p className="text-sm text-emerald-700 dark:text-emerald-300">{infoMsg}</p>
              </div>
              {errorMsg && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-lg font-medium border border-destructive/20">
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

          <p className="text-center text-sm text-muted-foreground mt-4">
            Sudah punya akun?{' '}
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Masuk di sini
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
