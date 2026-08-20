import { requireRole } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2, XCircle, Clock, Waves } from 'lucide-react';
import { verifyPaymentAction, rejectPaymentAction } from '@/app/daftar-lomba/actions';

export const dynamic = 'force-dynamic';

const STATUS = {
  pending: { label: 'Menunggu', cls: 'bg-amber-100 text-amber-700', icon: Clock },
  verified: { label: 'Diverifikasi', cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Ditolak', cls: 'bg-red-100 text-red-700', icon: XCircle },
} as const;

export default async function VerifikasiPembayaranPage() {
  // Defense-in-depth: hanya panitia yang boleh melihat/memverifikasi.
  const { supabase } = await requireRole(['super_admin', 'event_admin', 'operator']);

  const { data: rows } = await supabase
    .from('payment_verifications')
    .select(
      'id, status, amount_due, proof_url, notes, created_at, registration_id, registrations(athletes(full_name), competition_events(name, distance_meters, stroke))'
    )
    .order('created_at', { ascending: false });

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Verifikasi Pembayaran"
        description="Terima atau tolak pembayaran pendaftaran lomba. Hanya panitia/operator yang dapat memverifikasi."
        icon={<Waves className="h-6 w-6" />}
      />

      {!rows || rows.length === 0 ? (
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
            <Waves className="h-10 w-10 text-primary" />
            <h3 className="mt-1 font-semibold text-foreground">Belum ada pembayaran</h3>
            <p className="text-sm text-muted-foreground">Pembayaran yang masuk akan muncul di sini untuk diverifikasi.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((r) => {
            const reg = (r as unknown as { registrations: { athletes: { full_name: string } | null; competition_events: { name: string } | null } | null }).registrations;
            const s = STATUS[(r.status ?? 'pending') as keyof typeof STATUS] ?? STATUS.pending;
            const Icon = s.icon;
            return (
              <Card key={r.id}>
                <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="font-semibold text-foreground">{reg?.competition_events?.name ?? 'Nomor lomba'}</div>
                    <div className="text-xs text-muted-foreground">{reg?.athletes?.full_name ?? 'Atlet'}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {r.proof_url ? `Bukti: ${r.proof_url}` : 'Tanpa bukti'} · {new Date(r.created_at).toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${s.cls}`}>
                      <Icon className="h-3.5 w-3.5" /> {s.label}
                    </span>
                    {r.status === 'pending' && (
                      <>
                        <form action={verifyPaymentAction}>
                          <input type="hidden" name="registrationId" value={r.registration_id} />
                          <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-emerald-700">
                            <CheckCircle2 className="h-4 w-4" /> Terima
                          </button>
                        </form>
                        <form action={rejectPaymentAction}>
                          <input type="hidden" name="registrationId" value={r.registration_id} />
                          <button type="submit" className="inline-flex items-center gap-1.5 rounded-xl bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700">
                            <XCircle className="h-4 w-4" /> Tolak
                          </button>
                        </form>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
