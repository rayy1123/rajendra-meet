import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('schools')
      .select('id, name')
      .order('name', { ascending: true });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    return new Response(JSON.stringify(data ?? []), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
