'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Eye, EyeOff, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface SchoolOption {
  id: string;
  name: string;
}

interface LoginFormProps {
  initialMode?: 'email' | 'school';
}

export function LoginForm({ initialMode = 'email' }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedLoginMode, setSelectedLoginMode] = useState<'email' | 'school'>(initialMode);
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [schoolsLoaded, setSchoolsLoaded] = useState(false);

  const loadSchools = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('schools')
        .select('id, name')
        .order('name', { ascending: true });
      const schoolsData = data as Array<{ id: string; name: string }> | null;
      if (!error && schoolsData) {
        setSchools(schoolsData.map(s => ({ id: s.id, name: s.name })));
      }
    } finally {
      setSchoolsLoaded(true);
    }
  };

  if (!schoolsLoaded) {
    loadSchools();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const supabase = createClient();

      if (selectedLoginMode === 'email') {
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
      } else {
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

        const userId = data.user?.id;
        if (!userId) {
          setErrorMsg('User ID not found. Login gagal.');
          setLoading(false);
          return;
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, role')
          .eq('id', userId)
          .single();

        const ADMIN_ROLES = ['super_admin', 'event_admin', 'operator'];
        const role = (profile as { role?: string } | null)?.role;
        const target = role && ADMIN_ROLES.includes(role) ? '/events' : '/dashboard-viewer';

        if (selectedSchoolId) {
          localStorage.setItem('selectedSchoolId', selectedSchoolId);
          localStorage.setItem('selectedSchoolName', profile?.full_name || 'Sistem');
        }

        window.location.assign(target);
      }
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Terjadi kesalahan sistem.');
      setLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      {errorMsg && (
        <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm font-medium text-red-600">
          {errorMsg}
        </div>
      )}

      <div className="flex gap-6 border-b border-[var(--m-border)]">
        <button
          type="button"
          onClick={() => setSelectedLoginMode('email')}
          className={cn(
            'pb-2 text-sm font-medium transition-colors',
            selectedLoginMode === 'email'
              ? 'border-b-2 border-[var(--m-aqua)] text-[var(--m-aqua-ink)]'
              : 'text-[var(--m-muted)] hover:text-[var(--m-ink)]'
          )}
        >
          Email Resmi
        </button>
        <button
          type="button"
          onClick={() => setSelectedLoginMode('school')}
          className={cn(
            'pb-2 text-sm font-medium transition-colors',
            selectedLoginMode === 'school'
              ? 'border-b-2 border-[var(--m-aqua)] text-[var(--m-aqua-ink)]'
              : 'text-[var(--m-muted)] hover:text-[var(--m-ink)]'
          )}
        >
          Sekolah / Klub
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--m-ink)]">Email atau Username</label>
          <Input
            type="text"
            placeholder="panitia@scms.id atau username"
            className="bg-[var(--m-surface)]"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--m-ink)]">Kata Sandi</label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="bg-[var(--m-surface)] pr-10"
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
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-[var(--m-muted)]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-[var(--m-border)] bg-[var(--m-surface)] text-[var(--m-aqua)] focus:ring-[var(--m-aqua)]"
              />
              Ingat saya di perangkat ini
            </label>
            <Link href="/forgot-password" className="text-xs text-[var(--m-muted)] hover:text-[var(--m-ink)]">
              Lupa kata sandi?
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          Masuk
        </Button>
      </form>

      <div className="space-y-2 text-center text-sm text-[var(--m-muted)]">
        <p>
          Belum memiliki akun kontingen?{' '}
          <Link href="/register" className="font-medium text-[var(--m-aqua-ink)] hover:underline">
            Daftar di sini
          </Link>
        </p>
        <p>
          <Link href="/scoreboard" className="inline-flex items-center gap-1.5 hover:text-[var(--m-ink)]">
            <HelpCircle className="h-4 w-4" /> Lihat Live Scoreboard Publik
          </Link>
        </p>
      </div>
    </div>
  );
}
