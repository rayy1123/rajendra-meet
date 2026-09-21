'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ActionResult<T = unknown> {
  ok: boolean;
  error?: string;
  data?: T;
}

export interface CompEventPayload {
  name: string;
  stroke: string;
  distance_meters: number;
  gender: 'male' | 'female' | 'mixed';
  grade_level?: string | null;
  class_name?: string | null;
  order_no: number;
  session_no?: number | null;
}

// 1. Tambah 1 nomor lomba baru
export async function createCompEventAction(
  eventId: string,
  payload: CompEventPayload,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Sesi login telah berakhir. Silakan login kembali.' };
  }

  const { data, error } = await supabase
    .from('competition_events')
    .insert({
      event_id: eventId,
      name: payload.name.trim(),
      stroke: payload.stroke,
      distance_meters: Number(payload.distance_meters),
      gender: payload.gender,
      grade_level: payload.grade_level?.trim() || null,
      class_name: payload.class_name?.trim() || payload.grade_level?.trim() || null,
      order_no: Number(payload.order_no) || 1,
      session_no: Number(payload.session_no) || 1,
    })
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/heats`);
  revalidatePath(`/buku-acara`);
  return { ok: true, data };
}

// 2. Update nomor lomba yang sudah ada
export async function updateCompEventAction(
  eventId: string,
  compEventId: string,
  payload: Partial<CompEventPayload>,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Sesi login telah berakhir. Silakan login kembali.' };
  }

  const updateData: Record<string, unknown> = {};
  if (payload.name !== undefined) updateData.name = payload.name.trim();
  if (payload.stroke !== undefined) updateData.stroke = payload.stroke;
  if (payload.distance_meters !== undefined) updateData.distance_meters = Number(payload.distance_meters);
  if (payload.gender !== undefined) updateData.gender = payload.gender;
  if (payload.grade_level !== undefined) updateData.grade_level = payload.grade_level?.trim() || null;
  if (payload.class_name !== undefined) updateData.class_name = payload.class_name?.trim() || null;
  if (payload.order_no !== undefined) updateData.order_no = Number(payload.order_no);
  if (payload.session_no !== undefined) updateData.session_no = Number(payload.session_no);

  const { data, error } = await supabase
    .from('competition_events')
    .update(updateData)
    .eq('id', compEventId)
    .eq('event_id', eventId)
    .select()
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/heats`);
  revalidatePath(`/buku-acara`);
  return { ok: true, data };
}

// 3. Hapus nomor lomba
export async function deleteCompEventAction(
  eventId: string,
  compEventId: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Sesi login telah berakhir. Silakan login kembali.' };
  }

  const { error } = await supabase
    .from('competition_events')
    .delete()
    .eq('id', compEventId)
    .eq('event_id', eventId);

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/heats`);
  revalidatePath(`/buku-acara`);
  return { ok: true };
}

// 4. Batch Generate / Buat Banyak Nomor Acara Sekaligus (Contoh: 4 acara 25m Gaya Dada)
export async function batchCreateCompEventsAction(
  eventId: string,
  items: CompEventPayload[],
): Promise<ActionResult<{ count: number }>> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Sesi login telah berakhir. Silakan login kembali.' };
  }

  if (!items || items.length === 0) {
    return { ok: false, error: 'Daftar nomor lomba kosong.' };
  }

  const rows = items.map((it) => ({
    event_id: eventId,
    name: it.name.trim(),
    stroke: it.stroke,
    distance_meters: Number(it.distance_meters),
    gender: it.gender,
    grade_level: it.grade_level?.trim() || null,
    class_name: it.class_name?.trim() || it.grade_level?.trim() || null,
    order_no: Number(it.order_no) || 1,
    session_no: Number(it.session_no) || 1,
  }));

  const { data, error } = await supabase
    .from('competition_events')
    .insert(rows)
    .select();

  if (error) {
    return { ok: false, error: error.message };
  }

  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/heats`);
  revalidatePath(`/buku-acara`);
  return { ok: true, data: { count: data?.length || 0 } };
}

// 5. Urutkan Ulang Nomor Acara (Reorder order_no 1..N)
export async function reorderCompEventsAction(
  eventId: string,
  orderedIds: string[],
): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { ok: false, error: 'Sesi login telah berakhir. Silakan login kembali.' };
  }

  try {
    const promises = orderedIds.map((id, index) =>
      supabase
        .from('competition_events')
        .update({ order_no: index + 1 })
        .eq('id', id)
        .eq('event_id', eventId),
    );

    await Promise.all(promises);

    revalidatePath(`/events/${eventId}`);
    revalidatePath(`/heats`);
    revalidatePath(`/buku-acara`);
    return { ok: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Gagal mengurutkan nomor acara.';
    return { ok: false, error: errorMsg };
  }
}
