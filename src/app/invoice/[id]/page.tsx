import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { InvoiceCard, type InvoiceData, type InvoiceAthleteGroup, type InvoicePaymentTransaction } from '@/components/modules/invoice-card';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export const dynamic = 'force-dynamic';

interface InvoicePageProps {
  params: Promise<{ id: string }>;
}

export default async function InvoicePage({ params }: InvoicePageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // 1. Cari pendaftaran berdasarkan id (bisa registration_id atau payment_verification_id)
  let regId = id;
  const { data: payCheck } = await supabase
    .from('payment_verifications')
    .select('registration_id')
    .eq('id', id)
    .maybeSingle();

  if (payCheck?.registration_id) {
    regId = payCheck.registration_id;
  }

  let mainReg: any = null;
  const { data: fullMainReg, error: mainError } = await supabase
    .from('registrations')
    .select(`
      id,
      event_id,
      athlete_id,
      registrant_id,
      created_at,
      events (
        id,
        name,
        start_date,
        end_date,
        bank_name,
        bank_account_no,
        bank_account_name,
        fee_per_event,
        use_unique_code
      ),
      athletes (
        id,
        full_name,
        gender,
        birth_date,
        school_id,
        schools ( name )
      )
    `)
    .eq('id', regId)
    .maybeSingle();

  if (mainError || !fullMainReg) {
    const { data: fallbackMainReg } = await supabase
      .from('registrations')
      .select(`
        id,
        event_id,
        athlete_id,
        registrant_id,
        created_at,
        events (
          id,
          name,
          start_date,
          end_date
        ),
        athletes (
          id,
          full_name,
          gender,
          birth_date,
          school_id,
          schools ( name )
        )
      `)
      .eq('id', regId)
      .maybeSingle();

    if (!fallbackMainReg || !fallbackMainReg.events || !fallbackMainReg.athletes) {
      notFound();
    }

    mainReg = {
      ...fallbackMainReg,
      events: {
        ...fallbackMainReg.events,
        bank_name: 'Bank Jago',
        bank_account_no: '107337200374',
        account_name: 'Nanda Aulia Salsabila',
        fee_per_event: 150000,
        use_unique_code: false,
      },
    };
  } else {
    mainReg = fullMainReg;
  }

  // 2. Ambil seluruh nomor pendaftaran terkait untuk pendaftar & event yang sama
  // (agar satu invoice memuat semua nomor lomba dan atlet dari pendaftar tersebut)
  let activeRegs: any[] = [];
  const { data: fullRelatedRegs, error: relError } = await supabase
    .from('registrations')
    .select(`
      id,
      athlete_id,
      created_at,
      athletes (
        id,
        full_name,
        gender,
        birth_date,
        schools ( name )
      ),
      competition_events (
        id,
        order_no,
        name,
        stroke,
        distance_meters,
        grade_level,
        class_name
      ),
      payment_verifications (
        id,
        status,
        amount_due,
        base_amount,
        unique_code,
        proof_url,
        created_at,
        reviewed_at
      )
    `)
    .eq('event_id', mainReg.event_id)
    .eq('registrant_id', mainReg.registrant_id)
    .order('created_at', { ascending: true });

  if (relError || !fullRelatedRegs) {
    const { data: fallbackRel } = await supabase
      .from('registrations')
      .select(`
        id,
        athlete_id,
        created_at,
        athletes (
          id,
          full_name,
          gender,
          birth_date,
          schools ( name )
        ),
        competition_events (
          id,
          order_no,
          name,
          stroke,
          distance_meters,
          grade_level,
          class_name
        ),
        payment_verifications (
          id,
          status,
          amount_due,
          proof_url,
          created_at,
          reviewed_at
        )
      `)
      .eq('event_id', mainReg.event_id)
      .eq('registrant_id', mainReg.registrant_id)
      .order('created_at', { ascending: true });

    activeRegs = (fallbackRel || []).map((r: any) => ({
      ...r,
      payment_verifications: r.payment_verifications
        ? {
            ...r.payment_verifications,
            base_amount: r.payment_verifications.amount_due,
            unique_code: 0,
          }
        : null,
    }));
  } else {
    activeRegs = fullRelatedRegs;
  }

  // Ambil data profil pendaftar
  let registrantName = 'Peserta';
  if (mainReg.registrant_id) {
    const { data: prof } = await supabase
      .from('profiles')
      .select('full_name, email, phone')
      .eq('id', mainReg.registrant_id)
      .maybeSingle();
    if (prof?.full_name) registrantName = prof.full_name;
    else if (prof?.email) registrantName = prof.email;
  }

  // Dapatkan nama klub atau sekolah
  const schoolName = (mainReg.athletes as any)?.schools?.name ?? null;

  // Format grup atlet & nomor lomba
  const athleteGroupsMap = new Map<string, InvoiceAthleteGroup>();
  let totalBaseAmount = 0;
  let uniqueCode = 0;
  let latestStatus: 'PAID' | 'UNPAID' | 'VERIFIED' | 'PENDING' | 'REJECTED' = 'UNPAID';
  const transactions: InvoicePaymentTransaction[] = [];

  const defaultFee = (mainReg.events as any).fee_per_event || 50000;

  for (const reg of activeRegs) {
    const a = reg.athletes as any;
    const ce = reg.competition_events as any;
    const pay = reg.payment_verifications as any;

    if (!athleteGroupsMap.has(a.id)) {
      const gLabel = a.gender === 'female' ? 'Perempuan' : 'Laki - Laki';
      let bDateStr = '';
      if (a.birth_date) {
        const d = new Date(a.birth_date);
        bDateStr = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      }

      athleteGroupsMap.set(a.id, {
        athleteName: a.full_name,
        gender: gLabel,
        birthDate: bDateStr,
        items: [],
        subtotal: 0,
      });
    }

    const group = athleteGroupsMap.get(a.id)!;
    const itemPrice = pay?.base_amount && pay.base_amount > 0 ? pay.base_amount : defaultFee;
    const code = ce?.order_no ? `E${ce.order_no}` : '';
    const eventName = ce ? `${ce.distance_meters}M ${ce.stroke?.toUpperCase() || ''} ${ce.grade_level || ''}`.trim() : 'Nomor Lomba';

    group.items.push({
      code,
      name: eventName,
      price: itemPrice,
    });
    group.subtotal += itemPrice;
    totalBaseAmount += itemPrice;

    if (pay?.unique_code && pay.unique_code > 0) {
      uniqueCode = pay.unique_code;
    }

    // Tentukan status
    if (pay?.status === 'verified' || pay?.status === 'approved') {
      latestStatus = 'PAID';
    } else if (pay?.status === 'rejected') {
      if (latestStatus !== 'PAID') latestStatus = 'REJECTED';
    } else {
      if (latestStatus !== 'PAID' && latestStatus !== 'REJECTED') latestStatus = 'UNPAID';
    }

    // Catat transaksi jika bukti bayar terupload
    if (pay?.proof_url) {
      const tDate = pay.created_at ? new Date(pay.created_at).toLocaleDateString('id-ID') : '-';
      transactions.push({
        date: tDate,
        member: a.full_name,
        method: `Transfer Bank (${(mainReg.events as any).bank_name || 'BCA'})`,
        amount: pay.amount_due || (itemPrice + (pay?.unique_code || 0)),
        status: pay.status,
      });
    }
  }

  const athletesList = Array.from(athleteGroupsMap.values());
  const grandTotal = totalBaseAmount + uniqueCode;

  // Tanggal & Jatuh Tempo
  const regDateObj = new Date(mainReg.created_at || Date.now());
  const dateFormatted = regDateObj.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const dueDateObj = new Date(regDateObj.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 hari jatuh tempo
  const dueDateFormatted = dueDateObj.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Invoice number (misal: INV/CLUB/26/1942)
  const shortId = regId.replace(/-/g, '').slice(-4).toUpperCase();
  const yearShort = String(regDateObj.getFullYear()).slice(-2);
  const invoiceNumber = `INV/CLUB/${yearShort}/${shortId}`;

  const invoiceData: InvoiceData = {
    invoiceNumber,
    subject: (mainReg.events as any).name || 'Kejuaraan Renang Rajendra',
    date: dateFormatted,
    dueDate: dueDateFormatted,
    status: latestStatus,
    recipientName: registrantName,
    recipientClubOrSchool: schoolName,
    athletes: athletesList,
    subtotal: totalBaseAmount,
    uniqueCode,
    grandTotal,
    transactions,
    bankInfo: {
      bankName: (mainReg.events as any).bank_name || 'Bank Jago',
      accountNo: (mainReg.events as any).bank_account_no || '107337200374',
      accountName: (mainReg.events as any).bank_account_name || 'Nanda Aulia Salsabila',
    },
  };

  return (
    <div className="min-h-screen bg-slate-100/70 py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-4xl mb-4 no-print">
        <Breadcrumb
          items={[
            { label: 'Beranda', href: '/' },
            { label: 'Pendaftaran Saya', href: '/pendaftaran-saya' },
            { label: invoiceNumber },
          ]}
        />
      </div>
      <InvoiceCard invoice={invoiceData} backUrl="/pendaftaran-saya" />
    </div>
  );
}
