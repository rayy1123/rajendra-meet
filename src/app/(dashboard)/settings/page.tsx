import { createClient } from '@/lib/supabase/server';
import { Settings, Shield, Sliders, Database, Save, Server } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PageHeader } from '@/components/ui/page-header';

export default async function SettingsPage() {
  const supabase = await createClient();

  // 1. Fetch data setting sistem & aturan poin
  const [{ data: pointRules }, { data: systemConfigs }] = await Promise.all([
    supabase.from('point_rules').select('*').order('rank', { ascending: true }),
    supabase.from('system_configs').select('*').maybeSingle(),
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Pengaturan Sistem"
        description="Konfigurasi aturan poin kejuaraan, tata letak lintasan kolam, dan pemeliharaan sistem."
        icon={<Settings className="h-6 w-6" />}
      />

      <Tabs defaultValue="points" className="space-y-6">
        <TabsList className="grid w-full sm:w-auto grid-cols-3">
          <TabsTrigger value="points" className="flex items-center gap-2">
            <Sliders className="w-4 h-4" /> Aturan Poin
          </TabsTrigger>
          <TabsTrigger value="pool" className="flex items-center gap-2">
            <Server className="w-4 h-4" /> Konfigurasi Kolam
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="w-4 h-4" /> Backup & Database
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Aturan Poin Kejuaraan */}
        <TabsContent value="points">
          <Card>
            <CardHeader>
              <CardTitle>Bobot Poin Peringkat (Point System)</CardTitle>
              <CardDescription>
                Tentukan jumlah poin yang didapatkan atlet/klub berdasarkan urutan peringkat akhir untuk menentukan Juara Umum & Best Swimmer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                     <TableHead className="w-24">Peringkat</TableHead>
                      <TableHead>Medali / Deskripsi</TableHead>
                      <TableHead className="text-right">Poin Perorangan</TableHead>
                      <TableHead className="text-right">Poin Estafet</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pointRules && pointRules.length > 0 ? (
                      pointRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell className="font-bold">Juara {rule.rank}</TableCell>
                          <TableCell>
                            {rule.rank === 1 && <span className="text-amber-500 font-semibold">Emas</span>}
                            {rule.rank === 2 && <span className="text-slate-400 font-semibold">Perak</span>}
                            {rule.rank === 3 && <span className="text-amber-700 font-semibold">Perunggu</span>}
                            {rule.rank > 3 && <span className="text-muted-foreground">Peringkat {rule.rank}</span>}
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              defaultValue={rule.points_individual || 0}
                              className="w-24 text-right inline-block"
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <Input
                              type="number"
                              defaultValue={rule.points_relay || 0}
                              className="w-24 text-right inline-block"
                            />
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-6 text-muted-foreground">
                          Belum ada aturan poin tersimpan.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end pt-2">
                <Button className="flex items-center gap-2">
                  <Save className="w-4 h-4" /> Simpan Perubahan Poin
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Konfigurasi Default Kolam & Lane */}
        <TabsContent value="pool">
          <Card>
            <CardHeader>
              <CardTitle>Default Konfigurasi Arena / Kolam Renang</CardTitle>
              <CardDescription>
                Pengaturan standar untuk pembuatan event baru dan alokasi lintasan otomatis.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 max-w-xl">
              <div className="space-y-2">
                <label htmlFor="default_lanes" className="text-sm font-medium leading-none block">
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
                <label htmlFor="pool_length" className="text-sm font-medium leading-none block">
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
                <Save className="w-4 h-4" /> Simpan Konfigurasi Kolam
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Maintenance & Database */}
        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle>Pemeliharaan Sistem & Log Aktivitas</CardTitle>
              <CardDescription>
                Unduh salinan cadangan data atau periksa catatan aktivitas sistem.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg bg-slate-50 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm">Backup Data Kejuaraan</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ekspor seluruh tabel Supabase (Event, Atlet, Results, Record) ke format JSON/SQL.
                  </p>
                </div>
                <Button variant="outline" className="flex items-center gap-2">
                  <Database className="w-4 h-4" /> Ekspor Backup
                </Button>
              </div>

              <div className="p-4 border rounded-lg bg-amber-50/50 border-amber-200 flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-sm text-amber-900">Hak Akses & Log Sistem</h4>
                  <p className="text-xs text-amber-700 mt-0.5">
                    Hanya pengguna dengan peran <Shield className="w-3 h-3 inline text-amber-600" /> Chief Admin yang dapat mengubah konfigurasi ini.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}