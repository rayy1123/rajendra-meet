'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SplitAuthShell } from '@/components/layout/split-auth-shell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrandedSpinner } from '@/components/ui/branded-loading';
import { EmailOtpDialog } from '@/components/modules/email-otp-dialog';
import { KeyRound, CheckCircle2, Lock, ShieldCheck, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'input_email' | 'set_new_password'>('input_email');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [targetOtpEmail, setTargetOtpEmail] = useState('');

  const handleRequestOtp = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const rawEmail = email.trim().toLowerCase();
    if (!rawEmail) {
      setErrorMsg('Alamat email akun wajib diisi.');
      return;
    }

    const resolvedEmail = rawEmail.includes('@') ? rawEmail : `${rawEmail}@gmail.com`;
    setTargetOtpEmail(resolvedEmail);
    setShowOtpModal(true);
  };

  const handleOtpVerified = () => {
    setShowOtpModal(false);
    setStep('set_new_password');
    toast.success('Kode OTP berhasil diverifikasi via Brevo! Silakan buat kata sandi baru.');
  };

  const handleSaveNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (newPassword.length < 6) {
      setErrorMsg('Kata sandi baru minimal 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: targetOtpEmail,
          password: newPassword,
        }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setSuccessMsg('Kata sandi berhasil diperbarui! Mengalihkan ke halaman masuk...');
        toast.success('Kata sandi berhasil diperbarui!');
        setTimeout(() => {
          window.location.assign('/login');
        }, 1200);
      } else {
        setErrorMsg(data.error || 'Gagal memperbarui kata sandi.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan saat menyimpan kata sandi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SplitAuthShell
      title="Reset Kata Sandi Akun"
      subtitle="Verifikasi email Anda via Brevo OTP untuk mengatur ulang kata sandi secara instan dan aman."
      footerLinks={[
        { label: 'Bantuan Teknis', href: '/guide' },
        { label: 'Ketentuan Privasi', href: '/juknis' },
      ]}
    >
      {(errorMsg || successMsg) && (
        <div className="mb-5 space-y-2">
          {errorMsg && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700 shadow-2xs">
              {errorMsg}
            </div>
          )}
          {successMsg && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs font-semibold text-emerald-800 shadow-2xs">
              {successMsg}
            </div>
          )}
        </div>
      )}

      {step === 'input_email' ? (
        <form onSubmit={handleRequestOtp} className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--m-ink)]">Alamat Email Terdaftar</label>
            <Input
              type="email"
              placeholder="nama@contoh.com"
              className="bg-white text-[var(--m-ink)] placeholder-[var(--m-muted)] border-[var(--m-border)] focus-visible:ring-primary/40 h-10 rounded-xl"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <p className="text-[11px] text-slate-500">
              Sistem akan mengirimkan 6 digit kode OTP verifikasi langsung ke alamat email Anda via Brevo.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 text-white hover:bg-blue-700 font-bold text-xs h-10 rounded-xl cursor-pointer shadow-xs gap-2"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <BrandedSpinner className="h-4 w-4" />
                <span>Memproses...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <KeyRound className="h-4 w-4" />
                <span>Kirim Kode OTP (Brevo)</span>
              </span>
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={handleSaveNewPassword} className="mt-4 space-y-4">
          <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3 flex items-center justify-between text-xs text-blue-950 font-semibold">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>Email Terverifikasi: <b>{targetOtpEmail}</b></span>
            </span>
            <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
              OTP Valid
            </span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--m-ink)]">Kata Sandi Baru</label>
            <Input
              type="password"
              placeholder="Minimal 6 karakter"
              className="bg-white text-[var(--m-ink)] placeholder-[var(--m-muted)] border-[var(--m-border)] focus-visible:ring-primary/40 h-10 rounded-xl"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[var(--m-ink)]">Konfirmasi Kata Sandi Baru</label>
            <Input
              type="password"
              placeholder="Ulangi kata sandi baru"
              className="bg-white text-[var(--m-ink)] placeholder-[var(--m-muted)] border-[var(--m-border)] focus-visible:ring-primary/40 h-10 rounded-xl"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-xs h-10 rounded-xl cursor-pointer shadow-xs gap-2"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <BrandedSpinner className="h-4 w-4" />
                <span>Menyimpan Kata Sandi...</span>
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                <Lock className="h-4 w-4" />
                <span>Simpan Kata Sandi Baru</span>
              </span>
            )}
          </Button>
        </form>
      )}

      <div className="mt-6 text-center text-sm text-[var(--m-muted)]">
        <Link href="/login" className="font-semibold text-primary hover:text-cyan-900 text-xs">
          ← Kembali ke halaman login
        </Link>
      </div>

      <EmailOtpDialog
        open={showOtpModal}
        email={targetOtpEmail}
        onClose={() => setShowOtpModal(false)}
        onVerified={handleOtpVerified}
      />
    </SplitAuthShell>
  );
}
