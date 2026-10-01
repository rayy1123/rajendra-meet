'use client';

import { useState, useEffect } from 'react';
import {
  Mail,
  CheckCircle2,
  ShieldCheck,
  X,
  RefreshCw,
  KeyRound,
  AlertCircle,
  MessageCircle,
  Copy,
  Headphones,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { BrandedSpinner } from '@/components/ui/branded-loading';
import { toast } from 'sonner';

export interface EmailOtpDialogProps {
  open: boolean;
  email: string;
  fullName?: string;
  onClose: () => void;
  onVerified: () => void;
}

export function EmailOtpDialog({
  open,
  email,
  fullName,
  onClose,
  onVerified,
}: EmailOtpDialogProps) {
  const [step, setStep] = useState<'confirm_email' | 'input_otp'>('confirm_email');
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [fallbackToAdmin, setFallbackToAdmin] = useState(false);
  const [showAdminHelp, setShowAdminHelp] = useState(false);

  useEffect(() => {
    if (open) {
      setStep('confirm_email');
      setOtpCode('');
      setErrorMsg('');
      setSendingOtp(false);
      setVerifyingOtp(false);
      setFallbackToAdmin(false);
      setShowAdminHelp(false);
    }
  }, [open, email]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  if (!open) return null;

  // Sinyal 1: Kirim Kode OTP ke Email via Brevo API / Fallback Admin
  const handleSendOtpSignal = async () => {
    setSendingOtp(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/auth/otp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, fullName }),
      });
      const data = await res.json();

      if (res.ok && data?.success) {
        if (data?.fallbackToAdmin) {
          setFallbackToAdmin(true);
          setShowAdminHelp(true);
          toast.warning('Kuota email habis. Kode OTP telah diteruskan ke Admin!');
        } else {
          setFallbackToAdmin(false);
          toast.success(`Sinyal terkirim! Kode OTP 6-digit telah dikirim ke ${email}`);
        }
        setStep('input_otp');
        setResendCooldown(60);
      } else {
        setErrorMsg(data?.error || 'Gagal mengirim sinyal OTP.');
        toast.error(data?.error || 'Gagal mengirim OTP.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan saat mengirim sinyal OTP.');
    } finally {
      setSendingOtp(false);
    }
  };

  // Sinyal 2: Verifikasi Kode OTP 6-Digit dari User
  const handleVerifyOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = otpCode.trim();
    if (!cleanCode || cleanCode.length < 6) {
      setErrorMsg('Masukkan 6 digit kode OTP secara lengkap.');
      return;
    }

    setVerifyingOtp(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: cleanCode }),
      });
      const data = await res.json();

      if (res.ok && data?.success) {
        toast.success('Email berhasil diverifikasi!');
        onVerified();
      } else {
        setErrorMsg(data?.error || 'Kode OTP tidak cocok.');
        toast.error(data?.error || 'Verifikasi OTP gagal.');
      }
    } catch {
      setErrorMsg('Terjadi kesalahan jaringan saat memverifikasi OTP.');
    } finally {
      setVerifyingOtp(false);
    }
  };

  const copyAdminHelpMessage = () => {
    const text = `Halo Admin Rajendra Swim System, saya sedang mendaftar akun atas nama ${fullName || 'Peserta'} dengan email ${email}. Boleh minta kode OTP 6-digit verifikasinya dari Dashboard? Terima kasih.`;
    navigator.clipboard.writeText(text);
    toast.success('Pesan permintaan OTP disalin ke clipboard!');
  };

  const openWhatsAppAdmin = () => {
    const text = encodeURIComponent(
      `Halo Admin Rajendra Swim System, saya sedang mendaftar akun atas nama ${fullName || 'Peserta'} dengan email ${email}. Boleh minta 6 digit kode OTP verifikasinya dari Dashboard Admin? Terima kasih.`
    );
    window.open(`https://wa.me/6281283626284?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4">
        {/* Header Dialog */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-2xs">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {step === 'confirm_email' ? 'Konfirmasi Alamat Email' : 'Verifikasi Kode OTP'}
              </h3>
              <p className="text-[11px] text-slate-500 font-medium">
                {step === 'confirm_email'
                  ? 'Pastikan kebenaran email pendaftaran Anda'
                  : 'Masukkan 6 digit kode OTP verifikasi akun'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {errorMsg && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* ── STEP 1: PERTANYAAN KONFIRMASI EMAIL ── */}
        {step === 'confirm_email' && (
          <div className="space-y-4">
            <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50/80 to-cyan-50/60 p-4 text-center space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200">
                <ShieldCheck className="h-3 w-3 text-blue-600" /> PERTANYAAN KONFIRMASI EMAIL
              </span>

              <h4 className="text-base font-extrabold text-slate-900 pt-1">
                Apakah <span className="text-blue-600 underline underline-offset-2">{email}</span> email Anda?
              </h4>

              <p className="text-xs text-slate-600 leading-relaxed px-2">
                Setelah Anda mengonfirmasi, sistem akan langsung mengirimkan sinyal kode OTP 6-digit ke alamat email tersebut dan menyelaraskan dengan Dashboard Admin.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="w-full sm:w-1/2 h-10 text-xs font-bold rounded-xl border-slate-300"
              >
                Ubah Email
              </Button>
              <Button
                type="button"
                onClick={handleSendOtpSignal}
                disabled={sendingOtp}
                className="w-full sm:w-1/2 h-10 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-700 text-white gap-2 shadow-xs cursor-pointer"
              >
                {sendingOtp ? (
                  <>
                    <BrandedSpinner className="h-4 w-4" />
                    <span>Mengirim Sinyal...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Ya, Kirim Kode OTP</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* ── STEP 2: INPUT KODE OTP 6-DIGIT & NOTIFIKASI ADMIN FALLBACK ── */}
        {step === 'input_otp' && (
          <form onSubmit={handleVerifyOtpSubmit} className="space-y-4">
            {/* Notifikasi khusus jika kuota email habis atau diteruskan ke admin */}
            {(fallbackToAdmin || showAdminHelp) && (
              <div className="rounded-xl border border-amber-300 bg-amber-50/90 p-3.5 space-y-2.5 text-xs text-amber-950">
                <div className="flex items-start gap-2">
                  <Headphones className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-900 text-xs">
                      {fallbackToAdmin
                        ? 'Kuota Email Terbatas • Kode Diteruskan ke Admin'
                        : 'Kode Belum Masuk? Hubungi Admin Panitia'}
                    </p>
                    <p className="text-[11px] text-amber-800 leading-snug mt-0.5">
                      Kode OTP untuk <b>{email}</b> telah diteruskan langsung ke <b>Dashboard Admin / Panitia</b>. Silakan hubungi admin untuk memperoleh kode OTP Anda.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-amber-200">
                  <button
                    type="button"
                    onClick={openWhatsAppAdmin}
                    className="flex-1 h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold inline-flex items-center justify-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>Hubungi Admin (WhatsApp)</span>
                  </button>
                  <button
                    type="button"
                    onClick={copyAdminHelpMessage}
                    className="h-8 px-2.5 rounded-lg border border-amber-300 bg-white hover:bg-amber-100/50 text-amber-900 text-[11px] font-semibold inline-flex items-center gap-1 transition-colors cursor-pointer"
                    title="Salin pesan permintaan kode ke admin"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span>Salin</span>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-2 text-center">
              <p className="text-xs text-slate-600">
                {!fallbackToAdmin ? (
                  <>
                    Kode OTP 6-digit telah dikirim ke <b className="text-blue-900">{email}</b>. Masukkan kode tersebut di bawah ini:
                  </>
                ) : (
                  <>
                    Masukkan 6 digit kode OTP yang Anda peroleh dari Panitia / Admin:
                  </>
                )}
              </p>

              <div className="pt-1">
                <Input
                  type="text"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  className="mx-auto h-14 w-60 text-center font-mono text-3xl font-black tracking-[10px] text-slate-950 bg-white rounded-xl border-2 border-slate-900 shadow-2xs focus-visible:ring-2 focus-visible:ring-blue-500/30"
                  autoFocus
                  required
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 px-1">
                {!showAdminHelp && (
                  <button
                    type="button"
                    onClick={() => setShowAdminHelp(true)}
                    className="font-bold text-amber-700 hover:text-amber-800 hover:underline cursor-pointer flex items-center gap-1"
                  >
                    <Info className="h-3 w-3" />
                    Kode belum masuk?
                  </button>
                )}

                <button
                  type="button"
                  disabled={resendCooldown > 0 || sendingOtp}
                  onClick={handleSendOtpSignal}
                  className="ml-auto font-bold text-blue-600 hover:underline disabled:opacity-50 cursor-pointer flex items-center gap-1"
                >
                  <RefreshCw className={`h-3 w-3 ${sendingOtp ? 'animate-spin' : ''}`} />
                  {resendCooldown > 0 ? `Kirim Ulang (${resendCooldown}s)` : 'Kirim Ulang OTP'}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('confirm_email')}
                className="h-9 px-3 text-xs"
              >
                Kembali
              </Button>
              <Button
                type="submit"
                disabled={verifyingOtp || otpCode.length < 6}
                className="h-9 px-4 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white gap-1.5 shadow-xs cursor-pointer"
              >
                {verifyingOtp ? <BrandedSpinner className="h-3.5 w-3.5" /> : <KeyRound className="h-3.5 w-3.5" />}
                Verifikasi Kode OTP
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
