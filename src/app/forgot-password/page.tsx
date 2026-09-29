'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SplitAuthShell } from '@/components/layout/split-auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { BrandedSpinner } from '@/components/ui/branded-loading';
import { EmailOtpDialog } from '@/components/modules/email-otp-dialog';
import { ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [targetOtpEmail, setTargetOtpEmail] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const rawEmail = email.trim().toLowerCase();
    if (!rawEmail) {
      setErrorMsg('Email atau username akun wajib diisi.');
      return;
    }

    const resolvedEmail = rawEmail.includes('@') ? rawEmail : `${rawEmail}@gmail.com`;
    setTargetOtpEmail(resolvedEmail);
    setShowOtpModal(true);
  };

  const executeResetPassword = async () => {
    setShowOtpModal(false);
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(targetOtpEmail, {
        redirectTo,
      });

      if (error) {
        setErrorMsg(error.message || 'Gagal mengirim instruksi reset kata sandi.');
      } else {
        setSuccessMsg(`Email terverifikasi OTP! Tautan reset kata sandi telah dikirim ke ${targetOtpEmail}. Silakan periksa email Anda.`);
        setEmail('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SplitAuthShell
      title="Lupa Kata Sandi"
      subtitle="Masukkan email Anda untuk menerima tautan reset kata sandi."
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
          <label className="text-xs font-semibold text-[var(--m-ink)]">Email</label>
          <Input
            type="email"
            placeholder="nama@contoh.com"
            className="bg-white text-[var(--m-ink)] placeholder-[var(--m-muted)] border-[var(--m-border)] focus-visible:ring-primary/40"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <Button type="submit" className="w-full bg-primary text-white hover:bg-primary/90 font-bold text-xs h-10 rounded-xl cursor-pointer" disabled={loading}>
          {loading ? (
            <span className="flex items-center gap-2">
              <BrandedSpinner className="h-4 w-4" />
              <span>Mengirim Email via Brevo...</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <KeyRound className="h-4 w-4" />
              <span>Kirim Tautan Reset Kata Sandi</span>
            </span>
          )}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm text-[var(--m-muted)]">
        <Link href="/login" className="font-medium text-primary hover:text-cyan-900">
          ← Kembali ke login
        </Link>
      </div>

      <EmailOtpDialog
        open={showOtpModal}
        email={targetOtpEmail}
        onClose={() => setShowOtpModal(false)}
        onVerified={executeResetPassword}
      />
    </SplitAuthShell>
  );
}
