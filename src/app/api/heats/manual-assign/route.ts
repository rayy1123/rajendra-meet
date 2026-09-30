import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'Aksi (action) wajib disertakan.' }, { status: 400 });
    }

    // 1. PINDAH ATAU TUKAR ATLET ANTAR LINTASAN / SERI
    if (action === 'move_or_swap') {
      const { sourceAssignmentId, targetHeatId, targetLaneNumber, targetAssignmentId } = body;

      if (!sourceAssignmentId || !targetHeatId || typeof targetLaneNumber !== 'number') {
        return NextResponse.json({ error: 'Parameter perpindahan tidak lengkap.' }, { status: 400 });
      }

      // Ambil data penugasan asal
      const { data: sourceAssign, error: srcErr } = await supabase
        .from('heat_assignments')
        .select('*')
        .eq('id', sourceAssignmentId)
        .single();

      if (srcErr || !sourceAssign) {
        return NextResponse.json({ error: 'Penugasan asal tidak ditemukan.' }, { status: 404 });
      }

      // Jika ada targetAssignmentId, lakukan pertukaran (SWAP)
      if (targetAssignmentId) {
        const { data: targetAssign, error: tgtErr } = await supabase
          .from('heat_assignments')
          .select('*')
          .eq('id', targetAssignmentId)
          .single();

        if (tgtErr || !targetAssign) {
          return NextResponse.json({ error: 'Penugasan target tidak ditemukan.' }, { status: 404 });
        }

        // Jalankan swap: gunakan penanda sementara jika dalam heat yang sama untuk mencegah tabrakan unique constraint
        const tempLane = 999;
        await supabase
          .from('heat_assignments')
          .update({ lane_number: tempLane })
          .eq('id', sourceAssignmentId);

        // Update target ke posisi source
        await supabase
          .from('heat_assignments')
          .update({
            heat_id: sourceAssign.heat_id,
            lane_number: sourceAssign.lane_number,
          })
          .eq('id', targetAssignmentId);

        // Update source ke posisi target
        await supabase
          .from('heat_assignments')
          .update({
            heat_id: targetHeatId,
            lane_number: targetLaneNumber,
          })
          .eq('id', sourceAssignmentId);

        return NextResponse.json({
          success: true,
          message: `Berhasil menukar atlet ke Seri ${targetHeatId} Lintasan ${targetLaneNumber}.`,
        });
      }

      // Jika lintasan tujuan kosong, pindahkan langsung (MOVE)
      // Cek apakah lintasan tujuan benar-benar kosong
      const { data: existingInTarget } = await supabase
        .from('heat_assignments')
        .select('id')
        .eq('heat_id', targetHeatId)
        .eq('lane_number', targetLaneNumber)
        .maybeSingle();

      if (existingInTarget) {
        return NextResponse.json(
          { error: `Lintasan ${targetLaneNumber} sudah terisi. Gunakan opsi tukar atlet.` },
          { status: 400 }
        );
      }

      const { error: moveErr } = await supabase
        .from('heat_assignments')
        .update({
          heat_id: targetHeatId,
          lane_number: targetLaneNumber,
        })
        .eq('id', sourceAssignmentId);

      if (moveErr) throw moveErr;

      return NextResponse.json({
        success: true,
        message: `Berhasil memindahkan atlet ke Lintasan ${targetLaneNumber}.`,
      });
    }

    // 2. TAMBAH / TUGASKAN ATLET KE LINTASAN KOSONG
    if (action === 'assign_athlete') {
      const { heatId, laneNumber, registrationId } = body;

      if (!heatId || typeof laneNumber !== 'number' || !registrationId) {
        return NextResponse.json({ error: 'Parameter penugasan atlet tidak lengkap.' }, { status: 400 });
      }

      // Cek apakah lintasan sudah ada isinya
      const { data: existing } = await supabase
        .from('heat_assignments')
        .select('id')
        .eq('heat_id', heatId)
        .eq('lane_number', laneNumber)
        .maybeSingle();

      if (existing) {
        // Update penugasan yang ada
        const { error: updErr } = await supabase
          .from('heat_assignments')
          .update({ registration_id: registrationId })
          .eq('id', existing.id);

        if (updErr) throw updErr;
      } else {
        // Insert baru
        const { error: insErr } = await supabase
          .from('heat_assignments')
          .insert({
            heat_id: heatId,
            lane_number: laneNumber,
            registration_id: registrationId,
          });

        if (insErr) throw insErr;
      }

      return NextResponse.json({
        success: true,
        message: `Atlet berhasil ditugaskan ke Lintasan ${laneNumber}.`,
      });
    }

    // 3. HAPUS ATLET DARI LINTASAN (KOSONGKAN LINTASAN / SCRATCH)
    if (action === 'remove_athlete') {
      const { assignmentId } = body;

      if (!assignmentId) {
        return NextResponse.json({ error: 'ID penugasan wajib disertakan.' }, { status: 400 });
      }

      // Hapus hasil terkait jika ada
      await supabase.from('results').delete().eq('heat_assignment_id', assignmentId);

      const { error: delErr } = await supabase
        .from('heat_assignments')
        .delete()
        .eq('id', assignmentId);

      if (delErr) throw delErr;

      return NextResponse.json({
        success: true,
        message: 'Lintasan berhasil dikosongkan (atlet dikeluarkan dari seri).',
      });
    }

    // 4. TAMBAH HEAT / SERI BARU UNTUK NOMOR LOMBA
    if (action === 'add_heat') {
      const { compEventId, heatNumber } = body;

      if (!compEventId || typeof heatNumber !== 'number') {
        return NextResponse.json({ error: 'ID nomor lomba dan nomor heat wajib disertakan.' }, { status: 400 });
      }

      const { data: newHeat, error: heatErr } = await supabase
        .from('heats')
        .insert({
          competition_event_id: compEventId,
          heat_number: heatNumber,
        })
        .select('id, heat_number')
        .single();

      if (heatErr) throw heatErr;

      return NextResponse.json({
        success: true,
        message: `Seri ${heatNumber} baru berhasil ditambahkan.`,
        data: newHeat,
      });
    }

    // 5. HAPUS HEAT / SERI
    if (action === 'delete_heat') {
      const { heatId } = body;

      if (!heatId) {
        return NextResponse.json({ error: 'ID heat wajib disertakan.' }, { status: 400 });
      }

      // Hapus penugasan di heat ini terlebih dahulu
      await supabase.from('heat_assignments').delete().eq('heat_id', heatId);

      const { error: delErr } = await supabase.from('heats').delete().eq('id', heatId);
      if (delErr) throw delErr;

      return NextResponse.json({
        success: true,
        message: 'Seri dan lintasan terkait berhasil dihapus.',
      });
    }

    return NextResponse.json({ error: `Aksi ${action} tidak dikenal.` }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan server.';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
