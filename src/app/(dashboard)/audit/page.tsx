/* eslint-disable @typescript-eslint/no-explicit-any */
import { requireRole } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

const ACTION_STYLE: Record<string, string> = {
  time_override: 'bg-red-100 text-red-700',
  login: 'bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)]',
  seeding_edit: 'bg-amber-100 text-amber-700',
  scratch: 'bg-red-50 text-red-600',
};

export default async function AuditPage() {
  const { supabase } = await requireRole(['event_admin', 'super_admin']);

  const { data } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  const rows = data ?? [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumb items={[{ label: 'Dasbor', href: '/dashboard' }, { label: 'Log Audit' }]} className="mb-2" />
      <PageHeader
        title="Log Audit Sistem"
        description="Catatan modifikasi sistem dan event keamanan (override waktu, login, perubahan seeding)."
      />
      {rows.length === 0 ? (
        <EmptyState
          icon={<ShieldCheck className="h-6 w-6" />}
          title="Belum Ada Log Audit"
          description="Aktivitas dan modifikasi sistem akan tercatat di sini."
        />
      ) : (
        <div className="glass-panel overflow-hidden">
          <Table>
            <TableHeader className="bg-[var(--m-soft)]">
              <TableRow>
                <TableHead>Waktu</TableHead>
                <TableHead>Aktor</TableHead>
                <TableHead>Aksi</TableHead>
                <TableHead>Entitas</TableHead>
                <TableHead>Detail</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap font-mono text-xs text-[var(--m-muted)]">
                    {new Date(r.created_at).toLocaleString('id-ID')}
                  </TableCell>
                  <TableCell className="text-[var(--m-ink)]">{r.actor_email ?? '—'}</TableCell>
                  <TableCell>
                    <span
                      className={
                        'rounded px-2 py-0.5 text-xs font-semibold ' +
                        (ACTION_STYLE[r.action] ?? 'bg-[var(--m-soft)] text-[var(--m-muted)]')
                      }
                    >
                      {r.action}
                    </span>
                  </TableCell>
                  <TableCell className="text-[var(--m-muted)]">{r.entity ?? '—'}</TableCell>
                  <TableCell className="text-[var(--m-muted)]">{r.detail ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
