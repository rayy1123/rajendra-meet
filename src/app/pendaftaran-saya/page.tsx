import { requireUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/layout';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { EmptyState } from '@/components/ui/empty-state';
import { Waves, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const STATUS_STYLE: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  pending: { label: 'Menunggu Verifikasi', cls: 'bg-amber-100 text-amber-700', icon: Clock },
  verified: { label: 'Diverifikasi', cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Ditolak', cls: 'bg-red-100 text-red-700', icon: XCircle },
};

interface RegRow {
  id: string;
  competition_events: { name: string; stroke: string; distance_meters: number; gender: string } | null;
  athletes: { full_name: string } | null;
  payment_verifications: { status: string; amount_due: number; created_at: string } | null;
}

export default async function PendaftaranSayaPage() {
  const { supabase, user } = await requireUser();

  const { data: regs } = await supabase
    .from('registrations')
    .select(
      'id, competition_events(name, stroke, distance_meters, gender), athletes(full_name), payment_verifications(status, amount_due, created_at)'
    )
    .eq('registrant_id', user.id)
    .order('created_at', { ascending: false });

  const rows = (regs ?? []) as unknown as RegRow[];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/dashboard-viewer' },
            { label: 'Pendaftaran Saya' },
          ]}
          className="mb-2"
        />
        <PageHeader
          title="Pendaftaran Saya"
          description="Pantau status pembayaran dan verifikasi pendaftaran lomba Anda."
        />

        {rows.length === 0 ? (
          <EmptyState
            icon={<Waves className="h-6 w-6" />}
            title="Belum ada pendaftaran"
            description="Daftarkan atlet Anda ke kejuaraan yang tersedia."
            action={
              <Link href="/daftar-lomba" className="pub-btn-primary mt-4 inline-flex">
                Daftar Lomba
              </Link>
            }
          />
        ) : (
          <div className="space-y-3">
            {rows.map((r) => {
              const ce = r.competition_events;
              const ath = r.athletes;
              const pay = r.payment_verifications;
              const st = STATUS_STYLE[pay?.status ?? 'pending'] ?? STATUS_STYLE.pending;
              const Icon = st.icon;
              return (
                <div
                  key={r.id}
                  className="pub-card flex items-center justify-between p-4 transition-shadow duration-200 hover:shadow-md"
                >
                  <div>
                    <div className="font-semibold text-[var(--m-ink)]">{ce?.name ?? 'Nomor lomba'}</div>
                    <div className="text-xs text-[var(--m-muted)]">{ath?.full_name ?? 'Atlet'}</div>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}
                  >
                    <Icon className="h-3.5 w-3.5" /> {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
