'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import Link from 'next/link';
import { SplitAuthShell } from '@/components/layout/split-auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface SchoolOption {
  id: string;
  name: string;
}

export default function RegisterPage() {
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    password: '',
    confirm_password: '',
    phone: '',
  });
  const [selectedSchoolId, setSelectedSchoolId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [schools, setSchools] = useState<SchoolOption[]>([]);
  const [schoolsLoaded, setSchoolsLoaded] = useState(false);

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

  useEffect(() => {
    if (!schoolsLoaded) {
      loadSchools();
    }
  }, [schoolsLoaded]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!selectedSchoolId) {
      setErrorMsg('Pilih kontingen terlebih dahulu.');
      setLoading(false);
      return;
    }
    if (!form.full_name || !form.username || !form.password) {
      setErrorMsg('Nama lengkap, username, dan password wajib diisi.');
      setLoading(false);
      return;
    }
    if (form.password !== form.confirm_password) {
      setErrorMsg('Konfirmasi password tidak cocok.');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          full_name: form.full_name,
          username: form.username,
          password: form.password,
          school_id: selectedSchoolId,
          phone: form.phone || null,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        const msg = payload?.error || 'Gagal membuat akun.';
        throw new Error(msg);
      }

      setSuccessMsg('Pendaftaran berhasil.');
      toast.success('Pendaftaran berhasil');
      setForm({
        full_name: '',
        username: '',
        password: '',
        confirm_password: '',
        phone: '',
      });
      setSelectedSchoolId(null);
      setTimeout(() => {
        window.location.assign('/login');
      }, 800);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SplitAuthShell
      title="Buat Akun Baru"
      subtitle="Daftar untuk mengakses sistem manajemen kompetisi."
      footerLinks={[
        { label: 'Bantuan Teknis', href: '#' },
        { label: 'Privasi', href: '#' },
      ]}
    >
      {(errorMsg || successMsg) && (
        <div className="mb-5 space-y-2">
          {errorMsg && (
            <div className="rounded-lg border border-red-400/30 bg-red-500/10 p-3 text-sm font-medium text-red-600">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="rounded-lg border border-emerald-400/30 bg-emerald-500/10 p-3 text-sm font-medium text-emerald-700">
              {successMsg}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
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
          <Input
            type="text"
            placeholder="Nama sesuai identitas"
            className="bg-white text-[#0b1220] placeholder-[#64748b] border-[#cbd5e1] focus-visible:ring-cyan-300"
            value={form.full_name}
            onChange={(e) => setForm((s) => ({ ...s, full_name: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#0b1220]">Username</label>
          <Input
            type="text"
            placeholder="Buat username untuk login"
            className="bg-white text-[#0b1220] placeholder-[#64748b] border-[#cbd5e1] focus-visible:ring-cyan-300"
            value={form.username}
            onChange={(e) => setForm((s) => ({ ...s, username: e.target.value }))}
            required
          />
          <p className="text-xs text-[#334155]">Gunakan huruf, angka, atau underscore.</p>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#0b1220]">Kata Sandi</label>
          <Input
            type="password"
            placeholder="Minimal 6 karakter"
            className="bg-white text-[#0b1220] placeholder-[#64748b] border-[#cbd5e1] focus-visible:ring-cyan-300"
            value={form.password}
            onChange={(e) => setForm((s) => ({ ...s, password: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#0b1220]">Konfirmasi Kata Sandi</label>
          <Input
            type="password"
            placeholder="Ulangi kata sandi"
            className="bg-white text-[#0b1220] placeholder-[#64748b] border-[#cbd5e1] focus-visible:ring-cyan-300"
            value={form.confirm_password}
            onChange={(e) => setForm((s) => ({ ...s, confirm_password: e.target.value }))}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[#0b1220]">Nomor HP</label>
          <Input
            type="tel"
            placeholder="Opsional"
            className="bg-white text-[#0b1220] placeholder-[#64748b] border-[#cbd5e1] focus-visible:ring-cyan-300"
            value={form.phone}
            onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
          />
        </div>

        <Button type="submit" className="w-full bg-cyan-600 text-white hover:bg-cyan-700" disabled={loading}>
          Daftar
        </Button>
      </form>

      <div className="mt-5 space-y-2 text-center text-sm text-[#334155]">
        <p>
          Sudah punya akun?{' '}
          <Link href="/login" className="font-medium text-cyan-700 hover:text-cyan-900">
            Masuk
          </Link>
        </p>
      </div>
    </SplitAuthShell>
  );
}
