import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { UserPaymentManager, type UserRegistrationItem } from '@/components/modules/user-payment-manager';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { PageHeader } from '@/components/ui/page-header';
import { CreditCard } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function PendaftaranSayaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login?for=daftar&redirect=/pendaftaran-saya');
  }

  // 1. Ambil pendaftaran milik user yang sedang login (registrant_id = user.id)
  const { data: registrations } = await supabase
    .from('registrations')
    .select(`
      id,
      seed_time_ms,
      payment_status,
      created_at,
      athletes (
        id,
        full_name,
        athlete_number,
        gender,
        age_group,
        schools ( name )
      ),
      competition_events (
        id,
        order_no,
        name,
        stroke,
        distance_meters,
        events ( id, name )
      ),
      payment_verifications (
        id,
        status,
        amount_due,
        proof_url,
        notes
      )
    `)
    .eq('registrant_id', user.id)
    .order('created_at', { ascending: false });

  // Normalisasi jika payment_verifications bertipe array
  const formattedRegs: UserRegistrationItem[] = (registrations || []).map((r) => {
    const rawPay = r.payment_verifications as
      | UserRegistrationItem['payment_verifications']
      | Array<UserRegistrationItem['payment_verifications']>
      | null;

    const pay = Array.isArray(rawPay) ? rawPay[0] : rawPay;

    const rawAthlete = Array.isArray(r.athletes) ? r.athletes[0] : r.athletes;
    const rawComp = Array.isArray(r.competition_events) ? r.competition_events[0] : r.competition_events;

    return {
      id: r.id,
      seed_time_ms: r.seed_time_ms,
      payment_status: r.payment_status,
      created_at: r.created_at,
      athletes: rawAthlete as unknown as UserRegistrationItem['athletes'],
      competition_events: rawComp as unknown as UserRegistrationItem['competition_events'],
      payment_verifications: pay || null,
    };
  });

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumb
        items={[
          { label: 'Pendaftaran', href: '/daftar-lomba' },
          { label: 'Verifikasi Pembayaran & Riwayat' },
        ]}
        className="mb-2"
      />
      <PageHeader
        title="Verifikasi Pembayaran & Riwayat Pendaftaran"
        description="Pantau status pendaftaran nomor lomba, total biaya, dan unggah bukti transfer pembayaran Anda."
        icon={<CreditCard className="h-6 w-6" />}
      />

      <UserPaymentManager registrations={formattedRegs} />
    </div>
  );
}
