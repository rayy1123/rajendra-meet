'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { formatMsToTime } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Sparkles, Trash2, Users, Loader2 } from 'lucide-react';

interface AthleteRef {
  id?: string | null;
  full_name?: string | null;
  athlete_number?: string | null;
  schools?: { name?: string | null } | null;
}

interface RegistrationRow {
  id: string;
  athlete_id?: string | null;
  seed_time_ms?: number | null;
  athletes?: AthleteRef | null;
}

interface HeatAssignmentRow {
  id: string;
  lane_number: number;
  registration_id?: string | null;
}

interface HeatRow {
  id: string;
  heat_number?: number;
  heat_assignments?: HeatAssignmentRow[] | null;
}

interface HeatGeneratorOperatorProps {
  events: { id: string; name: string }[];
  compEvents: { id: string; name: string; grade_level?: string | null; gender?: string | null }[];
  initialEventId: string;
  initialCompEventId: string;
  registrations: RegistrationRow[];
  existingHeats: HeatRow[];
  laneCount: number;
}

export function HeatGeneratorOperator({
  events,
  compEvents,
  initialEventId,
  initialCompEventId,
  registrations,
  existingHeats,
  laneCount,
}: HeatGeneratorOperatorProps) {
  const router = useRouter();
  const supabase = createClient();

  const [selectedEventId, setSelectedEventId] = useState(initialEventId);
  const [selectedCompEventId, setSelectedCompEventId] = useState(initialCompEventId);
  const [generating, setGenerating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Urutan Lintasan Renang (Spearhead / Zig-Zag dari Tengah Outward)
  // Untuk 8 Lane: [4, 5, 3, 6, 2, 7, 1, 8]
  const getLaneOrder = (totalLanes: number) => {
    const center = Math.ceil(totalLanes / 2);
    const lanes = [center];
    let offset = 1;

    while (lanes.length < totalLanes) {
      if (center + offset <= totalLanes) lanes.push(center + offset);
      if (center - offset >= 1) lanes.push(center - offset);
      offset++;
    }
    return lanes;
  };

  const handleEventChange = (val: string) => {
    setSelectedEventId(val);
    router.push(`/heats?eventId=${val}`, { scroll: false });
  };

  const handleCompEventChange = (val: string) => {
    setSelectedCompEventId(val);
    router.push(`/heats?eventId=${selectedEventId}&compEventId=${val}`, { scroll: false });
  };

  // Fungsi Generate Acara Otomatis
  const handleGenerateHeats = async () => {
    if (!selectedCompEventId || registrations.length === 0) {
      toast.error('Tidak ada peserta terdaftar untuk dikelompokkan.');
      return;
    }

    setGenerating(true);
    toast.info('Menyusun acara & lintasan secara otomatis...');

    try {
      // 1. Hapus Acara lama jika ada
      if (existingHeats.length > 0) {
        const heatIds = existingHeats.map((h) => h.id);
        const { error: deleteErr } = await supabase.from('heats').delete().in('id', heatIds);
        if (deleteErr) throw deleteErr;
      }

      // 2. Bersihkan pendaftaran dari atlet ganda.
      //    Satu atlet hanya boleh tampil SEKALI per nomor lomba (acara) — bila atlet
      //    terdaftar lebih dari satu kali, ambil pendaftaran dengan seed time terbaik.
      const byAthlete = new Map<string, RegistrationRow>();
      const registerOnce = (reg: RegistrationRow) => {
        const key = reg.athlete_id || reg.id;
        const prev = byAthlete.get(key);
        if (!prev) {
          byAthlete.set(key, reg);
          return;
        }
        // Pertahankan yang punya seed_time_ms lebih kecil (lebih cepat)
        const prevSeed = prev.seed_time_ms ?? Number.MAX_SAFE_INTEGER;
        const curSeed = reg.seed_time_ms ?? Number.MAX_SAFE_INTEGER;
        if (curSeed < prevSeed) byAthlete.set(key, reg);
      };
      registrations.forEach(registerOnce);
      const uniqueRegs = Array.from(byAthlete.values());

      // 3. Hitung jumlah Acara (babak) yang dibutuhkan
      const totalParticipants = uniqueRegs.length;
      const numHeats = Math.ceil(totalParticipants / laneCount);
      const laneOrder = getLaneOrder(laneCount);

      // Urutkan atlet: Perenang tercepat dialokasikan ke Acara terakhir (Standar Seeding)
      const sortedRegs = [...uniqueRegs].sort((a, b) => (b.seed_time_ms || 999999) - (a.seed_time_ms || 999999));

      // Algoritma Distribusi Seeding ke Acara
      for (let h = 1; h <= numHeats; h++) {
        // Simpan Data Acara Baru
        const { data: newHeat, error: heatErr } = await supabase
          .from('heats')
          .insert({
            competition_event_id: selectedCompEventId,
            heat_number: h,
          })
          .select('id')
          .single();

        if (heatErr || !newHeat) throw heatErr;

        // Ambil porsi atlet untuk Acara ini (Menggunakan slice tanpa memutasi array asal)
        const startIndex = (h - 1) * laneCount;
        const heatRegs = sortedRegs.slice(startIndex, startIndex + laneCount);

        // Petakan ke Lintasan Spearhead
        const assignments = heatRegs.map((reg, idx) => ({
          heat_id: newHeat.id,
          registration_id: reg.id,
          lane_number: laneOrder[idx],
        }));

        const { error: assignErr } = await supabase.from('heat_assignments').insert(assignments);
        if (assignErr) throw assignErr;
      }

      toast.success(`Berhasil menyusun ${numHeats} Acara untuk ${totalParticipants} atlet (tanpa duplikat).`);
      router.refresh();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memproses pembagian Acara.');
    } finally {
      setGenerating(false);
    }
  };

  // Hapus Semua Acara untuk Nomor Lomba ini
  const handleDeleteHeats = async () => {
    if (existingHeats.length === 0) return;

    setDeleting(true);
    try {
      const heatIds = existingHeats.map((h) => h.id);
      const { error } = await supabase.from('heats').delete().in('id', heatIds);
      if (error) throw error;

      toast.success('Semua Acara berhasil dihapus.');
      router.refresh();
    } catch {
      toast.error('Gagal menghapus Acara.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Filter & Action Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-muted/40 p-4 rounded-xl border">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full lg:w-auto flex-1">
          <div className="space-y-1">
            <label className="text-xs font-semibold block">Pilih Event</label>
            <Select value={selectedEventId} onValueChange={handleEventChange}>
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

          <div className="space-y-1">
            <label className="text-xs font-semibold block">Pilih Nomor Lomba</label>
            <Select value={selectedCompEventId} onValueChange={handleCompEventChange}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Pilih Nomor Lomba" />
              </SelectTrigger>
              <SelectContent>
                {compEvents.map((ce) => (
                  <SelectItem key={ce.id} value={ce.id}>
                    {ce.name} - {ce.grade_level} ({ce.gender === 'female' ? 'Putri' : 'Putra'})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-end pt-2 lg:pt-0">
          {existingHeats.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDeleteHeats}
              disabled={deleting || generating}
              className="text-red-600 hover:bg-red-50 hover:text-red-700"
            >
              {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4 mr-1" />}
              Reset Acara
            </Button>
          )}

          <Button
            onClick={handleGenerateHeats}
            disabled={generating || registrations.length === 0}
            className="gap-2 bg-primary hover:bg-primary/90 font-semibold"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {existingHeats.length > 0 ? 'Re-Generate Acara' : 'Generate Acara Otomatis'}
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="flex items-center justify-between bg-primary/10 border border-primary/20 p-4 rounded-xl text-xs text-primary">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary shrink-0" />
          <span>
            Total Peserta Terdaftar: <b>{registrations.length} Atlet</b> • Kapasitas Kolam: <b>{laneCount} Lintasan</b>
          </span>
        </div>
        <Badge variant="outline" className="border-primary/30 text-primary">
          {existingHeats.length} Acara Terbentuk
        </Badge>
      </div>

      {/* Render Status Heat */}
      {existingHeats.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground border-dashed">
          <p className="font-semibold text-base">Belum ada Acara yang dibentuk.</p>
          <p className="text-xs mt-1">
            Klik tombol <b>Generate Acara Otomatis</b> di atas untuk menyusun babak & lintasan secara instan.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {existingHeats.map((heat) => (
            <Card key={heat.id} className="border-t-4 border-t-primary shadow-sm">
              <CardHeader className="py-3 bg-muted/20 flex flex-row items-center justify-between">
                <CardTitle className="text-base font-bold">Acara {heat.heat_number}</CardTitle>
                <span className="text-xs text-muted-foreground font-medium">
                  {heat.heat_assignments?.length || 0} Lintasan Terisi
                </span>
              </CardHeader>

              <CardContent className="p-0 divide-y">
                {heat.heat_assignments &&
                  [...heat.heat_assignments]
                    .sort((a, b) => a.lane_number - b.lane_number)
                    .map((assign) => {
                      const reg = registrations.find((r) => r.id === assign.registration_id);
                      const athlete = reg?.athletes;

                      return (
                        <div key={assign.id} className="p-3 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-3">
                            <span className="w-7 h-7 rounded bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0">
                              {assign.lane_number}
                            </span>
                            <div>
                              <p className="font-bold text-sm text-foreground">{athlete?.full_name || 'Kosong'}</p>
                              <p className="text-muted-foreground">{athlete?.schools?.name || 'Umum'}</p>
                            </div>
                          </div>

                          <div className="font-mono font-bold text-slate-600">
                            {reg?.seed_time_ms ? formatMsToTime(reg.seed_time_ms) : 'NT'}
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