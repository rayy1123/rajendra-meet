import { NextRequest, NextResponse } from 'next/server';
import {
  getEventLiveConfig,
  saveEventLiveConfig,
  saveEventResultsConfig,
  getAllLiveConfigs,
} from '@/lib/data/live-scoreboard-server';
import {
  LiveScoreboardMode,
  ResultsVisibilityMode,
} from '@/lib/data/live-scoreboard-settings';
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
    const { eventId, mode, resultsMode } = body as {
      eventId?: string;
      mode?: LiveScoreboardMode;
      resultsMode?: ResultsVisibilityMode;
    };

    if (!eventId) {
      return NextResponse.json({ error: 'Parameter eventId harus diisi' }, { status: 400 });
    }

    if (!mode && !resultsMode) {
      return NextResponse.json({ error: 'Parameter mode atau resultsMode harus diisi' }, { status: 400 });
    }

    // 1. Update live scoreboard mode jika dikirim
    if (mode && ['auto', 'open', 'closed'].includes(mode)) {
      saveEventLiveConfig(eventId, mode);
    }

    // 2. Update results visibility mode jika dikirim
    if (resultsMode && ['auto', 'open', 'closed'].includes(resultsMode)) {
      saveEventResultsConfig(eventId, resultsMode);
    }

    // Upayakan sync ke database Supabase jika kolom terkait tersedia
    try {
      const supabase = await createClient();
      const updateData: Record<string, any> = {};
      if (mode) {
        updateData.is_live_enabled = mode === 'open' ? true : mode === 'closed' ? false : null;
      }
      if (resultsMode) {
        updateData.is_results_published = resultsMode === 'open' ? true : resultsMode === 'closed' ? false : null;
      }
      if (Object.keys(updateData).length > 0) {
        await supabase
          .from('events')
          .update(updateData)
          .eq('id', eventId);
      }
    } catch {
      // Abaikan jika kolom belum ada di schema
    }

    const updatedConfig = getEventLiveConfig(eventId);

    return NextResponse.json({
      success: true,
      eventId,
      config: updatedConfig,
      message: 'Pengaturan status berhasil disimpan.',
    });
  } catch (error) {
    console.error('Error in /api/scoreboard/live-status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
