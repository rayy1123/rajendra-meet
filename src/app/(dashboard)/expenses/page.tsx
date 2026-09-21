import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { ExpensesManager } from '@/components/modules/expenses-manager';
import { getExpensesServer } from '@/lib/data/expenses-server';

export const dynamic = 'force-dynamic';

export default async function ExpensesPage() {
  const supabase = await createClient();

  // 1. Ambil daftar event untuk dropdown
  const { data: events } = await supabase
    .from('events')
    .select('id, name')
    .order('created_at', { ascending: false });

  // 2. Ambil data expenses
  const expenses = await getExpensesServer();

  return (
    <div className="space-y-6">
      <Breadcrumb
        items={[
          { label: 'Dasbor', href: '/dashboard' },
          { label: 'Pengeluaran (Expenses)', href: '/expenses' },
        ]}
      />

      <PageHeader
        title="Pengeluaran (Expenses)"
        description="Catat dan pantau seluruh pengeluaran operasional kejuaraan renang, logistik, honor tim, dan fasilitas."
      />

      <ExpensesManager
        initialExpenses={expenses}
        events={events || []}
      />
    </div>
  );
}
