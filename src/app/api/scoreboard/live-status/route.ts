import { NextRequest, NextResponse } from 'next/server';
import { getEventLiveConfig, saveEventLiveConfig, getAllLiveConfigs } from '@/lib/data/live-scoreboard-server';
import { checkEventLiveStatus, LiveScoreboardMode } from '@/lib/data/live-scoreboard-settings';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const eventId = searchParams.get('eventId');

  if (!eventId) {
    const all = getAllLiveConfigs();
    return NextResponse.json({ success: true, configs: all });
  }

  const config = getEventLiveConfig(eventId);
  return NextResponse.json({ success: true, config });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { eventId, mode } = body as { eventId?: string; mode?: LiveScoreboardMode };

    if (!eventId || !mode || !['auto', 'open', 'closed'].includes(mode)) {
      return NextResponse.json({ error: 'Parameter eventId dan mode ("auto" | "open" | "closed") harus diisi' }, { status: 400 });
    }

    const saved = saveEventLiveConfig(eventId, mode);
    if (!saved) {
      return NextResponse.json({ error: 'Gagal menyimpan status live scoreboard' }, { status: 500 });
    }

    // Upayakan sync ke database Supabase jika kolom terkait tersedia
    try {
      const supabase = await createClient();
      await supabase
        .from('events')
        .update({
          is_live_enabled: mode === 'open' ? true : mode === 'closed' ? false : null,
        })
        .eq('id', eventId);
    } catch {
      // Abaikan jika kolom is_live_enabled belum ada di schema
    }

    return NextResponse.json({
      success: true,
      eventId,
      mode,
      message: `Status live scoreboard berhasil diubah menjadi: ${mode.toUpperCase()}`,
    });
  } catch (error) {
    console.error('Error in /api/scoreboard/live-status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
