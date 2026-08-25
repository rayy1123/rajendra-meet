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

function num(v: FormDataEntryValue | null): number | null {
  if (v === null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
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
  const parentPhone = (formData.get('parent_phone') as string)?.trim() || '';
  const medicalNotes = (formData.get('medical_notes') as string)?.trim() || '';
  const heightCm = num(formData.get('height_cm'));
  const weightKg = num(formData.get('weight_kg'));

  if (!fullName) return { ok: false, error: 'Nama atlet wajib diisi.' };
  if (!birthDate) return { ok: false, error: 'Tanggal lahir wajib diisi.' };

  const payload = {
    full_name: fullName,
    gender,
    birth_date: birthDate,
    grade_level: gradeLevel,
    class_name: className,
    school_id: schoolId ? schoolId : null,
    parent_phone: parentPhone,
    medical_notes: medicalNotes,
    height_cm: heightCm,
    weight_kg: weightKg,
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

export async function bulkDeleteAthletes(formData: FormData): Promise<AthleteFormState> {
  const { supabase, user } = await requireUser();
  const ids = (formData.get('ids') as string)?.split(',')?.filter(Boolean) ?? [];
  if (ids.length === 0) return { ok: false, error: 'Tidak ada atlet dipilih.' };

  // Hanya atlet milik sendiri (RLS membackup).
  const { error } = await supabase
    .from('athletes')
    .delete()
    .in('id', ids)
    .eq('owner_id', user.id);

  if (error) return { ok: false, error: error.message };
  revalidatePath('/atlet-saya');
  return { ok: true };
}

export async function duplicateAthlete(formData: FormData): Promise<AthleteFormState> {
  const { supabase, user } = await requireUser();
  const id = formData.get('id') as string;
  if (!id) return { ok: false, error: 'ID tidak valid.' };

  // Ambil atlet milik sendiri, lalu buat salinan dengan nomor baru.
  const { data: src, error: e1 } = await supabase
    .from('athletes')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .single();
  if (e1 || !src) return { ok: false, error: e1?.message ?? 'Atlet tidak ditemukan.' };

  const { error: e2 } = await supabase.from('athletes').insert({
    event_id: src.event_id,
    athlete_number: genAthleteNumber(),
    full_name: src.full_name + ' (copy)',
    gender: src.gender,
    birth_date: src.birth_date,
    grade_level: src.grade_level,
    class_name: src.class_name,
    age_group: src.age_group,
    school_id: src.school_id,
    photo_url: src.photo_url,
    height_cm: src.height_cm,
    weight_kg: src.weight_kg,
    parent_phone: src.parent_phone,
    medical_notes: src.medical_notes,
    owner_id: user.id,
  });
  if (e2) return { ok: false, error: e2.message };
  revalidatePath('/atlet-saya');
  return { ok: true };
}

export async function updateAthletePhoto(formData: FormData): Promise<AthleteFormState> {
  const { supabase, user } = await requireUser();
  const id = formData.get('id') as string;
  const url = (formData.get('photo_url') as string)?.trim();
  if (!id) return { ok: false, error: 'ID tidak valid.' };
  if (!url) return { ok: false, error: 'URL foto tidak valid.' };

  const { error } = await supabase
    .from('athletes')
    .update({ photo_url: url })
    .eq('id', id)
    .eq('owner_id', user.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath('/atlet-saya');
  revalidatePath(`/atlet-saya/${id}`);
  return { ok: true };
}
