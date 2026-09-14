'use client';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Eye } from 'lucide-react';

export function PaymentProofDialog({ url }: { url: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1 font-medium text-[var(--m-aqua-ink)] hover:underline cursor-pointer">
          <Eye className="h-3.5 w-3.5" /> Lihat bukti
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden bg-transparent border-none shadow-none">
        <div className="flex justify-center bg-black/40 rounded-lg p-2">
          <img src={url} alt="Bukti Pembayaran" className="max-w-full max-h-[80vh] object-contain" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
