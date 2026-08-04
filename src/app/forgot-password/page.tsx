'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Waves, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setInfoMsg('');

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) {
        if (error.status === 429 || (error.message || '').includes('rate limit')) {
          setErrorMsg('Pengiriman email dibatasi sementara. Mohon tunggu beberapa saat.');
        } else {
          setErrorMsg(error.message);
        }
        setLoading(false);
        return;
      }
      setInfoMsg('Link reset password telah dikirim ke email Anda. Silakan cek kotak masuk.');
      setLoading(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Terjadi kesalahan sistem.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 px-4">
      <Card className="w-full max-w-md shadow-lg border-muted">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-blue-600 text-white p-3 rounded-2xl w-fit">
            <Waves className="w-8 h-8" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Lupa Password</CardTitle>
          <CardDescription>
            Masukkan email akun Anda. Kami akan mengirimkan link untuk mengatur ulang password.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {!infoMsg ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-lg font-medium border border-destructive/20">
                  {errorMsg}
                </div>
              )}
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
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 mt-2" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Memproses...
                  </>
                ) : (
                  'Kirim Link Reset'
                )}
              </Button>
            </form>
          ) : (
            <div className="flex items-start gap-3 rounded-lg bg-emerald-500/15 border border-emerald-500/20 p-4">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <p className="text-sm text-emerald-700 dark:text-emerald-300">{infoMsg}</p>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground mt-4">
            <Link href="/login" className="text-blue-600 hover:underline font-medium">
              Kembali ke masuk
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
