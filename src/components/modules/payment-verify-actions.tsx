'use client';

import { useState, useTransition } from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { updatePaymentStatus } from '@/app/(dashboard)/verifikasi-pembayaran/actions';
import { toast } from 'sonner';

export function PaymentVerifyActions({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);

  function run(status: 'approved' | 'rejected') {
    setBusy(status === 'approved' ? 'approve' : 'reject');
    const fd = new FormData();
    fd.set('id', id);
    fd.set('status', status);
    startTransition(async () => {
      const res = await updatePaymentStatus(fd);
      if (res.ok) {
        toast.success(status === 'approved' ? 'Pembayaran disetujui.' : 'Pembayaran ditolak.');
      } else {
        toast.error(res.error ?? 'Gagal memproses.');
        setBusy(null);
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => run('approved')}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-ui hover:bg-emerald-700 disabled:opacity-60"
      >
        {busy === 'approve' && pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle2 className="h-3.5 w-3.5" />}
        Setuju
      </button>
      <button
        type="button"
        onClick={() => run('rejected')}
        disabled={pending}
        className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition-ui hover:bg-red-100 disabled:opacity-60"
      >
        {busy === 'reject' && pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <XCircle className="h-3.5 w-3.5" />}
        Tolak
      </button>
    </div>
  );
}
