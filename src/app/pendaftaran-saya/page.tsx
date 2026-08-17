import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PublicShell } from '@/components/layout/public-shell';
import { Waves, CheckCircle2, XCircle, Clock } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

const STATUS_STYLE: Record<string, { label: string; cls: string; icon: typeof Clock }> = {
  pending: { label: 'Menunggu Verifikasi', cls: 'bg-amber-100 text-amber-700', icon: Clock },
  verified: { label: 'Diverifikasi', cls: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  rejected: { label: 'Ditolak', cls: 'bg-red-100 text-red-700', icon: XCircle },
};

export default async function PendaftaranSayaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login?redirect=/pendaftaran-saya');

  const { data: regs } = await supabase
    .from('registrations')
    .select(
      'id, competition_events(name, stroke, distance_meters, gender), athletes(full_name), payment_verifications(status, amount_due, created_at)'
    )
    .eq('registrant_id', user.id)
    .order('created_at', { ascending: false });

  return (
    <PublicShell title="Pendaftaran Saya" subtitle="Pantau status pembayaran dan verifikasi pendaftaran lomba Anda.">
      <div className="pub-container pb-16">
        {!regs || regs.length === 0 ? (
          <div className="pub-card p-12 text-center">
            <Waves className="mx-auto h-10 w-10 text-[var(--m-aqua)]" />
            <h3 className="mt-3 font-semibold text-[var(--m-ink)]">Belum ada pendaftaran</h3>
            <p className="mt-1 text-sm text-[var(--m-muted)]">Daftarkan atlet Anda ke kejuaraan yang tersedia.</p>
            <Link href="/daftar-lomba" className="pub-btn-primary mt-4 inline-flex">Daftar Lomba</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {regs.map((r) => {
              const ce = (r as unknown as { competition_events: { name: string; stroke: string; distance_meters: number; gender: string } | null }).competition_events;
              const ath = (r as unknown as { athletes: { full_name: string } | null }).athletes;
              const pay = (r as unknown as { payment_verifications: { status: string; amount_due: number; created_at: string } | null }).payment_verifications;
              const st = STATUS_STYLE[pay?.status ?? 'pending'] ?? STATUS_STYLE.pending;
              const Icon = st.icon;
              return (
                <div key={r.id} className="pub-card flex items-center justify-between p-4">
                  <div>
                    <div className="font-semibold text-[var(--m-ink)]">{ce?.name ?? 'Nomor lomba'}</div>
                    <div className="text-xs text-[var(--m-muted)]">{ath?.full_name ?? 'Atlet'}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${st.cls}`}>
                    <Icon className="h-3.5 w-3.5" /> {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </PublicShell>
  );
}
