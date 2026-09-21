import { NextRequest, NextResponse } from 'next/server';
import { getServerShowcases, saveServerShowcases } from '@/lib/data/landing-showcases-server';
import { ShowcaseItem, getDefaultsByType } from '@/lib/data/landing-showcases';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') as ShowcaseItem['type'] | null;

  if (!type) {
    return NextResponse.json({ error: 'Missing type parameter' }, { status: 400 });
  }

  const items = getServerShowcases(type);
  return NextResponse.json({ success: true, items });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, items } = body;

    if (!type || !Array.isArray(items)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const saved = saveServerShowcases(type, items);
    if (!saved) {
      return NextResponse.json({ error: 'Failed to write data' }, { status: 500 });
    }

    return NextResponse.json({ success: true, count: items.length });
  } catch (error) {
    console.error('API /api/showcases error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
