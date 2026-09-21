import { NextResponse, NextRequest } from 'next/server';
import { getEventSettings, saveEventSettings } from '@/lib/data/event-settings-server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const settings = getEventSettings(id);
  return NextResponse.json({ success: true, data: settings });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  
  const updated = saveEventSettings(id, body);
  return NextResponse.json({ success: true, data: updated });
}
