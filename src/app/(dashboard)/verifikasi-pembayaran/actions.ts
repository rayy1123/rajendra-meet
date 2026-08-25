'use server';

import { requireRole } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface ActionResult {
  ok: boolean;
  error?: string;
}

export async function updatePaymentStatus(
  formData: FormData,
): Promise<ActionResult> {
  const { supabase, user } = await requireRole(['super_admin', 'event_admin', 'operator']);

  const id = formData.get('id')?.toString();
  const status = formData.get('status')?.toString(); // approved | rejected

  if (!id || (status !== 'approved' && status !== 'rejected')) {
    return { ok: false, error: 'Data tidak valid.' };
  }

  const { error } = await supabase
    .from('payment_verifications')
    .update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };

  // Catat ke audit log (tabel sudah ada di migrasi 0020).
  await supabase.from('audit_log').insert({
    actor_id: user.id,
    actor_email: user.email,
    action: 'payment_verification',
    entity: `payment_verifications ${id}`,
    detail: `Status diubah menjadi ${status}`,
  });

  revalidatePath('/verifikasi-pembayaran');
  return { ok: true };
}
