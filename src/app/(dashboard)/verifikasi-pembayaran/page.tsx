import { requireRole } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { CreditCard, CheckCircle2, XCircle, Eye } from 'lucide-react';
import { PaymentVerifyActions } from '@/components/modules/payment-verify-actions';

export const dynamic = 'force-dynamic';

interface PaymentRow {
  id: string;
  status: string;
  amount_due: number | null;
  proof_url: string | null;
  created_at: string;
  registration: {
    athletes: { full_name: string } | null;
    events: { name: string } | null;
    competition_events: { name: string; distance_meters: number | null; stroke: string | null } | null;
    profiles: { full_name: string; email: string } | null;
  } | null;
}

export default async function VerifikasiPembayaranPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { supabase } = await requireRole(['super_admin', 'event_admin', 'operator']);
  const { status } = await searchParams;

  let query = supabase
    .from('payment_verifications')
    .select(
      `id, status, amount_due, proof_url, created_at,
       registration:registrations(
         athletes(full_name),
         events(name),
         competition_events(name, distance_meters, stroke),
         profiles(full_name, email)
       )`,
    )
    .order('created_at', { ascending: false });

  if (status === 'pending' || status === 'approved' || status === 'rejected') {
    query = query.eq('status', status);
  }

  const { data } = await query;
  const rows = (data ?? []) as unknown as PaymentRow[];

  const counts = {
    pending: rows.filter((r) => r.status === 'pending').length,
    approved: rows.filter((r) => r.status === 'approved').length,
    rejected: rows.filter((r) => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Verifikasi Pembayaran' }]} className="mb-2" />
      <PageHeader
        title="Verifikasi Pembayaran"
        description="Tinjau bukti pembayaran pendaftaran dan setujui atau tolak."
        icon={<CreditCard className="h-6 w-6" />}
      />

      {/* Filter status */}
      <div className="flex flex-wrap items-center gap-2">
        <FilterChip href="/verifikasi-pembayaran" label="Semua" active={!status} />
        <FilterChip href="/verifikasi-pembayaran?status=pending" label={`Menunggu (${counts.pending})`} active={status === 'pending'} />
        <FilterChip href="/verifikasi-pembayaran?status=approved" label={`Disetujui (${counts.approved})`} active={status === 'approved'} />
        <FilterChip href="/verifikasi-pembayaran?status=rejected" label={`Ditolak (${counts.rejected})`} active={status === 'rejected'} />
      </div>

      {rows.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center">
          <CreditCard className="mx-auto h-10 w-10 text-[var(--m-aqua)]" />
          <h3 className="mt-3 font-semibold text-[var(--m-ink)]">Belum ada pembayaran</h3>
          <p className="mt-1 text-sm text-[var(--m-muted)]">
            Pembayaran akan muncul saat peserta mendaftarkan atlet ke lomba.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-card)]">
          <div className="divide-y divide-border">
            {rows.map((r) => {
              const athlete = r.registration?.athletes?.full_name ?? 'Atlet';
              const eventName = r.registration?.events?.name ?? 'Event';
              const ce = r.registration?.competition_events;
              const ceName = ce ? `${ce.distance_meters}m ${ce.stroke}` : '-';
              const registrant = r.registration?.profiles;
              return (
                <div key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="font-semibold text-[var(--m-ink)]">{athlete}</div>
                    <div className="text-xs text-[var(--m-muted)]">
                      {eventName} · {ceName}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--m-muted)]">
                      Pendaftar: {registrant?.full_name ?? registrant?.email ?? '-'}
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs">
                      <span className="font-semibold text-[var(--m-ink)]">
                        Rp {(r.amount_due ?? 0).toLocaleString('id-ID')}
                      </span>
                      {r.proof_url && (
                        <a
                          href={r.proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
                        >
                          <Eye className="h-3.5 w-3.5" /> Lihat bukti
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={r.status} />
                    {r.status === 'pending' && (
                      <PaymentVerifyActions id={r.id} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function FilterChip({ href, label, active }: { href: string; label: string; active: boolean }) {
  return (
    <a
      href={href}
      className={
        active
          ? 'rounded-full bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground'
          : 'rounded-full border border-border px-4 py-1.5 text-sm text-[var(--m-muted)] transition-ui hover:border-primary hover:text-primary'
      }
    >
      {label}
    </a>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    pending: { cls: 'bg-amber-100 text-amber-700', icon: <CreditCard className="h-3.5 w-3.5" />, label: 'Menunggu' },
    approved: { cls: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: 'Disetujui' },
    rejected: { cls: 'bg-red-100 text-red-700', icon: <XCircle className="h-3.5 w-3.5" />, label: 'Ditolak' },
  };
  const s = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${s.cls}`}>
      {s.icon} {s.label}
    </span>
  );
}
