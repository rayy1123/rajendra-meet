'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  CreditCard,
  Upload,
  CheckCircle2,
  Clock,
  XCircle,
  AlertCircle,
  ReceiptText,
  User,
  Building,
  IdCard,
} from 'lucide-react';
import Link from 'next/link';
import { formatMsToTime } from '@/lib/utils';

export interface UserRegistrationItem {
  id: string;
  seed_time_ms?: number | null;
  payment_status: string;
  created_at: string;
  athletes?: {
    id: string;
    full_name: string;
    athlete_number?: string | null;
    gender: string;
    age_group: string;
    schools?: { name: string } | null;
  } | null;
  competition_events?: {
    id: string;
    order_no?: number | null;
    name: string;
    stroke: string;
    distance_meters: number;
    events?: { id: string; name: string } | null;
  } | null;
  payment_verifications?: {
    id: string;
    status: 'pending' | 'verified' | 'rejected';
    amount_due: number;
    proof_url?: string | null;
    notes?: string | null;
  } | null;
}

export function UserPaymentManager({
  registrations: initialRegs,
}: {
  registrations: UserRegistrationItem[];
}) {
  const supabase = createClient();
  const [list, setList] = useState<UserRegistrationItem[]>(initialRegs);
  const [selectedReg, setSelectedReg] = useState<UserRegistrationItem | null>(null);
  const [proofUrl, setProofUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const pendingCount = list.filter(
    (r) => !r.payment_verifications || r.payment_verifications.status === 'pending'
  ).length;

  const verifiedCount = list.filter(
    (r) => r.payment_verifications?.status === 'verified'
  ).length;

  const totalAmountDue = list.reduce(
    (sum, r) => sum + (r.payment_verifications?.amount_due || 50000),
    0
  );

  const handleOpenUpload = (item: UserRegistrationItem) => {
    setSelectedReg(item);
    setProofUrl(item.payment_verifications?.proof_url || '');
    setNotes(item.payment_verifications?.notes || '');
    setOpenModal(true);
  };

  const handleSaveProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedReg) return;
    if (!proofUrl.trim()) {
      toast.error('Masukkan URL bukti transfer atau konfirmasi pembayaran.');
      return;
    }

    setUploading(true);
    try {
      if (selectedReg.payment_verifications?.id) {
        // Update existing verification
        const { error } = await supabase
          .from('payment_verifications')
          .update({
            proof_url: proofUrl.trim(),
            notes: notes.trim(),
            status: 'pending',
          })
          .eq('id', selectedReg.payment_verifications.id);

        if (error) throw new Error(error.message);
      } else {
        // Insert new verification
        const { error } = await supabase.from('payment_verifications').insert({
          registration_id: selectedReg.id,
          proof_url: proofUrl.trim(),
          notes: notes.trim(),
          status: 'pending',
          amount_due: 50000,
        });

        if (error) throw new Error(error.message);
      }

      toast.success('Bukti pembayaran berhasil diunggah! Menunggu verifikasi panitia.');
      setList((prev) =>
        prev.map((r) =>
          r.id === selectedReg.id
            ? {
                ...r,
                payment_verifications: {
                  id: r.payment_verifications?.id || 'new',
                  status: 'pending',
                  amount_due: r.payment_verifications?.amount_due || 50000,
                  proof_url: proofUrl.trim(),
                  notes: notes.trim(),
                },
              }
            : r
        )
      );
      setOpenModal(false);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan bukti pembayaran.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Total Pendaftaran
              </p>
              <h3 className="text-2xl font-black mt-1 text-foreground">{list.length} Nomor</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Estimasi Biaya: Rp {totalAmountDue.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
              <ReceiptText className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Menunggu Verifikasi
              </p>
              <h3 className="text-2xl font-black mt-1 text-amber-600">{pendingCount} Nomor</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Upload bukti transfer untuk diproses
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-xs">
          <CardContent className="p-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase">
                Lunas / Terverifikasi
              </p>
              <h3 className="text-2xl font-black mt-1 text-emerald-600">{verifiedCount} Nomor</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Siap bertanding di lintasan
              </p>
            </div>
            <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Rekening Panitia */}
      <div className="rounded-2xl border bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/20 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-600" /> Informasi Rekening Pembayaran Kejuaraan
            </h4>
            <p className="text-xs text-muted-foreground">
              Transfer biaya pendaftaran sebesar <b>Rp 50.000 / nomor lomba</b> ke rekening resmi panitia:
            </p>
            <p className="text-xs font-mono font-bold text-blue-950 dark:text-blue-100 mt-1">
              Bank BCA: <b>872-098-1234</b> a.n. <b>Panitia Rajendra Meet SCMS</b>
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Link href="/kartu-peserta">
              <Button size="sm" variant="outline" className="text-xs font-bold gap-1.5 border-blue-300 text-blue-900 dark:text-blue-200 hover:bg-blue-100/50">
                <IdCard className="w-4 h-4 text-blue-600" />
                Cetak Kartu Peserta
              </Button>
            </Link>
            <Link href="/daftar-lomba">
              <Button size="sm" variant="default" className="text-xs font-bold gap-1">
                + Daftar Nomor Lain
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Daftar Pendaftaran & Bukti Bayar */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-foreground">
          Daftar Pendaftaran Saya ({list.length})
        </h3>

        {list.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <ReceiptText className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <h4 className="font-bold text-base text-foreground">Belum ada nomor lomba yang didaftarkan</h4>
            <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
              Silakan pilih event kejuaraan renang dan daftarkan atlet Anda melalui menu Daftar Lomba.
            </p>
            <Link href="/daftar-lomba">
              <Button className="mt-4 gap-2 text-xs font-bold">
                Mulai Daftar Lomba Sekarang &rarr;
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {list.map((item) => {
              const status = item.payment_verifications?.status || 'pending';
              const isVerified = status === 'verified';
              const isRejected = status === 'rejected';

              return (
                <Card key={item.id} className="overflow-hidden hover:shadow-xs transition-shadow">
                  <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    {/* Left: Event & Athlete Info */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline" className="text-[10px] font-mono font-bold">
                          {item.competition_events?.events?.name || 'Kejuaraan Renang'}
                        </Badge>
                        <span className="text-xs font-bold text-muted-foreground">·</span>
                        <span className="text-sm font-black text-foreground">
                          {item.competition_events?.name}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1 font-semibold text-foreground">
                          <User className="w-3.5 h-3.5 text-primary" /> {item.athletes?.full_name}
                        </span>
                        <span>(KU: {item.athletes?.age_group || 'Umum'})</span>
                        {item.athletes?.schools?.name && (
                          <span className="flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-primary" /> {item.athletes.schools.name}
                          </span>
                        )}
                        {item.seed_time_ms && (
                          <span>Seed: <b>{formatMsToTime(item.seed_time_ms)}</b></span>
                        )}
                      </div>

                      {item.payment_verifications?.notes && (
                        <p className="text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 px-2.5 py-1 rounded-md w-fit">
                          Catatan: {item.payment_verifications.notes}
                        </p>
                      )}
                    </div>

                    {/* Right: Payment Status & Upload Action */}
                    <div className="flex items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0">
                      <div>
                        {isVerified ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1 text-xs py-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Lunas / Terverifikasi
                          </Badge>
                        ) : isRejected ? (
                          <Badge variant="destructive" className="gap-1 text-xs py-1">
                            <XCircle className="w-3.5 h-3.5" /> Ditolak (Upload Ulang)
                          </Badge>
                        ) : item.payment_verifications?.proof_url ? (
                          <Badge variant="secondary" className="gap-1 text-xs py-1 text-amber-700 bg-amber-50 dark:bg-amber-950/40 border border-amber-300">
                            <Clock className="w-3.5 h-3.5" /> Menunggu Review Panitia
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1 text-xs py-1 text-red-600 border-red-300 bg-red-50 dark:bg-red-950/30">
                            <AlertCircle className="w-3.5 h-3.5" /> Belum Upload Bukti
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/kartu-peserta?athleteId=${item.athletes?.id || ''}`}>
                          <Button
                            size="sm"
                            variant="outline"
                            className="gap-1 text-xs font-bold shrink-0 border-slate-300 text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200"
                            title="Lihat & Cetak Kartu Peserta Atlet"
                          >
                            <IdCard className="w-3.5 h-3.5 text-primary" />
                            Kartu Peserta
                          </Button>
                        </Link>
                        <Button
                          size="sm"
                          variant={isVerified ? 'outline' : 'default'}
                          onClick={() => handleOpenUpload(item)}
                          className="gap-1.5 text-xs font-bold shrink-0"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          {item.payment_verifications?.proof_url ? 'Ubah Bukti' : 'Upload Bukti'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal Upload Bukti Transfer */}
      <Dialog open={openModal} onOpenChange={setOpenModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Upload className="w-5 h-5 text-primary" /> Unggah Bukti Pembayaran
            </DialogTitle>
          </DialogHeader>

          {selectedReg && (
            <form onSubmit={handleSaveProof} className="space-y-4 pt-2">
              <div className="rounded-xl bg-muted/40 p-3 space-y-1 text-xs">
                <p className="font-bold text-foreground">
                  {selectedReg.competition_events?.name}
                </p>
                <p className="text-muted-foreground">
                  Atlet: <b>{selectedReg.athletes?.full_name}</b> · Biaya: <b>Rp {(selectedReg.payment_verifications?.amount_due || 50000).toLocaleString('id-ID')}</b>
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Link / URL Bukti Transfer Pembayaran <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="https://imgur.com/bukti-transfer.jpg atau link foto resi"
                  value={proofUrl}
                  onChange={(e) => setProofUrl(e.target.value)}
                  required
                />
                <p className="text-[11px] text-muted-foreground">
                  Salin tautan foto bukti transfer atau resi ATM / Mobile Banking Anda.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground">
                  Catatan Pengirim (Opsional)
                </label>
                <Input
                  placeholder="Contoh: Transfer dari Rekening BCA a.n. Ahmad Budi"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setOpenModal(false)}
                  disabled={uploading}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={uploading} className="gap-1.5 font-bold">
                  {uploading ? 'Menyimpan...' : 'Kirim Bukti Pembayaran'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
