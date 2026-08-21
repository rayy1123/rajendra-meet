/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Wrench, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

const STATUS_STYLE: Record<string, string> = {
  scheduled: 'bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)]',
  in_progress: 'bg-amber-100 text-amber-700',
  done: 'bg-emerald-100 text-emerald-700',
  overdue: 'bg-red-100 text-red-700',
};

export default async function EquipmentPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from('equipment_maintenance')
    .select('*')
    .order('due_date', { ascending: true });
  const items = data ?? [];

  return (
    <>
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Peralatan' }]} className="mb-4" />
      <PageHeader
        title="Pemeliharaan Peralatan"
        description="Lacak kesiapan teknis peralatan: touchpad, starting block, konsol waktu, dan kalibrasinya."
      />
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        {items.length === 0 ? (
          <div className="pub-card p-12 text-center">
            <Wrench className="mx-auto h-10 w-10 text-[var(--m-aqua)]" />
            <h3 className="mt-3 font-semibold text-[var(--m-ink)]">Belum ada catatan peralatan</h3>
            <p className="mt-1 text-sm text-[var(--m-muted)]">
              Tambahkan item peralatan lewat SQL/seed agar muncul di sini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it: any) => (
              <div key={it.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[var(--m-ink)]">{it.name}</span>
                  <span
                    className={
                      'rounded-full px-2 py-0.5 text-xs font-semibold ' +
                      (STATUS_STYLE[it.status] ?? 'bg-[var(--m-soft)] text-[var(--m-muted)]')
                    }
                  >
                    {it.status}
                  </span>
                </div>
                <p className="mt-1 text-sm text-[var(--m-muted)]">{it.location}</p>
                <div className="mt-3 flex items-center gap-2 text-xs text-[var(--m-muted)]">
                  {it.status === 'overdue' ? (
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 text-[var(--m-aqua)]" />
                  )}
                  Jatuh tempo: {it.due_date ?? '—'}
                </div>
                {it.technician && (
                  <p className="mt-1 text-xs text-[var(--m-muted)]">Teknisi: {it.technician}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
