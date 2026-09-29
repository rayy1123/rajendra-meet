"use server";

import { createClient } from "@/lib/supabase/server";
import { getKuCode } from "@/lib/age-category";
import { revalidatePath } from "next/cache";

export interface ActionResult {
  ok: boolean;
  error?: string;
}

/**
 * Daftarkan atlet ke satu/multi nomor lomba, lalu buat baris verifikasi pembayaran
 * berstatus 'pending' untuk tiap nomor. Menghubungkan registrasi ke user login (registrant_id).
 */
export async function submitRegistrationAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "Sesi berakhir, silakan login kembali." };

  const eventId = formData.get("eventId")?.toString();
  const athleteId = formData.get("athleteId")?.toString();
  const competitionEventIds = formData
    .getAll("competitionEventId")
    .map((c) => c.toString())
    .filter(Boolean);
  const proofUrl = formData.get("proofUrl")?.toString() || null;
  const amountDue = Number(formData.get("amountDue") || "0") || 0;

  if (!eventId || !athleteId || competitionEventIds.length === 0) {
    return { ok: false, error: "Data pendaftaran tidak lengkap." };
  }

  // Validasi atlet ada DAN (user adalah panitia OPERATOR+ ATAU atlet ini
  // sudah terikat user lewat registrasi miliknya). Ini cegah viewer
  // mendaftarkan atlet orang lain.
  const { data: athlete } = await supabase
    .from("athletes")
    .select("id, event_id, full_name, gender, birth_date, age_group, grade_level")
    .eq("id", athleteId)
    .maybeSingle();

  if (!athlete) return { ok: false, error: "Atlet tidak valid." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  const role = profile?.role;
  const isPanitia = role === "super_admin" || role === "event_admin" || role === "operator";

  if (!isPanitia) {
    const { data: owned } = await supabase
      .from("registrations")
      .select("id")
      .eq("athlete_id", athleteId)
      .eq("registrant_id", user.id)
      .maybeSingle();
    if (!owned) {
      return { ok: false, error: "Anda tidak berwenang mendaftarkan atlet ini." };
    }
  }

  try {
    // Saring ketat nomor lomba di server: pastikan kualifikasi KU & gender valid 100%
    const { data: compEvents } = await supabase
      .from("competition_events")
      .select("id, name, stroke, gender, age_group, grade_level, class_name")
      .in("id", competitionEventIds);

    const { isEventEligibleForAthlete } = await import('@/lib/age-category');
    const validCompEventIds = (compEvents || [])
      .filter((ce) => isEventEligibleForAthlete(athlete, ce))
      .map((ce) => ce.id);

    if (validCompEventIds.length === 0) {
      return {
        ok: false,
        error: "Nomor lomba yang dipilih tidak memenuhi kualifikasi kategori umur (KU) atau gender atlet.",
      };
    }

    // Ambil konfigurasi biaya & kode unik event
    let eventData: any = null;
    const { data: fullEvtData } = await supabase
      .from("events")
      .select("id, fee_per_event, use_unique_code, unique_code_mode, unique_code_fixed, unique_code_min, unique_code_max")
      .eq("id", eventId)
      .maybeSingle();

    if (fullEvtData && (fullEvtData as any).fee_per_event !== undefined) {
      eventData = fullEvtData;
    } else {
      const { getEventSettings } = await import('@/lib/data/event-settings-server');
      eventData = getEventSettings(eventId);
    }

    const { count: regCount } = await supabase
      .from("registrations")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId);

    // Hitung kode unik per pendaftaran berdasarkan setting event
    let uniqueCode = 0;
    if (eventData?.use_unique_code !== false) {
      const mode = eventData?.unique_code_mode || 'random_3_digit';
      if (mode === 'fixed') {
        uniqueCode = Number(eventData?.unique_code_fixed) || 0;
      } else if (mode === 'sequential') {
        const seq = ((regCount || 0) + 1) % 1000;
        uniqueCode = seq === 0 ? 1 : seq;
      } else if (mode === 'custom_range') {
        const min = Number(eventData?.unique_code_min) || 100;
        const max = Number(eventData?.unique_code_max) || 999;
        uniqueCode = Math.floor(Math.random() * (max - min + 1)) + min;
      } else {
        // default 'random_3_digit': 100 s/d 999
        uniqueCode = Math.floor(Math.random() * 900) + 100;
      }
    }

    const feePerEvent = Number(eventData?.fee_per_event) || 50000;
    const computedTotal = (feePerEvent * validCompEventIds.length) + uniqueCode;
    const finalAmountDue = amountDue > 0 ? amountDue : computedTotal;

    for (const ceId of validCompEventIds) {
      // Cegah duplikat (unique athlete_id + competition_event_id)
      const { data: existing } = await supabase
        .from("registrations")
        .select("id")
        .eq("athlete_id", athleteId)
        .eq("competition_event_id", ceId)
        .maybeSingle();

      if (existing) continue;

      const { data: reg, error: regErr } = await supabase
        .from("registrations")
        .insert({
          event_id: eventId,
          athlete_id: athleteId,
          competition_event_id: ceId,
          registrant_id: user.id,
        })
        .select("id")
        .single();

      if (regErr || !reg) {
        return { ok: false, error: regErr?.message || "Gagal menyimpan pendaftaran." };
      }

      let { error: payErr } = await supabase.from("payment_verifications").insert({
        registration_id: reg.id,
        status: "pending",
        amount_due: finalAmountDue,
        base_amount: feePerEvent,
        unique_code: uniqueCode,
        proof_url: proofUrl,
      });

      if (payErr && (payErr.message?.includes('column') || payErr.message?.includes('schema cache'))) {
        const { error: retryPayErr } = await supabase.from("payment_verifications").insert({
          registration_id: reg.id,
          status: "pending",
          amount_due: finalAmountDue,
          proof_url: proofUrl,
        });
        payErr = retryPayErr;
      }

      if (payErr) {
        return { ok: false, error: payErr.message || "Gagal membuat verifikasi pembayaran." };
      }
    }
    revalidatePath('/pendaftaran-saya');
    revalidatePath('/dashboard-viewer');
    revalidatePath('/verifikasi-pembayaran');
    revalidatePath('/tagihan');
    return { ok: true };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat menyimpan pendaftaran." };
  }
}

/** Pilih atlet tersimpan (milik viewer) lalu daftarkan ke nomor lomba, ATAU
 *  buat atlet baru milik viewer lalu daftarkan. Atlet SELALU terikat
 *  owner_id = user.id agar muncul di "Atlet Saya" dan diproteksi RLS. */
export async function createAthleteAndRegisterAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: 'Sesi berakhir, silakan login kembali.' };

  const eventId = formData.get('eventId')?.toString();
  const athleteId = formData.get('athleteId')?.toString() || '';
  const fullName = formData.get('fullName')?.toString()?.trim();
  const birthDate = formData.get('birthDate')?.toString();
  const gender = formData.get('gender')?.toString();
  const gradeLevel = formData.get('gradeLevel')?.toString() || '';
  const classname = formData.get('className')?.toString() || '';
  const schoolId = formData.get('schoolId')?.toString()?.trim() || '';
  const schoolName = formData.get('schoolName')?.toString()?.trim() || '';
  const competitionEventIds = formData
    .getAll('competitionEventId')
    .map((c) => c.toString())
    .filter(Boolean);
  const proofUrl = formData.get('proofUrl')?.toString() || null;
  const amountDue = Number(formData.get('amountDue') || '0') || 0;

  if (!eventId || competitionEventIds.length === 0) {
    return { ok: false, error: 'Data pendaftaran tidak lengkap.' };
  }

  // Resolve ID sekolah / klub agar atlet terhubung dan tidak otomatis independen
  let resolvedSchoolId: string | null = schoolId || null;
  if (!resolvedSchoolId && schoolName) {
    try {
      const { saveSchoolServer } = await import('@/lib/data/schools-server');
      const sch = await saveSchoolServer({ name: schoolName });
      resolvedSchoolId = sch.id;
    } catch (err) {
      console.warn('Auto resolve school error:', err);
    }
  }

  let finalAthleteId = athleteId;

  if (!finalAthleteId) {
    // Mode baru: validasi & buat atlet milik user.
    if (!fullName || !birthDate || !gender) {
      return { ok: false, error: 'Data atlet tidak lengkap.' };
    }
    const { data: athlete, error: athErr } = await supabase
      .from('athletes')
      .insert({
        event_id: eventId,
        athlete_number: `REG-${Date.now().toString(36)}`,
        full_name: fullName,
        gender,
        birth_date: birthDate,
        grade_level: gradeLevel,
        class_name: classname,
        age_group: getKuCode(birthDate),
        school_id: resolvedSchoolId,
        owner_id: user.id,
      })
      .select('id')
      .single();

    if (athErr || !athlete) {
      return { ok: false, error: athErr?.message || 'Gagal menyimpan atlet.' };
    }
    finalAthleteId = athlete.id;
  } else {
    // Mode existing: jika bukan panitia, pastikan atlet ini milik user (owner_id) atau sudah
    // pernah dia daftarkan. Panitia berwenang mendaftarkan atlet mana pun secara manual.
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const role = profile?.role;
    const isPanitia = role === 'super_admin' || role === 'event_admin' || role === 'operator';

    const { data: owned } = await supabase
      .from('athletes')
      .select('id, school_id')
      .eq('id', finalAthleteId)
      .eq('owner_id', user.id)
      .maybeSingle();

    if (!isPanitia && !owned) {
      const { data: regOwned } = await supabase
        .from('registrations')
        .select('id')
        .eq('athlete_id', finalAthleteId)
        .eq('registrant_id', user.id)
        .maybeSingle();
      if (!regOwned) {
        return { ok: false, error: 'Anda tidak berwenang mendaftarkan atlet ini.' };
      }
    }

    // Jika atlet lama belum terhubung ke klub dan sekarang dipilih klub baru, update asosiasinya
    if (resolvedSchoolId && (!owned?.school_id || owned.school_id !== resolvedSchoolId)) {
      await supabase
        .from('athletes')
        .update({ school_id: resolvedSchoolId })
        .eq('id', finalAthleteId);
    }
  }

  try {
    // Saring ketat nomor lomba di server: pastikan kualifikasi KU & gender valid 100%
    let athleteObj: {
      birth_date?: string | Date | null;
      gender?: string | null;
      age_group?: string | null;
      grade_level?: string | null;
    } = {};

    if (finalAthleteId) {
      const { data: athRecord } = await supabase
        .from('athletes')
        .select('full_name, gender, birth_date, grade_level, age_group')
        .eq('id', finalAthleteId)
        .maybeSingle();
      if (athRecord) {
        athleteObj = athRecord;
      }
    }
    if (!athleteObj.birth_date && birthDate) {
      athleteObj = {
        gender: gender || 'male',
        birth_date: birthDate,
        grade_level: gradeLevel,
        age_group: '',
      };
    }

    const { data: compEvents } = await supabase
      .from('competition_events')
      .select('id, name, stroke, gender, age_group, grade_level, class_name')
      .in('id', competitionEventIds);

    const { isEventEligibleForAthlete } = await import('@/lib/age-category');
    const validCompEventIds = (compEvents || [])
      .filter((ce) => isEventEligibleForAthlete(athleteObj, ce))
      .map((ce) => ce.id);

    if (validCompEventIds.length === 0) {
      return {
        ok: false,
        error: 'Nomor lomba yang dipilih tidak memenuhi kualifikasi kategori umur (KU) atau gender atlet.',
      };
    }

    // Ambil konfigurasi biaya & kode unik event
    let eventData: any = null;
    const { data: fullEvtData } = await supabase
      .from('events')
      .select('id, fee_per_event, use_unique_code, unique_code_mode, unique_code_fixed, unique_code_min, unique_code_max')
      .eq('id', eventId)
      .maybeSingle();

    if (fullEvtData && (fullEvtData as any).fee_per_event !== undefined) {
      eventData = fullEvtData;
    } else {
      const { getEventSettings } = await import('@/lib/data/event-settings-server');
      eventData = getEventSettings(eventId);
    }

    const { count: regCount } = await supabase
      .from('registrations')
      .select('*', { count: 'exact', head: true })
      .eq('event_id', eventId);

    let uniqueCode = 0;
    if (eventData?.use_unique_code !== false) {
      const mode = eventData?.unique_code_mode || 'random_3_digit';
      if (mode === 'fixed') {
        uniqueCode = Number(eventData?.unique_code_fixed) || 0;
      } else if (mode === 'sequential') {
        const seq = ((regCount || 0) + 1) % 1000;
        uniqueCode = seq === 0 ? 1 : seq;
      } else if (mode === 'custom_range') {
        const min = Number(eventData?.unique_code_min) || 100;
        const max = Number(eventData?.unique_code_max) || 999;
        uniqueCode = Math.floor(Math.random() * (max - min + 1)) + min;
      } else {
        uniqueCode = Math.floor(Math.random() * 900) + 100;
      }
    }

    const feePerEvent = Number(eventData?.fee_per_event) || 50000;
    const computedTotal = (feePerEvent * validCompEventIds.length) + uniqueCode;
    const finalAmountDue = amountDue > 0 ? amountDue : computedTotal;

    for (const ceId of validCompEventIds) {
      // Cegah duplikat (unique athlete_id + competition_event_id)
      const { data: existing } = await supabase
        .from('registrations')
        .select('id')
        .eq('athlete_id', finalAthleteId)
        .eq('competition_event_id', ceId)
        .maybeSingle();

      if (existing) continue;

      const { data: reg, error: regErr } = await supabase
        .from('registrations')
        .insert({
          event_id: eventId,
          athlete_id: finalAthleteId,
          competition_event_id: ceId,
          registrant_id: user.id,
        })
        .select('id')
        .single();

      if (regErr || !reg) {
        return { ok: false, error: regErr?.message || 'Gagal mendaftarkan nomor lomba.' };
      }

      let { error: payErr } = await supabase.from('payment_verifications').insert({
        registration_id: reg.id,
        status: 'pending',
        amount_due: finalAmountDue,
        base_amount: feePerEvent,
        unique_code: uniqueCode,
        proof_url: proofUrl,
      });

      if (payErr && (payErr.message?.includes('column') || payErr.message?.includes('schema cache'))) {
        const { error: retryPayErr } = await supabase.from('payment_verifications').insert({
          registration_id: reg.id,
          status: 'pending',
          amount_due: finalAmountDue,
          proof_url: proofUrl,
        });
        payErr = retryPayErr;
      }

      if (payErr) return { ok: false, error: payErr.message || 'Gagal membuat verifikasi pembayaran.' };
    }
    revalidatePath('/atlet-saya');
    revalidatePath('/data-saya');
    revalidatePath('/dashboard-viewer');
    revalidatePath('/profile');
    revalidatePath('/pendaftaran-saya');
    revalidatePath('/verifikasi-pembayaran');
    revalidatePath('/tagihan');
    return { ok: true };
  } catch {
    return { ok: false, error: 'Terjadi kesalahan saat menyimpan pendaftaran.' };
  }
}


export async function verifyPaymentAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Hanya panitia (operator ke atas) yang boleh memverifikasi pembayaran.
  // Tanpa gate ini, viewer bisa memverifikasi lewat POST langsung ke action.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const role = profile?.role;
  if (role !== 'super_admin' && role !== 'event_admin' && role !== 'operator') {
    return;
  }

  const regId = formData.get("registrationId")?.toString();
  if (!regId) return;

  await supabase
    .from("payment_verifications")
    .update({
      status: "verified",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      notes: formData.get("notes")?.toString() || "",
    })
    .eq("registration_id", regId);
}

/** Admin/operator menolak pembayaran. */
export async function rejectPaymentAction(formData: FormData): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  // Hanya panitia (operator ke atas) yang boleh menolak pembayaran.
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const role = profile?.role;
  if (role !== 'super_admin' && role !== 'event_admin' && role !== 'operator') {
    return;
  }

  const regId = formData.get("registrationId")?.toString();
  if (!regId) return;

  await supabase
    .from("payment_verifications")
    .update({
      status: "rejected",
      reviewed_by: user.id,
      reviewed_at: new Date().toISOString(),
      notes: formData.get("notes")?.toString() || "Ditolak oleh panitia.",
    })
    .eq("registration_id", regId);
}
