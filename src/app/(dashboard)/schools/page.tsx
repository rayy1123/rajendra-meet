import { createClient } from '@/lib/supabase/server';
import { School, Plus, Search, Building2, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
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
  code: string | null;
  city: string | null;
  created_at: string;
  athletes_count: number;
}

interface SchoolRow {
  id: string;
  name: string;
  code: string | null;
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

  // 1. Fetch data sekolah/klub beserta relasi jumlah atlet
  let query = supabase
    .from('schools')
    .select(`
      id,
      name,
      code,
      city,
      created_at,
      athletes (count)
    `)
    .order('name', { ascending: true });

  if (searchQuery) {
    query = query.ilike('name', `%${searchQuery}%`);
  }

  const { data: schoolsData, error } = await query;

  // Formatting data agar siap dipakai di tabel
  const schools: SchoolWithCount[] =
    schoolsData?.map((school: SchoolRow) => ({
      id: school.id,
      name: school.name,
      code: school.code,
      city: school.city,
      created_at: school.created_at,
      athletes_count: school.athletes?.[0]?.count || 0,
    })) || [];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Master Sekolah / Klub"
        description="Kelola daftar kontingen sekolah dan klub renang yang terdaftar dalam kejuaraan."
        icon={<School className="h-6 w-6" />}
        actions={
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" /> Tambah Sekolah / Klub
          </Button>
        }
      />

      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Sekolah / Klub' }]} className="mb-1" />

      {/* Ringkasan Statistik */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Kontingen</CardTitle>
            <Building2 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schools.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Sekolah & Klub Terdaftar</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Atlet Terikat</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {schools.reduce((acc, curr) => acc + curr.athletes_count, 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Atlet Dari Seluruh Kontingen</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter & Table Container */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
            <form method="GET" className="relative flex-1 max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                name="query"
                placeholder="Cari nama sekolah atau klub..."
                defaultValue={searchQuery}
                className="pl-8"
              />
            </form>
          </div>
        </CardHeader>
        <CardContent>
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
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                   <TableHead className="w-20">No</TableHead>
                    <TableHead>Nama Sekolah / Klub</TableHead>
                    <TableHead>Kode Kontingen</TableHead>
                    <TableHead>Kota / Kabupaten</TableHead>
                    <TableHead className="text-right">Jumlah Atlet</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {schools.map((school, index) => (
                    <TableRow key={school.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-semibold">{school.name}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                          {school.code || '-'}
                        </span>
                      </TableCell>
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
        </CardContent>
      </Card>
    </div>
  );
}