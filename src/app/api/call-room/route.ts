import { NextResponse } from 'next/server';
import {
  getAllCallRoomCheckins,
  updateCallRoomStatusServer,
  bulkUpdateCallRoomHeatServer,
  type CallRoomStatus,
} from '@/lib/data/call-room-server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId') || undefined;
    const compEventId = searchParams.get('compEventId') || undefined;

    const data = getAllCallRoomCheckins(eventId, compEventId);
    return NextResponse.json({ ok: true, data });
  } catch (error) {
    console.error('Call room GET error:', error);
    return NextResponse.json(
      { ok: false, error: 'Gagal mengambil data call room' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;

    // Single item update
    if (action === 'update_status') {
      const {
        assignmentId,
        status,
        heatId,
        competitionEventId,
        eventId,
        laneNumber,
        athleteName,
        athleteNumber,
        schoolName,
        scratchReason,
        operatorName,
      } = body;

      if (!assignmentId || !status) {
        return NextResponse.json(
          { ok: false, error: 'assignmentId dan status wajib diisi' },
          { status: 400 }
        );
      }

      const updated = updateCallRoomStatusServer(assignmentId, {
        status: status as CallRoomStatus,
        heat_id: heatId,
        competition_event_id: competitionEventId,
        event_id: eventId,
        lane_number: laneNumber,
        athlete_name: athleteName,
        athlete_number: athleteNumber,
        school_name: schoolName,
        scratch_reason: scratchReason,
        checked_in_by: operatorName,
      });

      // Sinkronisasi status ke Supabase results jika status scratched atau no_show
      try {
        const supabase = await createClient();
        if (status === 'scratched' || status === 'no_show') {
          const dbStatus = status === 'scratched' ? 'scr' : 'dns';
          // Check if result exists
          const { data: existingResult } = await supabase
            .from('results')
            .select('id')
            .eq('heat_assignment_id', assignmentId)
            .maybeSingle();

          if (existingResult) {
            await supabase
              .from('results')
              .update({ status: dbStatus, time_ms: null })
              .eq('id', existingResult.id);
          } else {
            await supabase.from('results').insert({
              heat_assignment_id: assignmentId,
              status: dbStatus,
              time_ms: null,
            });
          }
        } else if (status === 'cleared' || status === 'waiting' || status === 'called') {
          // If returning from scratch/no_show, reset result if it had scr/dns
          const { data: existingResult } = await supabase
            .from('results')
            .select('id, status')
            .eq('heat_assignment_id', assignmentId)
            .maybeSingle();

          if (existingResult && (existingResult.status === 'scr' || existingResult.status === 'dns')) {
            await supabase.from('results').delete().eq('id', existingResult.id);
          }
        }
      } catch (dbErr) {
        console.warn('Call room db sync notice:', dbErr);
      }

      return NextResponse.json({ ok: true, data: updated });
    }

    // Bulk heat update
    if (action === 'bulk_heat') {
      const { heatId, assignments, targetStatus, operatorName } = body;
      if (!heatId || !Array.isArray(assignments) || !targetStatus) {
        return NextResponse.json(
          { ok: false, error: 'heatId, assignments, dan targetStatus wajib diisi' },
          { status: 400 }
        );
      }

      const results = bulkUpdateCallRoomHeatServer(
        heatId,
        assignments,
        targetStatus as CallRoomStatus,
        operatorName
      );

      return NextResponse.json({ ok: true, data: results });
    }

    return NextResponse.json(
      { ok: false, error: 'Action tidak dikenal' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Call room POST error:', error);
    return NextResponse.json(
      { ok: false, error: 'Gagal memproses aksi call room' },
      { status: 500 }
    );
  }
}
