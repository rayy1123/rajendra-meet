import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');

    if (!schoolId || typeof schoolId !== 'string') {
      return new Response(JSON.stringify({ error: 'Parameter schoolId wajib diisi.' }), { status: 400 });
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .eq('school_id', schoolId)
      .order('full_name', { ascending: true });
    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
    return new Response(JSON.stringify(data ?? []), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Terjadi kesalahan sistem.';
    return new Response(JSON.stringify({ error: msg }), { status: 500 });
  }
}
