'use server';

import { requireUser } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface AthleteFormState {
  ok: boolean;
  error?: string;
}

function genAthleteNumber(): string {
  return 'ATH-' + Math.random().toString(36).slice(2, 8).toUpperCase();
}

function parseGender(v: FormDataEntryValue | null): 'male' | 'female' {
  return v === 'female' ? 'female' : 'male';
}

export async function saveAthlete(formData: FormData): Promise<AthleteFormState> {
  const { supabase, user } = await requireUser();

  const id = (formData.get('id') as string) || '';
  const fullName = (formData.get('full_name') as string)?.trim();
  const gender = parseGender(formData.get('gender'));
  const birthDate = formData.get('birth_date') as string;
  const gradeLevel = (formData.get('grade_level') as string)?.trim() || '';
  const className = (formData.get('class_name') as string)?.trim() || '';
  const schoolId = (formData.get('school_id') as string) || '';

  if (!fullName) return { ok: false, error: 'Nama atlet wajib diisi.' };
  if (!birthDate) return { ok: false, error: 'Tanggal lahir wajib diisi.' };

  const payload = {
    full_name: fullName,
    gender,
    birth_date: birthDate,
    grade_level: gradeLevel,
    class_name: className,
    school_id: schoolId ? schoolId : null,
    owner_id: user.id,
  };

  let result;
  if (id) {
    // Update hanya boleh untuk atlet milik sendiri (RLS membackup).
    result = await supabase
      .from('athletes')
      .update(payload)
      .eq('id', id)
      .eq('owner_id', user.id);
  } else {
    result = await supabase
      .from('athletes')
      .insert({ ...payload, athlete_number: genAthleteNumber() });
  }

  if (result.error) return { ok: false, error: result.error.message };
  revalidatePath('/atlet-saya');
  return { ok: true };
}

export async function deleteAthlete(formData: FormData): Promise<AthleteFormState> {
  const { supabase, user } = await requireUser();
  const id = formData.get('id') as string;
  if (!id) return { ok: false, error: 'ID tidak valid.' };

  // Hanya boleh hapus atlet milik sendiri (RLS membackup).
  const { error } = await supabase
    .from('athletes')
    .delete()
    .eq('id', id)
    .eq('owner_id', user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/atlet-saya');
  return { ok: true };
}
