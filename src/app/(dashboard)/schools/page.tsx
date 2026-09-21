import { createClient } from '@/lib/supabase/server';
import { School, Search, Printer, FileText } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SchoolPrintDialog } from '@/components/modules/school-print-dialog';

export interface SchoolWithCount {
  id: string;
  name: string;
  city: string | null;
  created_at: string;
  athletes_count: number;
}

interface SchoolRow {
  id: string;
  name: string;
  city: string | null;
  created_at: string;
  athletes: { count?: number }[] | null;
}

export default async function SchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const searchQuery = params.query || '';

  const [{ data: schoolsData, error }, { data: eventsData }] = await Promise.all([
    supabase
      .from('schools')
      .select('id, name, city, created_at, athletes (count)')
      .order('name', { ascending: true }),
    supabase
      .from('events')
      .select('id, name')
      .order('start_date', { ascending: false }),
  ]);

  const events = (eventsData || []).map((e) => ({ id: e.id, name: e.name }));

  const rawSchools = schoolsData || [];
  const filteredSchools = searchQuery
    ? rawSchools.filter((s: SchoolRow) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : rawSchools;

  const schools: SchoolWithCount[] =
    filteredSchools.map((school: SchoolRow) => ({
      id: school.id,
      name: school.name,
      city: school.city,
      created_at: school.created_at,
      athletes_count: school.athletes?.[0]?.count || 0,
    }));

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Sekolah / Klub' }]} className="mb-2" />
      <PageHeader
        title="Master Sekolah / Klub"
        description="Kelola daftar kontingen sekolah dan klub renang yang terdaftar dalam kejuaraan."
        icon={<School className="h-6 w-6" />}
        actions={
          events.length > 0 && (
            <SchoolPrintDialog
              events={events}
              schools={schools.map((s) => ({ id: s.id, name: s.name }))}
            />
          )
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-panel p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--m-muted)]">Total Kontingen</div>
          <div className="mt-1 font-heading text-3xl font-black text-[var(--m-ink)]">{schools.length}</div>
          <p className="mt-1 text-xs text-[var(--m-muted)]">Sekolah & Klub Terdaftar</p>
        </div>
        <div className="glass-panel p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--m-muted)]">Total Atlet Terikat</div>
          <div className="mt-1 font-heading text-3xl font-black text-[var(--m-ink)]">
            {schools.reduce((acc, curr) => acc + curr.athletes_count, 0)}
          </div>
          <p className="mt-1 text-xs text-[var(--m-muted)]">Atlet Dari Seluruh Kontingen</p>
        </div>
        <div className="glass-panel p-5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-[var(--m-muted)]">Cetak Rekap per Klub</div>
            <p className="mt-1 text-xs text-[var(--m-muted)]">Cetak PDF daftar atlet & status pembayaran per kejuaraan.</p>
          </div>
          <div className="mt-2">
            {events.length > 0 ? (
              <SchoolPrintDialog
                events={events}
                schools={schools.map((s) => ({ id: s.id, name: s.name }))}
                trigger={
                  <Button variant="outline" size="sm" className="w-full gap-1.5 text-xs font-bold border-blue-200 text-blue-700 hover:bg-blue-50">
                    <Printer className="h-3.5 w-3.5" /> Buka Cetak Rekap (PDF)
                  </Button>
                }
              />
            ) : (
              <span className="text-xs text-muted-foreground italic">Belum ada kejuaraan aktif</span>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--m-border)] bg-white p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
          <form method="GET" className="relative w-full sm:max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--m-muted)]" />
            <Input
              type="search"
              name="query"
              placeholder="Cari nama sekolah atau klub..."
              defaultValue={searchQuery}
              className="pl-8 text-xs h-9"
            />
          </form>

          {events.length > 0 && (
            <span className="text-xs text-muted-foreground font-medium">
              Tersedia {events.length} kejuaraan untuk rekap kontingen
            </span>
          )}
        </div>

        {error ? (
          <div className="text-center py-6 text-red-500 text-sm">
            Gagal memuat data sekolah: {error.message}
          </div>
        ) : schools.length === 0 ? (
          <EmptyState
            icon={<School className="h-6 w-6" />}
            title="Belum ada sekolah / klub"
            description={
              searchQuery
                ? `Tidak ada sekolah atau klub dengan kata kunci "${searchQuery}".`
                : 'Belum ada data sekolah/klub terdaftar.'
            }
          />
        ) : (
          <div className="rounded-xl border border-[var(--m-border)] overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/80">
                <TableRow>
                  <TableHead className="w-16 text-center font-bold">No</TableHead>
                  <TableHead className="font-bold">Nama Sekolah / Klub</TableHead>
                  <TableHead className="font-bold">Kota / Asal</TableHead>
                  <TableHead className="text-center font-bold">Jumlah Atlet</TableHead>
                  <TableHead className="text-right font-bold w-44">Rekap Kejuaraan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.map((school, index) => (
                  <TableRow key={school.id} className="hover:bg-slate-50/70 transition-colors">
                    <TableCell className="font-bold text-center text-xs font-mono">{index + 1}</TableCell>
                    <TableCell className="font-bold text-xs text-slate-900">{school.name}</TableCell>
                    <TableCell className="text-xs text-slate-600">{school.city || '-'}</TableCell>
                    <TableCell className="text-center font-mono text-xs font-semibold">
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-900 border border-blue-200">
                        {school.athletes_count} Atlet
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {events.length > 0 && (
                        <SchoolPrintDialog
                          events={events}
                          schools={schools.map((s) => ({ id: s.id, name: s.name }))}
                          initialSchoolId={school.id}
                          trigger={
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2"
                              title="Cetak Rekap Peserta & Status Pembayaran Klub Ini"
                            >
                              <Printer className="h-3 w-3" /> Cetak Rekap (PDF)
                            </Button>
                          }
                        />
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}
