import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  TagihanKlubManager,
  type TagihanKlubItem,
} from '@/components/modules/tagihan-klub-manager';
import { getEventSettings } from '@/lib/data/event-settings-server';
import type { InvoiceAthleteGroup } from '@/components/modules/invoice-card';

export const dynamic = 'force-dynamic';

export default async function TagihanPage() {
  const supabase = await createClient();

  // 1. Ambil data events dari database (hindari error kolom fee_per_event yang tidak ada di schema)
  const { data: eventsData } = await supabase
    .from('events')
    .select('id, name, start_date, end_date, description')
    .order('start_date', { ascending: false });

  // 2. Ambil data schools / klub
  const { data: schools } = await supabase
    .from('schools')
    .select('id, name')
    .order('name', { ascending: true });

  // 3. Ambil data registrasi + atlet riil + nomor lomba + pembayaran
  const { data: registrations } = await supabase
    .from('registrations')
    .select(`
      id,
      event_id,
      athlete_id,
      athletes (
        id,
        full_name,
        gender,
        birth_date,
        school_id,
        schools (id, name)
      ),
      competition_events (
        id,
        order_no,
        name,
        stroke,
        distance_meters
      ),
      payment_verifications (
        id,
        status,
        amount_due
      )
    `);

  const eventsList = (eventsData || []).map((e) => {
    let fee = 100000;
    try {
      if (e.description) {
        const parsed = JSON.parse(e.description);
        if (parsed?.fee_per_event) fee = Number(parsed.fee_per_event);
      }
    } catch {}
    if (!fee || fee === 100000) {
      const storeSettings = getEventSettings(e.id);
      if (storeSettings?.fee_per_event) fee = Number(storeSettings.fee_per_event);
    }
    return {
      id: e.id,
      name: e.name,
      start_date: e.start_date,
      end_date: e.end_date,
      fee_per_event: fee,
    };
  });

  const clubsList = (schools || []).map((s) => ({
    id: s.id,
    name: s.name,
  }));

  // Kelompokkan tagihan dan atlet riil per Club + Event
  const invoicesMap = new Map<string, TagihanKlubItem>();
  const clubAthletesMap = new Map<string, Map<string, InvoiceAthleteGroup>>();

  (registrations || []).forEach((reg: any) => {
    const rawAth = Array.isArray(reg.athletes) ? reg.athletes[0] : reg.athletes;
    const rawSchool = Array.isArray(rawAth?.schools) ? rawAth?.schools[0] : rawAth?.schools;
    const rawCe = Array.isArray(reg.competition_events) ? reg.competition_events[0] : reg.competition_events;
    const rawPay = Array.isArray(reg.payment_verifications) ? reg.payment_verifications[0] : reg.payment_verifications;

    const clubId = rawSchool?.id || rawAth?.school_id || 'unknown';
    const clubName = rawSchool?.name || 'Klub Independen';
    const eventId = reg.event_id;
    const parentEvent = eventsList.find((e) => e.id === eventId);
    const key = `${clubId}_${eventId}`;

    const fee = parentEvent?.fee_per_event || 100000;
    const payStatus = rawPay?.status;

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
        remaining_amount: payStatus === 'verified' || payStatus === 'approved' ? 0 : fee,
        status: payStatus === 'verified' || payStatus === 'approved' ? 'lunas' : 'belum_bayar',
        athletes: [],
      });
    } else {
      const existing = invoicesMap.get(key)!;
      existing.qty += 1;
      existing.total_amount += fee;
      if (payStatus !== 'verified' && payStatus !== 'approved') {
        existing.remaining_amount += fee;
      }
    }

    // Susun atlet riil tanpa format template "ATLET [KLUB] 1"
    if (rawAth?.id) {
      if (!clubAthletesMap.has(key)) {
        clubAthletesMap.set(key, new Map());
      }
      const athMap = clubAthletesMap.get(key)!;
      const athId = rawAth.id;

      if (!athMap.has(athId)) {
        athMap.set(athId, {
          athleteName: rawAth.full_name || 'Atlet',
          gender: rawAth.gender === 'female' || rawAth.gender === 'Perempuan' || rawAth.gender === 'Putri' ? 'Putri' : 'Putra',
          items: [],
          subtotal: 0,
        });
      }

      const athGroup = athMap.get(athId)!;
      const itemPrice = Number(rawPay?.amount_due) || fee;
      const ceName = rawCe ? `${rawCe.distance_meters || ''}M ${rawCe.stroke || ''} ${rawCe.name || ''}`.trim() : 'Nomor Lomba';
      const ceCode = rawCe?.order_no ? `E${rawCe.order_no}` : '';

      athGroup.items.push({
        code: ceCode,
        name: ceName,
        price: itemPrice,
      });
      athGroup.subtotal += itemPrice;
    }
  });

  // Sambungkan list atlet riil ke tiap tagihan
  invoicesMap.forEach((inv, key) => {
    const athMap = clubAthletesMap.get(key);
    if (athMap) {
      inv.athletes = Array.from(athMap.values());
    }
  });

  // Jika belum ada pendaftaran riil, sediakan tagihan contoh dengan nama-nama atlet Indonesia asli yang realistis
  let invoices: TagihanKlubItem[] = Array.from(invoicesMap.values());
  if (invoices.length === 0 && eventsList.length > 0) {
    const sampleEvent = eventsList[0];
    invoices = [
      {
        id: 'inv-1',
        invoice_no: 'INV/CLUB/26/1941',
        club_id: 'c-1',
        club_name: 'Hiu Akuatik',
        event_id: sampleEvent.id,
        event_name: sampleEvent.name,
        qty: 29,
        payment_date: '2026-09-13',
        due_date: '2026-10-16',
        total_amount: 4350000,
        remaining_amount: 4350000,
        status: 'belum_bayar',
        athletes: [
          {
            athleteName: 'Aditya Sihombing',
            gender: 'Putra',
            items: [
              { code: 'E151', name: '25M GAYA DADA SD KELAS 4 PUTRA', price: 150000 },
              { code: 'E152', name: '25M GAYA BEBAS SD KELAS 4 PUTRA', price: 150000 },
            ],
            subtotal: 300000,
          },
          {
            athleteName: 'Syifa Choiriyah',
            gender: 'Putri',
            items: [
              { code: 'E156', name: '25M GAYA DADA SD KELAS 4 PUTRI', price: 150000 },
              { code: 'E157', name: '25M GAYA BEBAS SD KELAS 4 PUTRI', price: 150000 },
            ],
            subtotal: 300000,
          },
          {
            athleteName: 'Alif Daulay',
            gender: 'Putra',
            items: [
              { code: 'E161', name: '25M GAYA DADA SD KELAS 4 PUTRA', price: 150000 },
              { code: 'E162', name: '25M GAYA BEBAS SD KELAS 4 PUTRA', price: 150000 },
            ],
            subtotal: 300000,
          },
        ],
      },
      {
        id: 'inv-2',
        invoice_no: 'INV/CLUB/26/1942',
        club_id: 'c-2',
        club_name: 'Elang Biru Akuatik',
        event_id: sampleEvent.id,
        event_name: sampleEvent.name,
        qty: 17,
        payment_date: '2026-09-13',
        due_date: '2026-10-16',
        total_amount: 2550000,
        remaining_amount: 2550000,
        status: 'belum_bayar',
        athletes: [
          {
            athleteName: 'Ray Pratama',
            gender: 'Putra',
            items: [
              { code: 'E151', name: '25M GAYA DADA SD KELAS 4 PUTRA', price: 150000 },
              { code: 'E152', name: '25M GAYA BEBAS SD KELAS 4 PUTRA', price: 150000 },
            ],
            subtotal: 300000,
          },
          {
            athleteName: 'Ginanjar Daulay',
            gender: 'Putra',
            items: [
              { code: 'E156', name: '25M GAYA DADA SD KELAS 4 PUTRA', price: 150000 },
              { code: 'E157', name: '25M GAYA BEBAS SD KELAS 4 PUTRA', price: 150000 },
            ],
            subtotal: 300000,
          },
          {
            athleteName: 'Bintang Ginting',
            gender: 'Putri',
            items: [
              { code: 'E161', name: '25M GAYA DADA SD KELAS 4 PUTRI', price: 150000 },
              { code: 'E162', name: '25M GAYA BEBAS SD KELAS 4 PUTRI', price: 150000 },
            ],
            subtotal: 300000,
          },
        ],
      },
      {
        id: 'inv-3',
        invoice_no: 'INV/CLUB/26/1943',
        club_id: 'c-3',
        club_name: 'Bina Taruna Aquatic',
        event_id: sampleEvent.id,
        event_name: sampleEvent.name,
        qty: 39,
        payment_date: '2026-09-13',
        due_date: '2026-10-16',
        total_amount: 5850000,
        remaining_amount: 5850000,
        status: 'belum_bayar',
        athletes: [
          {
            athleteName: 'Bima Paralayang',
            gender: 'Putra',
            items: [
              { code: 'E151', name: '25M GAYA DADA SD KELAS 4 PUTRA', price: 150000 },
              { code: 'E152', name: '25M GAYA BEBAS SD KELAS 4 PUTRA', price: 150000 },
            ],
            subtotal: 300000,
          },
          {
            athleteName: 'Dewi Lestari',
            gender: 'Putri',
            items: [
              { code: 'E156', name: '25M GAYA DADA SD KELAS 4 PUTRI', price: 150000 },
            ],
            subtotal: 150000,
          },
        ],
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
