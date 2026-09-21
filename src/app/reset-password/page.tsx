'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SplitAuthShell } from '@/components/layout/split-auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    if (!password || password.length < 6) {
      setErrorMsg('Kata sandi minimal 6 karakter.');
      setLoading(false);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      setLoading(false);
      return;
    }

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setSuccessMsg('Kata sandi berhasil diperbarui. Silakan login.');
      setPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        window.location.assign('/login');
      }, 900);
    } catch {
      setErrorMsg('Gagal memperbarui kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SplitAuthShell
      title="Reset Kata Sandi"
      subtitle="Buat kata sandi baru untuk akun Anda."
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
          <label className="text-xs font-semibold text-[var(--m-ink)]">Kata Sandi Baru</label>
          <Input
            type="password"
            placeholder="Minimal 6 karakter"
            className="bg-white text-[var(--m-ink)] placeholder-[var(--m-muted)] border-[var(--m-border)] focus-visible:ring-primary/40"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-[var(--m-ink)]">Konfirmasi Kata Sandi</label>
          <Input
            type="password"
            placeholder="Ulangi kata sandi"
            className="bg-white text-[var(--m-ink)] placeholder-[var(--m-muted)] border-[var(--m-border)] focus-visible:ring-primary/40"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full bg-primary text-white hover:bg-primary/90" disabled={loading}>
          Simpan Kata Sandi
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-[var(--m-muted)]">
        <Link href="/login" className="font-medium text-primary hover:text-cyan-900">
          ← Kembali ke login
        </Link>
      </div>
    </SplitAuthShell>
  );
}
