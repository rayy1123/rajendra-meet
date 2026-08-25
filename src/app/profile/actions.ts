'use server';

import { requireUser } from '@/lib/auth';
import { revalidatePath } from 'next/cache';

export interface ProfileState {
  ok: boolean;
  error?: string;
}

export async function updateProfileName(formData: FormData): Promise<ProfileState> {
  const { supabase, user } = await requireUser();
  const fullName = (formData.get('full_name') as string)?.trim();
  if (!fullName) return { ok: false, error: 'Nama wajib diisi.' };

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName })
    .eq('id', user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/profile');
  return { ok: true };
}

export async function updatePassword(formData: FormData): Promise<ProfileState> {
  const { supabase } = await requireUser();
  const pw = (formData.get('password') as string) ?? '';
  const confirm = (formData.get('confirm') as string) ?? '';
  if (pw.length < 6) return { ok: false, error: 'Password minimal 6 karakter.' };
  if (pw !== confirm) return { ok: false, error: 'Konfirmasi password tidak cocok.' };

  const { error } = await supabase.auth.updateUser({ password: pw });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateProfilePhoto(formData: FormData): Promise<ProfileState> {
  const { supabase, user } = await requireUser();
  const url = (formData.get('avatar_url') as string)?.trim();
  if (!url) return { ok: false, error: 'URL foto tidak valid.' };

  const { error } = await supabase
    .from('profiles')
    .update({ avatar_url: url })
    .eq('id', user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/profile');
  return { ok: true };
}
