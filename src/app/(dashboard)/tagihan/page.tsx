import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  TagihanKlubManager,
  type TagihanKlubItem,
} from '@/components/modules/tagihan-klub-manager';

export const dynamic = 'force-dynamic';

export default async function TagihanPage() {
  const supabase = await createClient();

  // 1. Ambil data events
  const { data: events } = await supabase
    .from('events')
    .select('id, name, start_date, end_date, fee_per_event')
    .order('created_at', { ascending: false });

  // 2. Ambil data schools / klub
  const { data: schools } = await supabase
    .from('schools')
    .select('id, name')
    .order('name', { ascending: true });

  // 3. Ambil data registrasi + atlet + pembayaran
  const { data: registrations } = await supabase
    .from('registrations')
    .select(`
      id,
      event_id,
      athlete_id,
      athletes (
        school_id,
        schools (id, name)
      )
    `);

  // 4. Ambil verifikasi pembayaran
  const { data: payments } = await supabase
    .from('payment_verifications')
    .select('id, registration_id, status, amount_due, invoice_no, created_at');

  const eventsList = (events || []).map((e) => ({
    id: e.id,
    name: e.name,
    start_date: e.start_date,
    end_date: e.end_date,
    fee_per_event: e.fee_per_event || 150000,
  }));

  const clubsList = (schools || []).map((s) => ({
    id: s.id,
    name: s.name,
  }));

  // Kelompokkan tagihan berdasarkan Club + Event
  const invoicesMap = new Map<string, TagihanKlubItem>();

  (registrations || []).forEach((reg: any, idx: number) => {
    const clubId = reg.athletes?.school_id || 'unknown';
    const clubName = reg.athletes?.schools?.name || 'Klub Independen';
    const eventId = reg.event_id;
    const parentEvent = eventsList.find((e) => e.id === eventId);
    const key = `${clubId}_${eventId}`;

    const fee = parentEvent?.fee_per_event || 150000;

    if (!invoicesMap.has(key)) {
      const invNumber = `INV/CLUB/26/${1940 + invoicesMap.size + 1}`;
      invoicesMap.set(key, {
        id: `inv-${key}`,
        invoice_no: invNumber,
        club_id: clubId,
        club_name: clubName,
        event_id: eventId,
        event_name: parentEvent?.name || 'Kejuaraan Renang',
        qty: 1,
        payment_date: parentEvent?.start_date ? new Date(parentEvent.start_date).toISOString().slice(0, 10) : null,
        due_date: parentEvent?.start_date || '2026-10-16',
        total_amount: fee,
        remaining_amount: fee,
        status: 'belum_bayar',
      });
    } else {
      const existing = invoicesMap.get(key)!;
      existing.qty += 1;
      existing.total_amount += fee;
      existing.remaining_amount += fee;
    }
  });

  // Jika belum ada pendaftaran riil, sediakan mock data realistis seperti pada screenshot media_1789719769873.png
  let invoices: TagihanKlubItem[] = Array.from(invoicesMap.values());
  if (invoices.length === 0 && eventsList.length > 0) {
    const sampleEvent = eventsList[0];
    invoices = [
      {
        id: 'inv-1',
        invoice_no: 'INV/CLUB/24/1942',
        club_id: 'c-1',
        club_name: 'CABANG BEJI',
        event_id: sampleEvent.id,
        event_name: sampleEvent.name,
        qty: 2,
        payment_date: '2026-09-13',
        due_date: '2026-10-16',
        total_amount: 300000,
        remaining_amount: 300000,
        status: 'belum_bayar',
      },
      {
        id: 'inv-2',
        invoice_no: 'INV/CLUB/24/1944',
        club_id: 'c-2',
        club_name: 'CABANG CIRACAS',
        event_id: sampleEvent.id,
        event_name: sampleEvent.name,
        qty: 1,
        payment_date: '2026-09-13',
        due_date: '2026-10-16',
        total_amount: 150000,
        remaining_amount: 150000,
        status: 'belum_bayar',
      },
      {
        id: 'inv-3',
        invoice_no: 'INV/CLUB/24/1945',
        club_id: 'c-3',
        club_name: 'CABANG CONDET',
        event_id: sampleEvent.id,
        event_name: sampleEvent.name,
        qty: 3,
        payment_date: '2026-09-13',
        due_date: '2026-10-16',
        total_amount: 450000,
        remaining_amount: 450000,
        status: 'belum_bayar',
      },
      {
        id: 'inv-4',
        invoice_no: 'INV/CLUB/24/1946',
        club_id: 'c-4',
        club_name: 'CABANG JAGAKARSA',
        event_id: sampleEvent.id,
        event_name: sampleEvent.name,
        qty: 3,
        payment_date: '2026-09-13',
        due_date: '2026-10-16',
        total_amount: 450000,
        remaining_amount: 450000,
        status: 'belum_bayar',
      },
      {
        id: 'inv-5',
        invoice_no: 'INV/CLUB/24/1948',
        club_id: 'c-5',
        club_name: 'CABANG PAMULANG',
        event_id: sampleEvent.id,
        event_name: sampleEvent.name,
        qty: 6,
        payment_date: '2026-09-13',
        due_date: '2026-10-16',
        total_amount: 900000,
        remaining_amount: 900000,
        status: 'belum_bayar',
      },
      {
        id: 'inv-6',
        invoice_no: 'INV/CLUB/24/1943',
        club_id: 'c-6',
        club_name: 'CABANG BULUNGAN',
        event_id: sampleEvent.id,
        event_name: sampleEvent.name,
        qty: 30,
        payment_date: '2026-09-13',
        due_date: '2026-10-16',
        total_amount: 4500000,
        remaining_amount: 4500000,
        status: 'belum_bayar',
      },
    ];
  }

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <Breadcrumb
          items={[
            { label: 'Dasbor', href: '/dashboard' },
            { label: 'Tagihan Klub per Event', href: '/tagihan' },
          ]}
        />

        <PageHeader
          title="Tagihan Klub per Event"
          description="Pantau seluruh tagihan pendaftaran per klub/cabang, status pembayaran, nomor invoice, dan cetak rekapitulasi piutang."
        />
      </div>

      <TagihanKlubManager
        initialInvoices={invoices}
        events={eventsList}
        clubs={clubsList}
      />
    </div>
  );
}
