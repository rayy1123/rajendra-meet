import { requireRole } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { CreditCard, CheckCircle2, XCircle, Eye, FileText } from 'lucide-react';
import Link from 'next/link';
import { PaymentVerifyActions } from '@/components/modules/payment-verify-actions';
import { EmptyState } from '@/components/ui/empty-state';

export const dynamic = 'force-dynamic';

interface PaymentRow {
  id: string;
  status: string;
  amount_due: number | null;
  base_amount?: number | null;
  unique_code?: number | null;
  proof_url: string | null;
  created_at: string;
  registration_id?: string | null;
  registration: {
    id?: string;
    registrant_id?: string | null;
    athlete_id?: string | null;
    athletes: { full_name: string } | null;
    events: { name: string } | null;
    competition_events: { name: string; distance_meters: number | null; stroke: string | null } | null;
  } | null;
}

export default async function VerifikasiPembayaranPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { supabase } = await requireRole(['super_admin', 'event_admin', 'operator']);
  const { status } = await searchParams;

  // 1. Ambil status counts secara menyeluruh agar tab filter menampilkan angka akurat
  const { data: allStatuses } = await supabase
    .from('payment_verifications')
    .select('status');

  const counts = {
    all: (allStatuses ?? []).length,
    pending: (allStatuses ?? []).filter((r) => r.status === 'pending').length,
    approved: (allStatuses ?? []).filter((r) => r.status === 'verified' || r.status === 'approved').length,
    rejected: (allStatuses ?? []).filter((r) => r.status === 'rejected').length,
  };

  // 2. Query data pembayaran (hanya kolom valid skema: id, status, amount_due, proof_url, created_at, registration_id)
  let query = supabase
    .from('payment_verifications')
    .select(
      `id, status, amount_due, proof_url, created_at, registration_id,
       registration:registrations(
         id,
         registrant_id,
         athlete_id,
         athletes(id, full_name, athlete_number, school_id, schools(name)),
         events(id, name),
         competition_events(id, name, distance_meters, stroke)
       )`,
    )
    .order('created_at', { ascending: false });

  if (status === 'pending') {
    query = query.eq('status', 'pending');
  } else if (status === 'approved' || status === 'verified') {
    query = query.in('status', ['verified', 'approved']);
  } else if (status === 'rejected') {
    query = query.eq('status', 'rejected');
  }

  const { data: rawData } = await query;
  const rawRows = (rawData ?? []) as any[];

  // 3. Normalisasi & hitung rincian biaya pokok serta kode unik
  const rows: PaymentRow[] = rawRows.map((r: any) => {
    const amount = Number(r.amount_due) || 0;
    const unique = amount % 1000 !== 0 ? amount % 1000 : 0;
    const base = amount > 0 ? (unique > 0 ? amount - unique : amount) : 0;
    return {
      id: r.id,
      status: r.status,
      amount_due: amount,
      base_amount: r.base_amount ?? base,
      unique_code: r.unique_code ?? unique,
      proof_url: r.proof_url,
      created_at: r.created_at,
      registration_id: r.registration_id,
      registration: r.registration,
    };
  });

  // 4. Jika ada baris yang relasi registration-nya null, fetch langsung sebagai fallback
  const missingRegIds = rows
    .filter((r) => !r.registration && r.registration_id)
    .map((r) => r.registration_id as string);

  if (missingRegIds.length > 0) {
    const { data: directRegs } = await supabase
      .from('registrations')
      .select(`
        id,
        registrant_id,
        athlete_id,
        athletes(id, full_name, athlete_number, school_id, schools(name)),
        events(id, name),
        competition_events(id, name, distance_meters, stroke)
      `)
      .in('id', missingRegIds);

    if (directRegs && directRegs.length > 0) {
      const regMap = new Map(directRegs.map((d: any) => [d.id, d]));
      rows.forEach((r) => {
        if (!r.registration && r.registration_id && regMap.has(r.registration_id)) {
          r.registration = regMap.get(r.registration_id) as any;
        }
      });
    }
  }

  // 5. Ambil data profil pendaftar
  const registrantIds = Array.from(
    new Set(
      rows
        .map((r) => r.registration?.registrant_id)
        .filter((id): id is string => Boolean(id)),
    ),
  );
  const { data: profiles } = registrantIds.length
    ? await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', registrantIds)
    : { data: [] as { id: string; full_name: string; email: string }[] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumb items={[{ label: 'Dasbor', href: '/dashboard' }, { label: 'Verifikasi Pembayaran' }]} className="mb-2" />
      <PageHeader
        title="Verifikasi Pembayaran"
        description="Tinjau bukti pembayaran pendaftaran dan setujui atau tolak."
        icon={<CreditCard className="h-6 w-6" />}
      />

      <div className="flex flex-wrap items-center gap-2">
        <FilterChip href="/verifikasi-pembayaran" label={`Semua (${counts.all})`} active={!status} />
        <FilterChip href="/verifikasi-pembayaran?status=pending" label={`Menunggu (${counts.pending})`} active={status === 'pending'} />
        <FilterChip href="/verifikasi-pembayaran?status=approved" label={`Disetujui (${counts.approved})`} active={status === 'approved' || status === 'verified'} />
        <FilterChip href="/verifikasi-pembayaran?status=rejected" label={`Ditolak (${counts.rejected})`} active={status === 'rejected'} />
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-6 w-6" />}
          title="Belum Ada Pembayaran"
          description={
            status
              ? `Tidak ada data pembayaran dengan status "${status}".`
              : "Pembayaran akan muncul saat peserta mendaftarkan atlet ke nomor lomba."
          }
        />
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="divide-y divide-[var(--m-border)]">
            {rows.map((r) => {
              const rawAth = r.registration?.athletes;
              const rawAthObj = Array.isArray(rawAth) ? rawAth[0] : rawAth;
              const athlete = rawAthObj?.full_name ?? 'Atlet';
              const rawSchool = Array.isArray(rawAthObj?.schools) ? rawAthObj?.schools[0] : rawAthObj?.schools;
              const schoolName = rawSchool?.name || 'Mandiri';

              const rawEvt = r.registration?.events;
              const eventName = Array.isArray(rawEvt) ? rawEvt[0]?.name : rawEvt?.name ?? 'Event';

              const rawCe = r.registration?.competition_events;
              const ce = Array.isArray(rawCe) ? rawCe[0] : rawCe;
              const ceName = ce ? `${ce.distance_meters}m ${ce.stroke} (${ce.name})` : '-';

              const registrant = r.registration?.registrant_id
                ? profileMap.get(r.registration.registrant_id)
                : null;
              return (
                <div key={r.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-[var(--m-ink)]">{athlete}</div>
                      {schoolName && schoolName !== 'Mandiri' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-200">
                          {schoolName}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          Mandiri
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--m-muted)]">
                      {eventName} · {ceName}
                    </div>
                    <div className="mt-0.5 text-xs text-[var(--m-muted)]">
                      Pendaftar: {registrant?.full_name ?? registrant?.email ?? '-'}
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                      <span className="font-bold text-[var(--m-ink)] bg-slate-100 px-2 py-0.5 rounded">
                        Total: Rp {(r.amount_due ?? 0).toLocaleString('id-ID')}
                      </span>
                      {r.unique_code && r.unique_code > 0 ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300">
                          Kode Unik: +{r.unique_code}
                        </span>
                      ) : null}
                      {r.base_amount && r.base_amount > 0 ? (
                        <span className="text-[11px] text-muted-foreground">
                          (Pokok: Rp {r.base_amount.toLocaleString('id-ID')})
                        </span>
                      ) : null}
                      {r.proof_url && (
                        <a
                          href={r.proof_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 font-medium text-[var(--m-aqua-ink)] hover:underline ml-1"
                        >
                          <Eye className="h-3.5 w-3.5" /> Lihat bukti
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Link
                      href={`/invoice/${r.id}?scope=athlete`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[var(--m-aqua-ink)] bg-[var(--m-aqua-soft)] hover:bg-[var(--m-aqua)] hover:text-white px-2.5 py-1 rounded-lg transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5" /> Invoice
                    </Link>
                    <StatusBadge status={r.status} />
                    {r.status === 'pending' && <PaymentVerifyActions id={r.id} />}
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
          ? 'rounded-full bg-[var(--m-aqua)] px-4 py-1.5 text-sm font-semibold text-white'
          : 'rounded-full border border-[var(--m-border)] px-4 py-1.5 text-sm text-[var(--m-muted)] transition-colors hover:border-[var(--m-aqua)] hover:text-[var(--m-aqua-ink)]'
      }
    >
      {label}
    </a>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    pending: { cls: 'bg-amber-100 text-amber-700', icon: <CreditCard className="h-3.5 w-3.5" />, label: 'Menunggu' },
    verified: { cls: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="h-3.5 w-3.5" />, label: 'Disetujui' },
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
