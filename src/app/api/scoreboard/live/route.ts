import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getCache, setCache } from '@/lib/cache/redis';
import { checkRateLimit } from '@/lib/cache/rate-limit';
import { rankResults, type RankableResult, type ResultStatus } from '@/services/ranking';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('eventId');
  const compEventId = searchParams.get('compEventId');

  if (!eventId) {
    return NextResponse.json({ error: 'eventId parameter is required' }, { status: 400 });
  }

  // 1. Rate Limiting check
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : '127.0.0.1';
  const rateLimit = await checkRateLimit(`scoreboard:${ip}`, 60);

  const headers = {
    'X-RateLimit-Limit': String(rateLimit.limit),
    'X-RateLimit-Remaining': String(rateLimit.remaining),
    'X-RateLimit-Reset': String(rateLimit.reset),
  };

  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Terlalu banyak permintaan (Rate limit exceeded). Mohon tunggu beberapa saat.' },
      {
        status: 429,
        headers: {
          ...headers,
          'Retry-After': String(Math.max(1, rateLimit.reset - Math.floor(Date.now() / 1000))),
        },
      }
    );
  }

  // 2. Check Cache
  const cacheKey = `scms:scoreboard:${eventId}:${compEventId || 'all'}`;
  const cachedData = await getCache(cacheKey);

  if (cachedData) {
    return NextResponse.json(cachedData, {
      status: 200,
      headers: {
        ...headers,
        'X-Cache': 'HIT',
      },
    });
  }

  // 3. Query Database
  try {
    const supabase = await createClient();

    let query = supabase
      .from('heats')
      .select(`
        id,
        heat_number,
        competition_event_id,
        competition_events (
          id,
          name,
          stroke,
          distance_meters,
          gender,
          grade_level,
          class_name
        ),
        heat_assignments (
          id,
          lane_number,
          registrations (
            id,
            seed_time_ms,
            athletes (
              id,
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
      .order('heat_number', { ascending: true });

    if (compEventId) {
      query = query.eq('competition_event_id', compEventId);
    } else {
      // Find all heats for this event
      const { data: eventCompIds } = await supabase
        .from('competition_events')
        .select('id')
        .eq('event_id', eventId);

      const ids = (eventCompIds || []).map((c) => c.id);
      if (ids.length > 0) {
        query = query.in('competition_event_id', ids);
      } else {
        return NextResponse.json({ heats: [], ranked: [], timestamp: Date.now() }, { headers });
      }
    }

    const { data: rawHeats, error } = await query;

    if (error) {
      console.error('[API Scoreboard] DB Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500, headers });
    }

    // Process & Rank Results
    interface RawItem {
      id: string;
      heat_number: number;
      lane_number: number;
      registration_id: string | null;
      seed_time_ms: number | null;
      athlete_name: string | null;
      athlete_number: string | null;
      school_name: string | null;
      result_id: string | null;
      time_ms: number | null;
      status: string | null;
    }

    interface AssignmentData {
      id: string;
      lane_number: number;
      registrations?: {
        id?: string | null;
        seed_time_ms?: number | null;
        athletes?: {
          id?: string | null;
          full_name?: string | null;
          athlete_number?: string | null;
          schools?: { name?: string | null } | null;
        } | null;
      } | null;
      results?: { id?: string | null; time_ms?: number | null; status?: string | null }[] | null;
    }

    const flatItems: RawItem[] = [];

    (rawHeats || []).forEach((heat) => {
      const assignments = (heat.heat_assignments || []) as unknown as AssignmentData[];
      assignments.forEach((assign) => {
        const reg = assign.registrations;
        const athlete = reg?.athletes;
        const result = assign.results?.[0];

        flatItems.push({
          id: `${heat.id}-${assign.lane_number}`,
          heat_number: heat.heat_number,
          lane_number: assign.lane_number,
          registration_id: reg?.id || null,
          seed_time_ms: reg?.seed_time_ms ?? null,
          athlete_name: athlete?.full_name || null,
          athlete_number: athlete?.athlete_number || null,
          school_name: athlete?.schools?.name || null,
          result_id: result?.id || null,
          time_ms: result?.time_ms ?? null,
          status: result?.status ?? null,
        });
      });
    });

    // Compute rankings
    const rankInput: RankableResult[] = flatItems.map((item) => {
      const raw = (item.status || 'finished').toLowerCase();
      const isFinished = raw === 'finished';
      return {
        registration_id: item.registration_id || item.id,
        time_ms: isFinished ? item.time_ms : null,
        status: isFinished ? 'finished' : (raw as ResultStatus),
      };
    });

    const ranked = rankResults(rankInput);
    const rankMap = new Map<string, number | null>();
    ranked.forEach((r) => rankMap.set(r.registration_id, r.rank));

    const enrichedItems = flatItems.map((item) => ({
      ...item,
      rank: rankMap.get(item.registration_id || item.id) ?? null,
    }));

    const responsePayload = {
      items: enrichedItems,
      ranked,
      timestamp: Date.now(),
    };

    // Cache with TTL of 10 seconds for high responsiveness while protecting Supabase DB
    await setCache(cacheKey, responsePayload, 10);

    return NextResponse.json(responsePayload, {
      status: 200,
      headers: {
        ...headers,
        'X-Cache': 'MISS',
      },
    });
  } catch (err: unknown) {
    console.error('[API Scoreboard] Internal Error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500, headers });
  }
}
