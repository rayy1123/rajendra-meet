"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Upload, CreditCard, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  calculateAgeCategory,
  STROKE_LABELS,
  formatRupiah,
} from "@/lib/age-category";
import { createAthleteAndRegisterAction } from "@/app/daftar-lomba/actions";

export interface CompEventDTO {
  id: string;
  name: string;
  stroke: string;
  distance_meters: number;
  gender: "male" | "female";
  grade_level: string;
  class_name: string;
}

export interface AthleteDTO {
  id: string;
  full_name: string;
  birth_date: string;
  gender: "male" | "female";
  grade_level: string;
  school_id: string | null;
}

const STEPS = ["Data Atlet", "Pilih Nomor Lomba", "Ringkasan & Bayar"];

export function RegistrationWizard({
  eventId,
  competitionEvents,
  existingAthletes,
}: {
  eventId: string;
  competitionEvents: CompEventDTO[];
  existingAthletes: AthleteDTO[];
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [athleteId, setAthleteId] = useState<string | null>(
    existingAthletes[0]?.id ?? null
  );

  // new-athlete form
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [gender, setGender] = useState<"male" | "female">("male");
  const [gradeLevel, setGradeLevel] = useState("");
  const [className, setClassName] = useState("");
  const [schoolName, setSchoolName] = useState("");

  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [proof, setProof] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const chosen = mode === "existing"
    ? existingAthletes.find((a) => a.id === athleteId) ?? null
    : { full_name: fullName, birth_date: birthDate, gender, grade_level: gradeLevel };

  const athleteKU = chosen && chosen.birth_date ? calculateAgeCategory(new Date(chosen.birth_date)) : "";

  const eligibleCats = competitionEvents.filter((c) => {
    if (!chosen) return false;
    if (c.gender !== chosen.gender) return false;
    // grade-level filter: cocok bila kosong (umum) atau sama
    if (c.grade_level && chosen.grade_level && c.grade_level !== chosen.grade_level) return false;
    return true;
  });

  const toggleCat = (cid: string) =>
    setSelectedCats((prev) => (prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]));

  const goNext = () => {
    if (step === 0 && mode === "existing" && !athleteId) return;
    if (step === 0 && mode === "new" && (!fullName || !birthDate)) return;
    if (step === 1 && selectedCats.length === 0) return;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.set("eventId", eventId);
    fd.set("proofUrl", proof);
    fd.set("amountDue", "0");
    selectedCats.forEach((c) => fd.append("competitionEventId", c));
    if (mode === "existing" && athleteId) {
      fd.set("athleteId", athleteId);
      const res = await createAthleteAndRegisterAction(fd);
      setSubmitting(false);
      if (res.ok) setDone(true);
      else setError(res.error ?? "Pendaftaran gagal");
    } else {
      fd.set("fullName", fullName);
      fd.set("birthDate", birthDate);
      fd.set("gender", gender);
      fd.set("gradeLevel", gradeLevel);
      fd.set("className", className);
      fd.set("schoolName", schoolName);
      const res = await createAthleteAndRegisterAction(fd);
      setSubmitting(false);
      if (res.ok) setDone(true);
      else setError(res.error ?? "Pendaftaran gagal");
    }
  };

  if (done) {
    return (
      <Card className="mx-auto max-w-2xl p-8 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[var(--m-aqua-soft)] text-[var(--m-aqua)]">
          <Check className="h-7 w-7" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-[var(--m-ink)]">Pendaftaran Terkirim!</h2>
        <p className="mt-1 text-sm text-[var(--m-muted)]">
          Atlet didaftarkan ke {selectedCats.length} nomor lomba. Menunggu verifikasi pembayaran oleh panitia.
        </p>
        <div className="mt-6 flex justify-center gap-3">
          <Button onClick={() => router.push("/dashboard/pendaftaran-saya")}>Lihat Pendaftaran</Button>
          <Button variant="outline" onClick={() => router.push("/scoreboard")}>Scoreboard</Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      {/* Stepper */}
      <div className="mb-8 flex items-center justify-between">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 items-center">
            <div className={`flex items-center gap-2 ${i <= step ? "text-[var(--m-aqua)]" : "text-[var(--m-muted)]"}`}>
              <span className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold ${i < step ? "bg-[var(--m-aqua)] text-white" : i === step ? "border-2 border-[var(--m-aqua)]" : "border-2 border-[var(--m-border)]"}`}>
                {i < step ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span className="hidden text-sm font-semibold sm:inline">{label}</span>
            </div>
            {i < STEPS.length - 1 && <div className="mx-2 h-0.5 flex-1 bg-[var(--m-border)]" />}
          </div>
        ))}
      </div>

      {/* STEP 1 */}
      {step === 0 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-bold text-[var(--m-ink)]">Data Atlet</h2>
          {existingAthletes.length > 0 && (
            <div className="mb-4 flex gap-2">
              <button type="button" onClick={() => setMode("existing")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${mode === "existing" ? "bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)]" : "bg-[var(--m-surface)] text-[var(--m-muted)]"}`}>
                Atlet tersimpan
              </button>
              <button type="button" onClick={() => setMode("new")}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium ${mode === "new" ? "bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)]" : "bg-[var(--m-surface)] text-[var(--m-muted)]"}`}>
                Atlet baru
              </button>
            </div>
          )}

          {mode === "existing" ? (
            <div className="space-y-3">
              {existingAthletes.map((a) => {
                const ku = calculateAgeCategory(new Date(a.birth_date));
                const sel = a.id === athleteId;
                return (
                  <button type="button" key={a.id} onClick={() => setAthleteId(a.id)}
                    className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors ${sel ? "border-[var(--m-aqua)] bg-[var(--m-aqua-soft)]" : "border-[var(--m-border)] hover:border-[var(--m-aqua)]"}`}>
                    <div>
                      <div className="font-semibold text-[var(--m-ink)]">{a.full_name}</div>
                      <div className="text-xs text-[var(--m-muted)]">{ku}</div>
                    </div>
                    <span className={`h-5 w-5 rounded-full border-2 ${sel ? "border-[var(--m-aqua)] bg-[var(--m-aqua)]" : "border-[var(--m-border)]"}`} />
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Nama Lengkap</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama atlet" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Tanggal Lahir</label>
                <Input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Gender</label>
                <select value={gender} onChange={(e) => setGender(e.target.value as "male" | "female")}
                  className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm">
                  <option value="male">Putra</option>
                  <option value="female">Putri</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Kelompok (KU)</label>
                <Input value={gradeLevel} onChange={(e) => setGradeLevel(e.target.value)} placeholder="SMP / SMA / SD" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Kelas</label>
                <Input value={className} onChange={(e) => setClassName(e.target.value)} placeholder="Kelas 8" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold">Sekolah / Klub</label>
                <Input value={schoolName} onChange={(e) => setSchoolName(e.target.value)} placeholder="Nama sekolah" />
              </div>
            </div>
          )}
          <div className="mt-5 flex justify-end">
            <Button onClick={goNext} disabled={mode === "existing" ? !athleteId : !fullName || !birthDate}>
              Lanjut <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      )}

      {/* STEP 2 */}
      {step === 1 && chosen && (
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-[var(--m-ink)]">Pilih Nomor Lomba</h2>
            <span className="pub-chip">{chosen.full_name || fullName} · {athleteKU}</span>
          </div>
          <p className="mb-3 text-sm text-[var(--m-muted)]">Nomor otomatis tersaring berdasarkan gender & kelompok atlet.</p>
          <div className="space-y-3">
            {eligibleCats.length === 0 && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">Tidak ada nomor lomba yang sesuai untuk atlet ini.</p>
            )}
            {eligibleCats.map((c) => {
              const sel = selectedCats.includes(c.id);
              return (
                <button type="button" key={c.id} onClick={() => toggleCat(c.id)}
                  className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors ${sel ? "border-[var(--m-aqua)] bg-[var(--m-aqua-soft)]" : "border-[var(--m-border)] hover:border-[var(--m-aqua)]"}`}>
                  <div>
                    <div className="font-semibold text-[var(--m-ink)]">{c.distance_meters}m {STROKE_LABELS[c.stroke] ?? c.stroke}</div>
                    <div className="text-xs text-[var(--m-muted)]">{c.name}{c.grade_level ? ` · ${c.grade_level}` : ""}</div>
                  </div>
                  <span className={`h-5 w-5 rounded border-2 ${sel ? "border-[var(--m-aqua)] bg-[var(--m-aqua)]" : "border-[var(--m-border)]"}`} />
                </button>
              );
            })}
          </div>
          <div className="mt-5 flex items-center justify-between">
            <Button variant="outline" onClick={goBack}><ChevronLeft className="h-4 w-4" /> Kembali</Button>
            <Button onClick={goNext} disabled={selectedCats.length === 0}>Lanjut <ChevronRight className="h-4 w-4" /></Button>
          </div>
        </Card>
      )}

      {/* STEP 3 */}
      {step === 2 && (
        <Card className="p-6">
          <h2 className="mb-4 text-lg font-bold text-[var(--m-ink)]">Ringkasan & Pembayaran</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-[var(--m-muted)]">Atlet</dt><dd className="font-semibold text-[var(--m-ink)]">{chosen?.full_name || fullName}</dd></div>
            <div className="flex justify-between"><dt className="text-[var(--m-muted)]">Event</dt><dd className="font-semibold text-[var(--m-ink)]">Kejuaraan</dd></div>
            <div className="border-t pt-2" />
            {selectedCats.map((cid) => {
              const c = competitionEvents.find((x) => x.id === cid);
              if (!c) return null;
              return (
                <div key={cid} className="flex justify-between">
                  <dt className="text-[var(--m-muted)]">{c.distance_meters}m {STROKE_LABELS[c.stroke] ?? c.stroke}</dt>
                  <dd className="font-medium text-[var(--m-ink)]">{formatRupiah(0)}</dd>
                </div>
              );
            })}
          </dl>

          <div className="mt-5 space-y-1">
            <label className="text-xs font-semibold">Bukti Pembayaran (URL / referensi)</label>
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--m-border)] p-3">
              <Upload className="h-5 w-5 text-[var(--m-aqua)]" />
              <Input value={proof} onChange={(e) => setProof(e.target.value)} placeholder="Tempel tautan bukti transfer / nomor referensi" />
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-[var(--m-aqua-soft)] p-4 text-sm text-[var(--m-aqua-ink)]">
            <CreditCard className="mr-2 inline h-4 w-4" />
            Pembayaran akan diverifikasi panitia (diterima/ditolak) setelah pendaftaran dikirim.
          </div>

          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="mt-5 flex items-center justify-between">
            <Button variant="outline" onClick={goBack}><ChevronLeft className="h-4 w-4" /> Kembali</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Kirim Pendaftaran
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
