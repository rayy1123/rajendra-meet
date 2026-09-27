import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isRedisAvailable, getCache } from '@/lib/cache/redis';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startedAt = Date.now();
  const checks: Record<string, 'ok' | 'degraded' | 'error'> = {
    app: 'ok',
    database: 'ok',
    cache: 'ok',
  };

  // 1. Check Database connection
  try {
    const supabase = await createClient();
    const { error } = await supabase.from('events').select('id').limit(1);
    if (error) {
      checks.database = 'error';
    }
  } catch {
    checks.database = 'error';
  }

  // 2. Check Cache
  try {
    await getCache('healthcheck:ping');
    checks.cache = isRedisAvailable() ? 'ok' : 'degraded';
  } catch {
    checks.cache = 'error';
  }

  const isHealthy = checks.app === 'ok' && checks.database === 'ok';
  const statusCode = isHealthy ? 200 : 503;

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      durationMs: Date.now() - startedAt,
      checks,
      cacheDriver: isRedisAvailable() ? 'redis' : 'in-memory-lru',
    },
    { status: statusCode }
  );
}
