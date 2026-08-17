'use client';

import { useState, useTransition, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Loader2 } from 'lucide-react';

interface MedalStat {
  id: string;
  name: string;
  gold: number;
  silver: number;
  bronze: number;
}

interface MedalLeaderboardViewProps {
  events: { id: string; name: string }[];
  initialEventId: string;
  medalStats: MedalStat[];
}

export function MedalLeaderboardView({
  events,
  initialEventId,
  medalStats,
}: MedalLeaderboardViewProps) {
  const router = useRouter();
  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [isPending, startTransition] = useTransition();

  // Handle pergantian event dengan feedback loading
  const handleEventChange = (val: string) => {
    setSelectedEventId(val);
    startTransition(() => {
      router.push(`/medals?eventId=${val}`);
    });
  };

  // Memastikan data terurut secara independen (Standar Olimpiade: Emas > Perak > Perunggu > Total)
  const sortedMedalStats = useMemo(() => {
    return [...medalStats].sort((a, b) => {
      if (b.gold !== a.gold) return b.gold - a.gold;
      if (b.silver !== a.silver) return b.silver - a.silver;
      if (b.bronze !== a.bronze) return b.bronze - a.bronze;
      const totalA = a.gold + a.silver + a.bronze;
      const totalB = b.gold + b.silver + b.bronze;
      return totalB - totalA;
    });
  }, [medalStats]);

  return (
    <div className="space-y-6">
      {/* Filter Event */}
      <div className="bg-muted/40 p-4 rounded-xl border max-w-md">
        <label className="text-xs font-semibold block mb-1">Pilih Kejuaraan / Event</label>
        <Select value={selectedEventId} onValueChange={handleEventChange} disabled={isPending}>
          <SelectTrigger className="bg-background">
            <SelectValue placeholder="Pilih Event" />
          </SelectTrigger>
          <SelectContent>
            {events.map((e) => (
              <SelectItem key={e.id} value={e.id}>
                {e.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabel Perolehan Medali */}
      <Card className="shadow-sm border relative overflow-hidden">
        {/* Loading Overlay saat berpindah Event */}
        {isPending && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}

        <CardHeader className="bg-muted/20 pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-500" />
            Klasemen Kontingen / Sekolah
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          {sortedMedalStats.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              Belum ada data perolehan medali. Pastikan waktu hasil lomba telah diinput pada modul <b>Results</b>.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/10">
                  <TableHead className="w-16 text-center font-bold">Peringkat</TableHead>
                  <TableHead className="font-bold">Kontingen / Sekolah / Klub</TableHead>
                  <TableHead className="w-24 text-center font-bold text-amber-600">🥇 Emas</TableHead>
                  <TableHead className="w-24 text-center font-bold text-slate-500">🥈 Perak</TableHead>
                  <TableHead className="w-24 text-center font-bold text-amber-800">🥉 Perunggu</TableHead>
                  <TableHead className="w-24 text-center font-bold">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedMedalStats.map((stat, idx) => {
                  const totalMedals = stat.gold + stat.silver + stat.bronze;
                  return (
                    <TableRow key={stat.id} className="hover:bg-muted/20">
                      <TableCell className="text-center font-black text-base">
                        {idx === 0 ? (
                          <span className="text-amber-500">1</span>
                        ) : idx === 1 ? (
                          <span className="text-slate-400">2</span>
                        ) : idx === 2 ? (
                          <span className="text-amber-700">3</span>
                        ) : (
                          idx + 1
                        )}
                      </TableCell>
                      <TableCell className="font-bold text-sm">
                        {stat.name}
                      </TableCell>
                      <TableCell className="text-center font-bold text-amber-600 bg-amber-50/50 dark:bg-amber-950/20">
                        {stat.gold}
                      </TableCell>
                      <TableCell className="text-center font-bold text-slate-500 bg-slate-50/50 dark:bg-slate-900/20">
                        {stat.silver}
                      </TableCell>
                      <TableCell className="text-center font-bold text-amber-800 bg-amber-900/10 dark:bg-amber-950/30">
                        {stat.bronze}
                      </TableCell>
                      <TableCell className="text-center font-black text-base">
                        {totalMedals}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}