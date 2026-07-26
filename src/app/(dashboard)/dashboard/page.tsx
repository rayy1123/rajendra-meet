import { createClient } from '@/lib/supabase/server';
import { 
  Trophy, 
  Users, 
  Flag, 
  Building2, 
  Calendar, 
  ArrowUpRight 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ExcelImportButton } from '@/components/dashboard/excel-import-button';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Query Data Statistik Paralel
  const [
    { count: eventsCount },
    { count: athletesCount },
    { count: compEventsCount },
    { count: schoolsCount },
    { data: recentEvents },
  ] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('athletes').select('*', { count: 'exact', head: true }),
    supabase.from('competition_events').select('*', { count: 'exact', head: true }),
    supabase.from('schools').select('*', { count: 'exact', head: true }),
    supabase.from('events').select('*').order('created_at', { ascending: false }).limit(3),
  ]);

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Quick Import */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-blue-600 to-indigo-700 p-6 rounded-xl text-white shadow-lg">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Swimming Competition Management System</h1>
          <p className="text-blue-100 text-sm mt-1">
            Selamat datang di Dashboard SCMS Rajendra. Kelola acara, babak penyisihan (heat), dan hasil waktu lomba secara akurat.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <ExcelImportButton />
        </div>
      </div>

      {/* Cards Statistik Utama */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="hover:border-primary/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Event</CardTitle>
            <Trophy className="w-4 h-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{eventsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Kejuaraan terdaftar</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Peserta</CardTitle>
            <Users className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{athletesCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Atlet dari seluruh sekolah</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Nomor Lomba</CardTitle>
            <Flag className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{compEventsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Kategori gaya & jarak</p>
          </CardContent>
        </Card>

        <Card className="hover:border-primary/50 transition-all">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Klub & Sekolah</CardTitle>
            <Building2 className="w-4 h-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{schoolsCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Kontingen terdaftar</p>
          </CardContent>
        </Card>
      </div>

      {/* Section Event Terbaru */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold tracking-tight">Event Terkini</h2>
          <Button variant="ghost" size="sm" asChild className="gap-1">
            <Link href="/events">
              Lihat Semua Event <ArrowUpRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>

        {!recentEvents || recentEvents.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            Belum ada data event. Gunakan tombol **Import Buku Acara** di atas untuk menambahkan data.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {recentEvents.map((evt) => (
              <Card key={evt.id} className="flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <span className="text-[10px] font-semibold tracking-wider text-primary uppercase bg-primary/10 px-2 py-0.5 rounded w-fit mb-2">
                    {evt.pool_type} ({evt.lane_count} Lane)
                  </span>
                  <CardTitle className="text-base font-bold line-clamp-1">{evt.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-muted-foreground pb-4">
                  <p className="line-clamp-1">📍 {evt.location}</p>
                  <p className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {evt.start_date} s/d {evt.end_date}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}