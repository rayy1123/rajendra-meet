import { NextResponse, NextRequest } from 'next/server';
import { saveEventSettings } from '@/lib/data/event-settings-server';
import { createClient } from '@/lib/supabase/server';
import { verifyApiRole } from '@/lib/auth';

const LOGO_ADMIN_ROLES = ['super_admin', 'admin', 'event_admin', 'admin_kejuaraan'] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyApiRole([...LOGO_ADMIN_ROLES]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const { logo_url } = await request.json();

  // 1. Sync to event settings store
  saveEventSettings(id, { logo_url } as any);

  // 2. Sync to Supabase events table
  try {
    const supabase = await createClient();
    const { error } = await supabase
      .from('events')
      .update({ logo_url })
      .eq('id', id);
    if (error) {
      console.warn('Supabase logo_url update warning:', error.message);
    }
  } catch (e) {
    console.warn('Supabase update exception:', e);
  }

  return NextResponse.json({ success: true, logo_url });
}
