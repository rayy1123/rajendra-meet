import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getLaneOrder } from '@/lib/utils/lane-order';
import { verifyApiRole } from '@/lib/auth';

const HEATS_ADMIN_ROLES = [
  'super_admin',
  'admin',
  'event_admin',
  'operator',
  'admin_technical',
  'admin-technical',
  'admin_kejuaraan',
] as const;

export async function POST(request: Request) {
  try {
    const auth = await verifyApiRole([...HEATS_ADMIN_ROLES]);
    if (!auth.ok) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }
    const supabase = await createClient();

    const body = await request.json();
    const { compEventId, eventId, laneCount = 8 } = body;

    const lanes = Number(laneCount) || 8;
    const laneOrder = getLaneOrder(lanes);

    // Kumpulkan nomor lomba yang akan di-generate (bisa 1 nomor atau seluruh nomor lomba event)
    let compEventIds: string[] = [];
    if (compEventId) {
      compEventIds = [compEventId];
    } else if (eventId) {
      const { data: ces } = await supabase
        .from('competition_events')
        .select('id')
        .eq('event_id', eventId);
      compEventIds = (ces || []).map((c: any) => c.id);
    } else {
      return NextResponse.json(
        { error: 'compEventId atau eventId wajib disertakan.' },
        { status: 400 }
      );
    }

    if (compEventIds.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada nomor lomba yang ditemukan.' },
        { status: 404 }
      );
    }

    let totalHeatsCreated = 0;
    let totalAssignedAthletes = 0;

    for (const ceId of compEventIds) {
      // 1. Ambil seluruh pendaftaran di nomor lomba ini
      const { data: rawRegs, error: regsErr } = await supabase
        .from('registrations')
        .select('id, athlete_id, seed_time_ms')
        .eq('competition_event_id', ceId)
        .order('seed_time_ms', { ascending: true });

      if (regsErr || !rawRegs || rawRegs.length === 0) {
        continue;
      }

      // 2. Hapus heats lama untuk nomor lomba ini
      const { data: oldHeats } = await supabase
        .from('heats')
        .select('id')
        .eq('competition_event_id', ceId);

      if (oldHeats && oldHeats.length > 0) {
        const oldHeatIds = oldHeats.map((h) => h.id);
        await supabase.from('heats').delete().in('id', oldHeatIds);
      }

      // 3. Deduplikasi atlet (ambil seed time terbaik jika ada ganda)
      const byAthlete = new Map<string, typeof rawRegs[0]>();
      rawRegs.forEach((r) => {
        const key = r.athlete_id || r.id;
        const prev = byAthlete.get(key);
        if (!prev) {
          byAthlete.set(key, r);
          return;
        }
        const prevSeed = prev.seed_time_ms ?? Number.MAX_SAFE_INTEGER;
        const curSeed = r.seed_time_ms ?? Number.MAX_SAFE_INTEGER;
        if (curSeed < prevSeed) byAthlete.set(key, r);
      });
      const uniqueRegs = Array.from(byAthlete.values());

      // 4. Hitung jumlah heats yang dibutuhkan
      const totalParticipants = uniqueRegs.length;
      const numHeats = Math.ceil(totalParticipants / lanes);

      // Urutkan atlet: Perenang tercepat dialokasikan ke heat terakhir (standar FINA Spearhead)
      const sortedRegs = [...uniqueRegs].sort(
        (a, b) => (b.seed_time_ms || 999999) - (a.seed_time_ms || 999999)
      );

      for (let h = 1; h <= numHeats; h++) {
        const { data: newHeat, error: heatErr } = await supabase
          .from('heats')
          .insert({
            competition_event_id: ceId,
            heat_number: h,
          })
          .select('id')
          .single();

        if (heatErr || !newHeat) continue;

        const startIndex = (h - 1) * lanes;
        const heatRegs = sortedRegs.slice(startIndex, startIndex + lanes);

        const assignments = heatRegs.map((reg, idx) => ({
          heat_id: newHeat.id,
          registration_id: reg.id,
          lane_number: laneOrder[idx],
        }));

        if (assignments.length > 0) {
          await supabase.from('heat_assignments').insert(assignments);
          totalAssignedAthletes += assignments.length;
        }
        totalHeatsCreated++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil membentuk ${totalHeatsCreated} Acara (Seri) untuk ${totalAssignedAthletes} perenang.`,
      heatsCreated: totalHeatsCreated,
      assignedAthletes: totalAssignedAthletes,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
