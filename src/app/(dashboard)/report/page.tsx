import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import {
  FinancialReportManager,
  type FinancialTransaction,
} from '@/components/modules/financial-report-manager';
import { getExpensesServer } from '@/lib/data/expenses-server';

export const dynamic = 'force-dynamic';

export default async function ReportPage() {
  const supabase = await createClient();

  // 1. Ambil data event
  const { data: events } = await supabase
    .from('events')
    .select('id, name')
    .order('created_at', { ascending: false });

  // 2. Ambil data verifikasi pembayaran (Pemasukan)
  const { data: payments } = await supabase
    .from('payment_verifications')
    .select(`
      id,
      amount_due,
      status,
      created_at,
      invoice_no,
      registrations (
        event_id,
        athletes (full_name)
      )
    `)
    .order('created_at', { ascending: false });

  // 3. Ambil data expenses (Pengeluaran)
  const expenses = await getExpensesServer();

  // Format pemasukan
  const incomeTransactions: FinancialTransaction[] = (payments || []).map((p: any) => {
    const ev = (events || []).find((e) => e.id === p.registrations?.event_id);
    return {
      id: p.id,
      date: p.created_at ? p.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
      type: 'income',
      category: 'Pendaftaran Lomba',
      description: `Pembayaran ${p.invoice_no || 'Pendaftaran'} - ${p.registrations?.athletes?.full_name || 'Atlet'}`,
      amount: Number(p.amount_due) || 150000,
      eventName: ev?.name,
    };
  });

  return (
    <div className="space-y-6">
      <div className="print:hidden">
        <Breadcrumb
          items={[
            { label: 'Dasbor', href: '/dashboard' },
            { label: 'Laporan Keuangan & Report', href: '/report' },
          ]}
        />

        <PageHeader
          title="Laporan Keuangan & Report"
          description="Ringkasan mutasi arus kas, perbandingan total pemasukan dan pengeluaran kejuaraan, serta ekspor laporan resmi."
        />
      </div>

      <FinancialReportManager
        initialIncomeTransactions={incomeTransactions}
        initialExpenses={expenses}
        events={events || []}
      />
    </div>
  );
}
