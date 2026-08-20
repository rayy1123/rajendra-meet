"use server";

import { createClient } from "@/lib/supabase/server";

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
    .select("id, event_id")
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
    for (const ceId of competitionEventIds) {
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

      const { error: payErr } = await supabase.from("payment_verifications").insert({
        registration_id: reg.id,
        status: "pending",
        amount_due: amountDue,
        proof_url: proofUrl,
      });

      if (payErr) {
        return { ok: false, error: payErr.message || "Gagal membuat verifikasi pembayaran." };
      }
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat menyimpan pendaftaran." };
  }
}

/** Buat atlet (event-scoped) lalu daftarkan ke nomor lomba + buat verifikasi pembayaran pending. */
export async function createAthleteAndRegisterAction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sesi berakhir, silakan login kembali." };

  const eventId = formData.get("eventId")?.toString();
  const fullName = formData.get("fullName")?.toString()?.trim();
  const birthDate = formData.get("birthDate")?.toString();
  const gender = formData.get("gender")?.toString();
  const gradeLevel = formData.get("gradeLevel")?.toString() || "";
  const classname = formData.get("className")?.toString() || "";
  const competitionEventIds = formData
    .getAll("competitionEventId")
    .map((c) => c.toString())
    .filter(Boolean);
  const proofUrl = formData.get("proofUrl")?.toString() || null;
  const amountDue = Number(formData.get("amountDue") || "0") || 0;

  if (!eventId || !fullName || !birthDate || !gender || competitionEventIds.length === 0) {
    return { ok: false, error: "Data pendaftaran tidak lengkap." };
  }

  try {
    const { data: athlete, error: athErr } = await supabase
      .from("athletes")
      .insert({
        event_id: eventId,
        athlete_number: `REG-${Date.now().toString(36)}`,
        full_name: fullName,
        gender,
        birth_date: birthDate,
        grade_level: gradeLevel,
        class_name: classname,
        age_group: "",
        school_id: null,
      })
      .select("id")
      .single();

    if (athErr || !athlete) {
      return { ok: false, error: athErr?.message || "Gagal menyimpan atlet." };
    }

    for (const ceId of competitionEventIds) {
      const { data: reg, error: regErr } = await supabase
        .from("registrations")
        .insert({
          event_id: eventId,
          athlete_id: athlete.id,
          competition_event_id: ceId,
          registrant_id: user.id,
        })
        .select("id")
        .single();

      if (regErr || !reg) return { ok: false, error: regErr?.message || "Gagal mendaftarkan nomor lomba." };

      const { error: payErr } = await supabase.from("payment_verifications").insert({
        registration_id: reg.id,
        status: "pending",
        amount_due: amountDue,
        proof_url: proofUrl,
      });
      if (payErr) return { ok: false, error: payErr.message || "Gagal membuat verifikasi pembayaran." };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: "Terjadi kesalahan saat menyimpan pendaftaran." };
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
