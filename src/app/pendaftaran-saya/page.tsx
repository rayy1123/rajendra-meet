import { redirect } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import DashboardLayout from '@/components/layout/layout';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { EmptyState } from '@/components/ui/empty-state';
import { Waves, CheckCircle2, XCircle, Clock, FileText } from 'lucide-react';
import Link from 'next/link';
import { ViewerSubHeader } from '@/components/modules/viewer-subheader';

export const dynamic = 'force-dynamic';

const STATUS_STYLE: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  pending: { label: 'Menunggu Verifikasi', cls: 'bg-amber-100 text-amber-700', icon: Clock },
  verified: { label: 'Diverifikasi', cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Ditolak', cls: 'bg-red-100 text-red-700', icon: XCircle },
};

interface RegRow {
  id: string;
  events: { name: string; bank_name: string; bank_account_no: string; bank_account_name: string } | null;
  competition_events: { name: string; stroke: string; distance_meters: number; gender: string } | null;
  athletes: { full_name: string } | null;
  payment_verifications: { status: string; amount_due: number; base_amount?: number; unique_code?: number; created_at: string } | null;
}

export default async function PendaftaranSayaPage() {
  const { supabase, user } = await requireUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const userRole =
    (profile?.role as string) ||
    (user as any)?.user_metadata?.role ||
    (user as any)?.app_metadata?.role ||
    'viewer';
  const ADMIN_ROLES = [
    'super_admin',
    'event_admin',
    'operator',
    'admin',
    'admin_kejuaraan',
    'admin_keuangan',
  ];
  if (ADMIN_ROLES.includes(userRole)) {
    redirect('/verifikasi-pembayaran');
  }

  let regsData: any[] = [];
  const { data: fullRegs, error: fullRegsErr } = await supabase
    .from('registrations')
    .select(
      'id, events(name, bank_name, bank_account_no, bank_account_name), competition_events(name, stroke, distance_meters, gender), athletes(full_name), payment_verifications(status, amount_due, base_amount, unique_code, created_at)'
    )
    .eq('registrant_id', user.id)
    .order('created_at', { ascending: false });

  if (fullRegsErr || !fullRegs) {
    const { data: fallbackRegs } = await supabase
      .from('registrations')
      .select(
        'id, events(name), competition_events(name, stroke, distance_meters, gender), athletes(full_name), payment_verifications(status, amount_due, created_at)'
      )
      .eq('registrant_id', user.id)
      .order('created_at', { ascending: false });

    regsData = (fallbackRegs || []).map((r: any) => ({
      ...r,
      events: r.events
        ? {
            name: r.events.name,
            bank_name: 'Bank Central Asia (BCA)',
            bank_account_no: '',
            bank_account_name: 'Panitia Pelaksana Renang',
          }
        : null,
      payment_verifications: r.payment_verifications
        ? {
            ...r.payment_verifications,
            base_amount: r.payment_verifications.amount_due,
            unique_code: 0,
          }
        : null,
    }));
  } else {
    regsData = fullRegs;
  }

  const rows = regsData as unknown as RegRow[];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb
          items={[
            { label: 'Dasbor', href: '/dashboard-viewer' },
            { label: 'Pendaftaran Saya' },
          ]}
          className="mb-2"
        />
        <ViewerSubHeader
          title="Pendaftaran Saya"
          description="Pantau status pembayaran, rincian biaya, kode unik transfer, dan verifikasi pendaftaran lomba Anda."
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
              const evt = r.events;
              const ce = r.competition_events;
              const ath = r.athletes;
              const pay = r.payment_verifications;
              const st = STATUS_STYLE[pay?.status ?? 'pending'] ?? STATUS_STYLE.pending;
              const Icon = st.icon;
              const amountDue = pay?.amount_due ?? 0;
              const uniqueCode = pay?.unique_code ?? 0;
              const baseAmount = pay?.base_amount && pay.base_amount > 0 ? pay.base_amount : (amountDue - uniqueCode);

              return (
                <div
                  key={r.id}
                  className="pub-card flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 gap-3 transition-shadow duration-200 hover:shadow-md"
                >
                  <div className="space-y-1">
                    <span className="text-[11px] font-semibold text-primary block">{evt?.name ?? 'Kejuaraan Renang'}</span>
                    <div className="font-semibold text-sm text-[var(--m-ink)]">{ce?.name ?? 'Nomor lomba'}</div>
                    <div className="text-xs text-[var(--m-muted)]">Atlet: <b>{ath?.full_name ?? 'Atlet'}</b></div>
                    
                    {/* Rincian Pembayaran & Kode Unik */}
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                      <span className="font-bold text-foreground">
                        Total: Rp {amountDue.toLocaleString('id-ID')}
                      </span>
                      {uniqueCode > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-200">
                          Kode Unik: +{uniqueCode}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col sm:items-end gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}
                      >
                        <Icon className="h-3.5 w-3.5" /> {st.label}
                      </span>
                      <Link
                        href={`/invoice/${r.id}`}
                        target="_blank"
                        className="inline-flex items-center gap-1 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-2.5 py-1 rounded-full transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5" /> Invoice
                      </Link>
                    </div>

                    {pay?.status === 'pending' && evt?.bank_account_no && (
                      <p className="text-[11px] text-muted-foreground text-left sm:text-right">
                        Transfer ke: <b className="text-foreground">{evt.bank_name} {evt.bank_account_no}</b>
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
