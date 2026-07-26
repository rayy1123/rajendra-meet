'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { formatMsToTime } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Radio } from 'lucide-react';

interface LiveScoreboardViewProps {
  eventId: string;
  compEvents: any[];
}

export function LiveScoreboardView({ eventId, compEvents }: LiveScoreboardViewProps) {
  const supabase = createClient();
  const [selectedCompEventId, setSelectedCompEventId] = useState<string>(compEvents[0]?.id || '');
  const [heatsData, setHeatsData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch data Heat & Hasil Lomba
  const fetchScores = useCallback(async () => {
    if (!selectedCompEventId) return;

    const { data: heats } = await supabase
      .from('heats')
      .select(`
        id,
        heat_number,
        heat_assignments (
          id,
          lane_number,
          registrations (
            seed_time_ms,
            athletes (
              full_name,
              athlete_number,
              schools (name)
            )
          ),
          results (
            id,
            time_ms,
            status
          )
        )
      `)
      .eq('competition_event_id', selectedCompEventId)
      .order('heat_number', { ascending: true });

    setHeatsData(heats || []);
  }, [selectedCompEventId, supabase]);

  useEffect(() => {
    setLoading(true);
    fetchScores().finally(() => setLoading(false));

    // Setup Supabase Realtime listener pada tabel 'results'
    const channel = supabase
      .channel('realtime-scoreboard')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'results' },
        () => {
          fetchScores(); // Refresh otomatis jika ada insert/update hasil
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCompEventId, fetchScores, supabase]);

  return (
    <div className="space-y-6">
      {/* Select Nomor Lomba */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl">
        <div className="w-full sm:w-auto space-y-1">
          <p className="text-xs font-semibold text-slate-400">PILIH NOMOR LOMBA</p>
          <Select value={selectedCompEventId} onValueChange={setSelectedCompEventId}>
            <SelectTrigger className="w-full sm:w-[380px] bg-slate-950 border-slate-800 text-white font-semibold">
              <SelectValue placeholder="Pilih Nomor Lomba" />
            </SelectTrigger>
            <SelectContent className="bg-slate-900 border-slate-800 text-white">
              {compEvents.map((ce) => (
                <SelectItem key={ce.id} value={ce.id}>
                  {ce.name} - {ce.grade_level} ({ce.gender === 'female' ? 'Putri' : 'Putra'})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-3 py-1.5 rounded-full">
          <Radio className="w-3.5 h-3.5 animate-ping text-emerald-500" /> Realtime Sync Active
        </div>
      </div>

      {/* Render Heats & Leaderboard */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 space-y-2">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-sm">Memuat data lintasan & hasil waktu...</p>
        </div>
      ) : heatsData.length === 0 ? (
        <div className="py-16 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl">
          Belum ada Heat / Jadwal Lomba untuk kategori ini.
        </div>
      ) : (
        <div className="space-y-6">
          {heatsData.map((heat) => (
            <Card key={heat.id} className="bg-slate-900 border-slate-800 overflow-hidden shadow-2xl">
              <CardHeader className="bg-slate-800/50 py-3 border-b border-slate-800 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-black text-white uppercase tracking-wide">
                  Heat {heat.heat_number}
                </CardTitle>
                <Badge variant="outline" className="border-slate-700 text-slate-300">
                  {heat.heat_assignments?.length || 0} Atlet
                </Badge>
              </CardHeader>

              <CardContent className="p-0 divide-y divide-slate-800/60">
                {heat.heat_assignments
                  ?.sort((a: any, b: any) => a.lane_number - b.lane_number)
                  .map((assign: any) => {
                    const athlete = assign.registrations?.athletes;
                    const school = athlete?.schools;
                    const result = assign.results?.[0];

                    return (
                      <div
                        key={assign.id}
                        className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition-colors"
                      >
                        {/* Lane + Name */}
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-lg bg-blue-950 border border-blue-800 text-blue-400 font-black text-xl flex items-center justify-center shrink-0">
                            {assign.lane_number}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-100 text-base">
                              {athlete?.full_name || 'Lintasan Kosong'}
                            </h4>
                            <p className="text-xs text-slate-400">
                              {school?.name || 'Umum'}
                            </p>
                          </div>
                        </div>

                        {/* Waktu Hasil Lomba */}
                        <div className="text-right">
                          {result?.time_ms ? (
                            <span className="font-mono font-black text-xl sm:text-2xl text-emerald-400 tracking-wider">
                              {formatMsToTime(result.time_ms)}
                            </span>
                          ) : (
                            <span className="font-mono text-sm text-slate-600">--:--.--</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}