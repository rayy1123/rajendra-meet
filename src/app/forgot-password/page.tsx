'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Waves, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

export default function ForgotPasswordPage() {
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
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
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
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border bg-card shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
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
                <div className="border border-destructive/20 bg-destructive/10 p-3 rounded-lg font-medium text-destructive text-sm">
                  {errorMsg}
                </div>
              )}
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
              <Button type="submit" className="mt-2 w-full" disabled={loading}>
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
            <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/10 p-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
              <p className="text-sm text-primary-ink">{infoMsg}</p>
            </div>
          )}

          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-medium text-primary hover:underline">
              Kembali ke masuk
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
