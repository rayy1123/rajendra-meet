import { requireRole } from '@/lib/auth';
import { Settings, Shield, Sliders, Database, Save, Server } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export default async function SettingsPage() {
  const { supabase } = await requireRole(['event_admin', 'super_admin']);

  const [{ data: pointRules }, { data: systemConfigs }] = await Promise.all([
    supabase.from('point_rules').select('*').order('rank', { ascending: true }),
    supabase.from('system_configs').select('*').maybeSingle(),
  ]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Pengaturan' }]} className="mb-2" />
      <PageHeader
        title="Pengaturan Sistem"
        description="Konfigurasi aturan poin kejuaraan, tata letak lintasan kolam, dan pemeliharaan sistem."
        icon={<Settings className="h-6 w-6" />}
      />

      <Tabs defaultValue="points" className="space-y-4">
        <TabsList className="grid w-full sm:w-auto grid-cols-3">
          <TabsTrigger value="points" className="flex items-center gap-2">
            <Sliders className="h-4 w-4" /> Aturan Poin
          </TabsTrigger>
          <TabsTrigger value="pool" className="flex items-center gap-2">
            <Server className="h-4 w-4" /> Konfigurasi Kolam
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" /> Backup & Database
          </TabsTrigger>
        </TabsList>

        <div data-value="points">
          <div className="glass-panel p-5">
            <h3 className="text-base font-semibold text-[var(--m-ink)]">Bobot Poin Peringkat</h3>
            <p className="mt-1 text-sm text-[var(--m-muted)]">
              Tentukan jumlah poin berdasarkan urutan peringkat akhir untuk Juara Umum & Best Swimmer.
            </p>
            <div className="mt-4 rounded-lg border border-[var(--m-border)] overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Peringkat</TableHead>
                    <TableHead>Medali / Deskripsi</TableHead>
                    <TableHead className="text-right">Poin</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pointRules && pointRules.length > 0 ? (
                    pointRules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell className="font-bold">Juara {rule.rank}</TableCell>
                        <TableCell>
                          {rule.rank === 1 && <span className="text-amber-500 font-semibold">Emas</span>}
                          {rule.rank === 2 && <span className="text-[var(--m-muted)] font-semibold">Perak</span>}
                          {rule.rank === 3 && <span className="text-amber-700 font-semibold">Perunggu</span>}
                          {rule.rank > 3 && <span className="text-muted-foreground">Peringkat {rule.rank}</span>}
                        </TableCell>
                        <TableCell className="text-right">
                          <Input
                            type="number"
                            defaultValue={rule.points ?? 0}
                            className="w-24 text-right inline-block"
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-6 text-muted-foreground">
                        Belum ada aturan poin tersimpan.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-end">
              <Button className="flex items-center gap-2">
                <Save className="h-4 w-4" /> Simpan Perubahan Poin
              </Button>
            </div>
          </div>
        </div>

        <div data-value="pool">
          <div className="glass-panel p-5">
            <h3 className="text-base font-semibold text-[var(--m-ink)]">Default Konfigurasi Arena / Kolam Renang</h3>
            <p className="mt-1 text-sm text-[var(--m-muted)]">
              Pengaturan standar untuk pembuatan event baru dan alokasi lintasan otomatis.
            </p>
            <div className="mt-4 max-w-xl space-y-4">
              <div className="space-y-2">
                <label htmlFor="default_lanes" className="text-sm font-medium block">
                  Jumlah Lintasan Kolam (Default Lane Count)
                </label>
                <Input
                  id="default_lanes"
                  type="number"
                  defaultValue={systemConfigs?.default_lane_count || 8}
                  placeholder="Misal: 8 atau 10"
                />
                <p className="text-xs text-muted-foreground">
                  Standar lintasan kolam renang umumnya 8 atau 10 lintasan.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="pool_length" className="text-sm font-medium block">
                  Panjang Kolam Default (Meters)
                </label>
                <Input
                  id="pool_length"
                  type="number"
                  defaultValue={systemConfigs?.default_pool_length || 50}
                  placeholder="50 (Long Course) / 25 (Short Course)"
                />
              </div>

              <Button className="flex items-center gap-2">
                <Save className="h-4 w-4" /> Simpan Konfigurasi Kolam
              </Button>
            </div>
          </div>
        </div>

        <div data-value="database">
          <div className="glass-panel p-5">
            <h3 className="text-base font-semibold text-[var(--m-ink)]">Pemeliharaan Sistem & Log Aktivitas</h3>
            <p className="mt-1 text-sm text-[var(--m-muted)]">
              Unduh salinan cadangan data atau periksa catatan aktivitas sistem.
            </p>
            <div className="mt-4 space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-[var(--m-border)] bg-[var(--m-soft)] p-4">
                <div>
                  <h4 className="text-sm font-semibold">Backup Data Kejuaraan</h4>
                  <p className="text-xs text-[var(--m-muted)]">
                    Ekspor seluruh tabel Supabase (Event, Atlet, Results, Record) ke format JSON/SQL.
                  </p>
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                  <Database className="h-4 w-4" /> Ekspor Backup
                </Button>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 p-4">
                <div>
                  <h4 className="text-sm font-semibold text-amber-900">Hak Akses & Log Sistem</h4>
                  <p className="text-xs text-amber-700">
                    Hanya pengguna dengan peran <Shield className="inline h-3.5 w-3.5 text-amber-600" /> Chief Admin yang dapat mengubah konfigurasi ini.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Tabs>
    </div>
  );
}
