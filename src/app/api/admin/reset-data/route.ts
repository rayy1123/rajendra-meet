import { NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { writeCallRoomStore } from '@/lib/data/call-room-server';
import { writeLocalChecklist } from '@/lib/data/technical-checklist-server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { user, supabase } = await requireRole(['super_admin', 'admin', 'admin_kejuaraan']);

    const body = await request.json().catch(() => ({}));
    const { scope = 'all', eventId } = body;

    const results: Record<string, any> = {};

    if (scope === 'all' || scope === 'results') {
      // 1. Reset seluruh hasil catatan waktu lomba (results)
      let query = supabase.from('results').delete();
      if (eventId && eventId !== 'all') {
        const { data: compEvents } = await supabase
          .from('competition_events')
          .select('id')
          .eq('event_id', eventId);
        const compIds = (compEvents || []).map((c) => c.id);
        if (compIds.length > 0) {
          const { data: heats } = await supabase
            .from('heats')
            .select('id')
            .in('competition_event_id', compIds);
          const heatIds = (heats || []).map((h) => h.id);
          if (heatIds.length > 0) {
            const { data: assigns } = await supabase
              .from('heat_assignments')
              .select('id')
              .in('heat_id', heatIds);
            const assignIds = (assigns || []).map((a) => a.id);
            if (assignIds.length > 0) {
              await supabase.from('results').delete().in('heat_assignment_id', assignIds);
            }
          }
        }
      } else {
        await supabase.from('results').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      results.results_reset = true;
    }

    if (scope === 'all' || scope === 'call_room') {
      // 2. Reset status check-in call room
      writeCallRoomStore({ checkins: {} });
      results.call_room_reset = true;
    }

    if (scope === 'all' || scope === 'seeding') {
      // 3. Reset pembagian heat & lintasan
      if (eventId && eventId !== 'all') {
        const { data: compEvents } = await supabase
          .from('competition_events')
          .select('id')
          .eq('event_id', eventId);
        const compIds = (compEvents || []).map((c) => c.id);
        if (compIds.length > 0) {
          await supabase.from('heats').delete().in('competition_event_id', compIds);
        }
      } else {
        await supabase.from('heats').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      }
      results.heats_reset = true;
    }

    // Catat audit log
    try {
      await supabase.from('audit_log').insert({
        actor_id: user.id,
        actor_email: user.email,
        action: 'admin_reset_data',
        entity: `system_reset:${scope}`,
        detail: `Reset data kejuaraan dieksekusi oleh ${user.email} (Scope: ${scope}, Event: ${eventId || 'All'})`,
      });
    } catch (auditErr) {
      console.warn('Audit log write error:', auditErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Data kejuaraan berhasil di-reset.',
      results,
    });
  } catch (err: unknown) {
    console.error('Reset data API error:', err);
    const msg = err instanceof Error ? err.message : 'Gagal mereset data';
    return NextResponse.json({ success: false, error: msg }, { status: 500 });
  }
}
