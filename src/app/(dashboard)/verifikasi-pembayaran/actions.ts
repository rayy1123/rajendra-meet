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
  const rawStatus = formData.get('status')?.toString(); // approved | verified | rejected

  if (!id || (!['approved', 'verified', 'rejected'].includes(rawStatus || ''))) {
    return { ok: false, error: 'Data tidak valid.' };
  }

  // Database PostgreSQL enum payment_status adalah ('pending', 'verified', 'rejected')
  const dbStatus = rawStatus === 'approved' ? 'verified' : rawStatus;

  const { error } = await supabase
    .from('payment_verifications')
    .update({ status: dbStatus, reviewed_at: new Date().toISOString(), reviewed_by: user.id })
    .eq('id', id);

  if (error) return { ok: false, error: error.message };

  // Catat ke audit log
  try {
    await supabase.from('audit_log').insert({
      actor_id: user.id,
      actor_email: user.email,
      action: 'payment_verification',
      entity: `payment_verifications ${id}`,
      detail: `Status diubah menjadi ${dbStatus}`,
    });
  } catch (auditErr) {
    console.warn('Audit log write error:', auditErr);
  }

  revalidatePath('/verifikasi-pembayaran');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard-viewer');
  revalidatePath('/pendaftaran-saya');
  revalidatePath('/tagihan');
  return { ok: true };
}
