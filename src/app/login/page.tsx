'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Eye, EyeOff, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Link from 'next/link';
import { SplitAuthShell } from '@/components/layout/split-auth-shell';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

type Mode = 'school' | 'direct';

interface SchoolOption {
  id: string;
  name: string;
}

interface ProfileOption {
  id: string;
  username: string;
  full_name: string;
  role?: string;
}

export default function LoginPage() {
  const [mode, setMode] = useState<Mode>('school');
  const [password, setPassword] = useState('');
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [schoolsLoaded, setSchoolsLoaded] = useState(false);
  const [profiles, setProfiles] = useState<ProfileOption[]>([]);
  const [profilesLoaded, setProfilesLoaded] = useState(false);

  const loadSchools = async () => {
    try {
      const res = await fetch('/api/schools');
      if (res.ok) {
        const data = await res.json();
        const schoolsData = Array.isArray(data) ? data : data?.data ?? [];
        setSchools(
          schoolsData.map((s: any) => ({
            id: s.id,
            name: s.name,
          })),
        );
      }
    } finally {
      setSchoolsLoaded(true);
    }
  };

  const loadProfiles = async (schoolId: string) => {
    try {
      const res = await fetch(`/api/profiles?schoolId=${encodeURIComponent(schoolId)}`);
      if (res.ok) {
        const data = await res.json();
        const profilesData = Array.isArray(data) ? data : data?.data ?? [];
        setProfiles(
          profilesData.map((p: any) => ({
            id: p.id,
            username: p.username || p.full_name,
            full_name: p.full_name,
            role: p.role,
          })),
        );
      } else {
        setProfiles([]);
      }
    } finally {
      setProfilesLoaded(true);
    }
  };

  useEffect(() => {
    if (!schoolsLoaded) {
      loadSchools();
    }
  }, [schoolsLoaded]);

  useEffect(() => {
    if (mode === 'school' && selectedSchoolId) {
      setProfilesLoaded(false);
      loadProfiles(selectedSchoolId);
    } else {
      setProfiles([]);
      setProfilesLoaded(true);
    }
  }, [mode, selectedSchoolId]);

  const matchedProfile = profiles.find(
    (p) => p.username.toLowerCase() === username.trim().toLowerCase() || p.full_name.toLowerCase() === username.trim().toLowerCase(),
  ) || null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const loginIdentifier = mode === 'school' ? (matchedProfile ? matchedProfile.username : username.trim()) : username.trim();
      const loginPassword = password;

      if (!loginIdentifier || !loginPassword) {
        setErrorMsg('Username dan password wajib diisi.');
        setLoading(false);
        return;
      }

      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginIdentifier.includes('@') ? loginIdentifier : `${loginIdentifier}@scms.local`,
        password: loginPassword,
      });

      if (error || !data.session) {
        setErrorMsg('Login gagal. Periksa kembali username dan kata sandi.');
        setLoading(false);
        return;
      }

      const userId = data.user.id;
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, username')
        .eq('id', userId)
        .maybeSingle();

      const role = (profile as { role?: string } | null)?.role;
      const ADMIN_ROLES = ['super_admin', 'event_admin', 'operator'];
      const target = role && ADMIN_ROLES.includes(role) ? '/events' : '/dashboard-viewer';

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
        <div className="mb-5 rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm font-medium text-red-600">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleLogin} className="mt-6 space-y-4">
        <div className="inline-flex rounded-xl border border-[#d0dff0] bg-white p-1">
          <button
            type="button"
            onClick={() => setMode('school')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-ui',
              mode === 'school' ? 'bg-[#eef6ff] text-[#0b1220] shadow-sm' : 'text-[#334155] hover:text-[#0b1220]',
            )}
          >
            Login Kontingen
          </button>
          <button
            type="button"
            onClick={() => setMode('direct')}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-semibold transition-ui',
              mode === 'direct' ? 'bg-[#eef6ff] text-[#0b1220] shadow-sm' : 'text-[#334155] hover:text-[#0b1220]',
            )}
          >
            Login Langsung
          </button>
        </div>

        {mode === 'school' && (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0b1220]">Kontingen</label>
              <Select value={selectedSchoolId ?? ''} onValueChange={(v) => setSelectedSchoolId(v || null)}>
                <SelectTrigger className="bg-white text-[#0b1220] border-[#cbd5e1] focus-visible:ring-cyan-300">
                  <SelectValue placeholder="-- Pilih Kontingen --" />
                </SelectTrigger>
                <SelectContent>
                  {schools.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#0b1220]">Nama Lengkap</label>
              <Select
                value={matchedProfile ? matchedProfile.id : ''}
                onValueChange={(v) => {
                  const found = profiles.find((p) => p.id === v) || null;
                  setUsername(found ? found.username : '');
                }}
                disabled={!selectedSchoolId || !profilesLoaded}
              >
                <SelectTrigger className="bg-white text-[#0b1220] border-[#cbd5e1] focus-visible:ring-cyan-300 disabled:opacity-60">
                  <SelectValue placeholder={!selectedSchoolId ? '-- Pilih kontingen terlebih dahulu --' : '-- Pilih Nama Lengkap --'} />
                </SelectTrigger>
                <SelectContent>
                  {profiles.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedSchoolId && (
                <p className="text-xs text-[#334155]">
                  {profilesLoaded ? `Ditemukan ${profiles.length} akun di kontingen ini.` : '…'}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#0b1220]">Username</label>
          <Input
            type="text"
            placeholder="Masukkan username"
            className="bg-white text-[#0b1220] placeholder-[#64748b] border-[#cbd5e1] focus-visible:ring-cyan-300"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          {mode === 'school' && matchedProfile && (
            <p className="text-xs text-emerald-700">
              Terdaftar: {matchedProfile.full_name}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#0b1220]">Kata Sandi</label>
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              className="bg-white pr-10 text-[#0b1220] placeholder-[#64748b] border-[#cbd5e1] focus-visible:ring-cyan-300"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-3 text-[#64748b] hover:text-[#0b1220]"
              aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-[#334155]">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-3.5 w-3.5 rounded border-[#cbd5e1] bg-white text-cyan-600 focus:ring-cyan-300"
              />
              Ingat saya di perangkat ini
            </label>
            <Link href="/forgot-password" className="text-xs text-cyan-700 hover:text-cyan-900">
              Lupa kata sandi?
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full bg-cyan-600 text-white hover:bg-cyan-700" disabled={loading}>
          Masuk
        </Button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm text-[#334155]">
        <p>
          Belum memiliki akun kontingen?{' '}
          <Link href="/register" className="font-medium text-cyan-700 hover:text-cyan-900">
            Daftar akun
          </Link>
        </p>
        <p>
          <Link href="/scoreboard" className="inline-flex items-center gap-1.5 hover:text-[#0b1220]">
            <HelpCircle className="h-4 w-4" /> Lihat Live Scoreboard Publik
          </Link>
        </p>
      </div>
    </SplitAuthShell>
  );
}
