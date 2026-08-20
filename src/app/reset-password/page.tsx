'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Waves, Lock, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import Link from 'next/link';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
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
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        setErrorMsg('Sesi tidak ditemukan. Buka link "Atur Ulang Password" dari email Anda.');
        setLoading(false);
        return;
      }

      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setErrorMsg(error.message);
        setLoading(false);
        return;
      }

      const ADMIN_ROLES = ['super_admin', 'event_admin', 'operator'];
      // PENTING: baca profil MILIK user sendiri, bukan baris pertama.
      const userId = sessionData.session?.user?.id;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId ?? '')
        .single();
      const role = (profile as { role?: string } | null)?.role;
      const target = role && ADMIN_ROLES.includes(role) ? '/events' : '/scoreboard';

      setInfoMsg('Password berhasil diperbarui. Mengalihkan…');
      setLoading(false);
      setTimeout(() => router.push(target), 1200);
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
          <CardTitle className="text-2xl font-bold tracking-tight">Atur Ulang Password</CardTitle>
          <CardDescription>Masukkan password baru untuk akun Anda.</CardDescription>
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
                <label className="text-xs font-semibold">Password Baru</label>
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
              <div className="space-y-1">
                <label className="text-xs font-semibold">Konfirmasi Password Baru</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="password"
                    placeholder="••••••••"
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
                  'Perbarui Password'
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
