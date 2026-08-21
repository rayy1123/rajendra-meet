'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Waves, Lock, Mail, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
      // Gunakan user dari hasil signIn langsung (tidak perlu getUser lagi),
      // sehingga tidak ada race condition session di client memory.
      const userId = data.user?.id;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId ?? '')
        .single();
      const role = (profile as { role?: string } | null)?.role;
      // Admin/operator masuk ke dashboard events; viewer (orang tua/peserta)
      // diarahkan ke halaman pendaftaran mereka yang punya navigasi publik,
      // bukan langsung ke scoreboard (halaman publik tanpa menu).
      const target = role && ADMIN_ROLES.includes(role) ? '/events' : '/pendaftaran-saya';

      // Full navigation (bukan router.push) agar middleware membaca cookie session
      // yang baru diset — menghindari redirect loop /login <-> dashboard.
      window.location.assign(target);
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
            <Waves className="w-7 h-7" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Rajendra Meet</CardTitle>
          <CardDescription>
            Masuk ke Rajendra Meet untuk melihat scoreboard, memantau pertandingan,
            dan — bagi panitia — mengelola kejuaraan.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
                  placeholder="Masukkan email Anda"
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

          <p className="mt-4 text-center text-sm text-muted-foreground">
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
          <p className="mt-3 px-2 text-center text-xs text-muted-foreground">
           Licensed By Rayvanes Arrasyid
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
