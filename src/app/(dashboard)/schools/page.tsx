import { createClient } from '@/lib/supabase/server';
import { School, Search } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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

  let query = supabase
    .from('schools')
    .select('id, name, city, created_at, athletes (count)')
    .order('name', { ascending: true });

  if (searchQuery) {
    query = query.ilike('name', `%${searchQuery}%`);
  }

  const { data: schoolsData, error } = await query;

  const schools: SchoolWithCount[] =
    schoolsData?.map((school: SchoolRow) => ({
      id: school.id,
      name: school.name,
      city: school.city,
      created_at: school.created_at,
      athletes_count: school.athletes?.[0]?.count || 0,
    })) || [];

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Sekolah / Klub' }]} className="mb-2" />
      <PageHeader
        title="Master Sekolah / Klub"
        description="Kelola daftar kontingen sekolah dan klub renang yang terdaftar dalam kejuaraan."
        icon={<School className="h-6 w-6" />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="glass-panel p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--m-muted)]">Total Kontingen</div>
          <div className="mt-1 text-2xl font-bold text-[var(--m-ink)]">{schools.length}</div>
          <p className="mt-1 text-xs text-[var(--m-muted)]">Sekolah & Klub Terdaftar</p>
        </div>
        <div className="glass-panel p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-[var(--m-muted)]">Total Atlet Terikat</div>
          <div className="mt-1 text-2xl font-bold text-[var(--m-ink)]">
            {schools.reduce((acc, curr) => acc + curr.athletes_count, 0)}
          </div>
          <p className="mt-1 text-xs text-[var(--m-muted)]">Atlet Dari Seluruh Kontingen</p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--m-border)] bg-white p-5 shadow-sm">
        <div className="pb-3">
          <form method="GET" className="relative max-w-md">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--m-muted)]" />
            <Input
              type="search"
              name="query"
              placeholder="Cari nama sekolah atau klub..."
              defaultValue={searchQuery}
              className="pl-8"
            />
          </form>
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
                : 'Belum ada data sekolah/klub terdaftar. Klik "Tambah Sekolah / Klub" di atas untuk memulai.'
            }
          />
        ) : (
          <div className="rounded-md border border-[var(--m-border)] overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">No</TableHead>
                  <TableHead>Nama Sekolah / Klub</TableHead>
                  <TableHead>Kota / Kabupaten</TableHead>
                  <TableHead className="text-right">Jumlah Atlet</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schools.map((school, index) => (
                  <TableRow key={school.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell className="font-semibold">{school.name}</TableCell>
                    <TableCell>{school.city || '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {school.athletes_count} Atlet
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
