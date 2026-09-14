import { NextRequest, NextResponse } from 'next/server';
import { invalidateCache } from '@/lib/cache/redis';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { eventId, compEventId } = body;

    if (eventId) {
      if (compEventId) {
        await invalidateCache(`scms:scoreboard:${eventId}:${compEventId}`);
      } else {
        await invalidateCache(`scms:scoreboard:${eventId}:*`);
      }
    } else {
      // Invalidate all scoreboards
      await invalidateCache('scms:scoreboard:*');
    }

    return NextResponse.json({ success: true, message: 'Cache invalidated successfully' });
  } catch (err: unknown) {
    console.error('[Revalidate API Error]:', err);
    const message = err instanceof Error ? err.message : 'Failed to revalidate cache';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
