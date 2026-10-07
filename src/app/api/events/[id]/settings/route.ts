import { NextResponse, NextRequest } from 'next/server';
import { getEventSettings, saveEventSettings } from '@/lib/data/event-settings-server';
import { createClient } from '@/lib/supabase/server';
import { verifyApiRole } from '@/lib/auth';

const EVENT_SETTINGS_ROLES = ['super_admin', 'admin', 'event_admin', 'admin_kejuaraan'] as const;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let settings = getEventSettings(id);

  // Jika di Vercel atau store lokal kosong, coba baca dari Supabase events.description
  try {
    const supabase = await createClient();
    const { data: ev } = await supabase
      .from('events')
      .select('id, description')
      .eq('id', id)
      .maybeSingle();

    if (ev?.description) {
      try {
        const parsed = JSON.parse(ev.description);
        if (parsed && typeof parsed === 'object') {
          settings = {
            ...settings,
            ...parsed,
            eventId: id,
          };
        }
      } catch {
        // description bukan JSON
      }
    }
  } catch (err) {
    console.warn('[EventSettings GET] Supabase read fallback:', err);
  }

  return NextResponse.json({ success: true, data: settings });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyApiRole([...EVENT_SETTINGS_ROLES]);
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { id } = await params;
  const body = await request.json();

  const updated = saveEventSettings(id, body);

  // Simpan secara persisten ke Supabase events.description agar permanen di Vercel
  try {
    const supabase = await createClient();
    await supabase
      .from('events')
      .update({
        description: JSON.stringify(updated),
      })
      .eq('id', id);
  } catch (err) {
    console.warn('[EventSettings POST] Supabase update warning:', err);
  }

  return NextResponse.json({ success: true, data: updated });
}
