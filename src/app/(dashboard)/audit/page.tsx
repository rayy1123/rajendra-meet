/* eslint-disable @typescript-eslint/no-explicit-any */
import { requireRole } from '@/lib/auth';
import { PageHeader } from '@/components/ui/page-header';
import { ShieldCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

const ACTION_STYLE: Record<string, string> = {
  time_override: 'bg-red-100 text-red-700',
  login: 'bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)]',
  seeding_edit: 'bg-amber-100 text-amber-700',
  scratch: 'bg-red-50 text-red-600',
};

export default async function AuditPage() {
  // Defense-in-depth: audit log hanya untuk event_admin / super_admin.
  // Selain layout guard, page ini sendiri menolak role lain.
  const { supabase } = await requireRole(['event_admin', 'super_admin']);

  const { data } = await supabase
    .from('audit_log')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);
  const rows = data ?? [];

  return (
    <>
      <PageHeader
        title="Log Audit Sistem"
        description="Catatan modifikasi sistem dan event keamanan (override waktu, login, perubahan seeding)."
      />
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        {rows.length === 0 ? (
          <div className="pub-card p-12 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-[var(--m-aqua)]" />
            <h3 className="mt-3 font-semibold text-[var(--m-ink)]">Belum ada log</h3>
            <p className="mt-1 text-sm text-[var(--m-muted)]">
              Event akan tercatat di sini saat ada modifikasi sistem.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--m-soft)] text-xs uppercase text-[var(--m-muted)]">
                <tr>
                  <th className="px-4 py-3">Waktu</th>
                  <th className="px-4 py-3">Aktor</th>
                  <th className="px-4 py-3">Aksi</th>
                  <th className="px-4 py-3">Entitas</th>
                  <th className="px-4 py-3">Detail</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((r: any) => (
                  <tr key={r.id} className="hover:bg-[var(--m-soft)]">
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-[var(--m-muted)]">
                      {new Date(r.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-[var(--m-ink)]">{r.actor_email ?? '—'}</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          'rounded px-2 py-0.5 text-xs font-semibold ' +
                          (ACTION_STYLE[r.action] ?? 'bg-[var(--m-soft)] text-[var(--m-muted)]')
                        }
                      >
                        {r.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--m-muted)]">{r.entity ?? '—'}</td>
                    <td className="px-4 py-3 text-[var(--m-muted)]">{r.detail ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
