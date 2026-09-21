"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Upload, CreditCard } from "lucide-react";
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
  age_group?: string;
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

export interface RegistrationWizardProps {
  eventId: string;
  event?: {
    id: string;
    name: string;
    fee_per_event?: number;
    fee_calculation_mode?: string;
    flat_package_limit?: number;
    flat_package_price?: number;
    use_unique_code?: boolean;
    unique_code_mode?: string;
    unique_code_fixed?: number;
    unique_code_min?: number;
    unique_code_max?: number;
    bank_name?: string;
    bank_account_no?: string;
    bank_account_name?: string;
  };
  competitionEvents: CompEventDTO[];
  existingAthletes: AthleteDTO[];
  isAdmin?: boolean;
}

export function RegistrationWizard({
  eventId,
  event,
  competitionEvents,
  existingAthletes,
  isAdmin = false,
}: RegistrationWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [athleteId, setAthleteId] = useState<string | null>(
    existingAthletes[0]?.id ?? null
  );

  // Kode unik pendaftaran (dihitung sekali saat flow dibuka)
  const [uniqueCode] = useState<number>(() => {
    if (event?.use_unique_code === false) return 0;
    if (event?.unique_code_mode === 'fixed') return Number(event?.unique_code_fixed) || 0;
    if (event?.unique_code_mode === 'custom_range') {
      const min = Number(event?.unique_code_min) || 100;
      const max = Number(event?.unique_code_max) || 999;
      return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    // Default 3 digit random: 100 - 999
    return Math.floor(Math.random() * 900) + 100;
  });

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

  const normalizeGender = (g: string | undefined): 'male' | 'female' => {
    if (!g) return 'male';
    const s = g.toLowerCase();
    if (s.includes('fem') || s.includes('putri') || s.includes('perempuan') || s === 'f') return 'female';
    return 'male';
  };

  const eligibleCats = competitionEvents.filter((c) => {
    if (!chosen) return false;

    // Cek Gender yang robust (menangani male/putra/laki-laki & female/putri/perempuan)
    const athleteGen = normalizeGender(chosen.gender);
    const eventGen = normalizeGender(c.gender);
    if (eventGen !== athleteGen) return false;

    // Saring sangat ketat berdasarkan Kelompok Umur (KU)
    const ageGroupStr = `${c.age_group || ''} ${c.grade_level || ''} ${c.name || ''}`.toLowerCase();

    if (athleteKU.includes('ku senior')) {
      return ageGroupStr.includes('senior') || ageGroupStr.includes('umum') || ageGroupStr.includes('19');
    }
    if (athleteKU.includes('ku i')) {
      // KU I (SMA) -> HANYA izinkan yang ada indikator KU I, KU 1, atau SMA. Tolak tegas PAUD, TK, SD, SMP, Senior, KU II-V.
      const isKu1 = ageGroupStr.includes('ku i') || ageGroupStr.includes('ku 1') || ageGroupStr.includes('sma');
      const isOther = ageGroupStr.includes('smp') || ageGroupStr.includes('sd') || ageGroupStr.includes('paud') || ageGroupStr.includes('tk') || ageGroupStr.includes('senior') || ageGroupStr.includes('ku ii') || ageGroupStr.includes('ku 2') || ageGroupStr.includes('ku iii') || ageGroupStr.includes('ku 3') || ageGroupStr.includes('ku iv') || ageGroupStr.includes('ku 4') || ageGroupStr.includes('ku v') || ageGroupStr.includes('ku 5');
      return isKu1 && !isOther;
    }
    if (athleteKU.includes('ku ii')) {
      const isKu2 = ageGroupStr.includes('ku ii') || ageGroupStr.includes('ku 2') || ageGroupStr.includes('smp');
      const isOther = ageGroupStr.includes('sma') || ageGroupStr.includes('sd') || ageGroupStr.includes('paud') || ageGroupStr.includes('tk') || ageGroupStr.includes('senior') || ageGroupStr.includes('ku i') || ageGroupStr.includes('ku 1') || ageGroupStr.includes('ku iii') || ageGroupStr.includes('ku 3');
      return isKu2 && !isOther;
    }
    if (athleteKU.includes('ku iii')) {
      const isKu3 = ageGroupStr.includes('ku iii') || ageGroupStr.includes('ku 3');
      const isOther = ageGroupStr.includes('sma') || ageGroupStr.includes('smp') || ageGroupStr.includes('senior') || ageGroupStr.includes('ku i') || ageGroupStr.includes('ku ii') || ageGroupStr.includes('ku iv');
      return isKu3 && !isOther;
    }
    if (athleteKU.includes('ku iv')) {
      const isKu4 = ageGroupStr.includes('ku iv') || ageGroupStr.includes('ku 4');
      const isOther = ageGroupStr.includes('sma') || ageGroupStr.includes('smp') || ageGroupStr.includes('senior') || ageGroupStr.includes('ku i') || ageGroupStr.includes('ku ii') || ageGroupStr.includes('ku iii');
      return isKu4 && !isOther;
    }
    if (athleteKU.includes('ku v')) {
      const isKu5 = ageGroupStr.includes('ku v') || ageGroupStr.includes('ku 5') || ageGroupStr.includes('paud') || ageGroupStr.includes('tk') || ageGroupStr.includes('sd');
      const isOther = ageGroupStr.includes('sma') || ageGroupStr.includes('smp') || ageGroupStr.includes('senior') || ageGroupStr.includes('ku i') || ageGroupStr.includes('ku ii');
      return isKu5 && !isOther;
    }

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

  const feePerEvent = Number(event?.fee_per_event) || 50000;
  const calcMode = event?.fee_calculation_mode || 'per_event';
  const pkgLimit = Number(event?.flat_package_limit) || 3;
  const pkgPrice = Number(event?.flat_package_price) || 275000;

  let baseAmount = 0;
  if (calcMode === 'flat_package' && selectedCats.length > 0) {
    if (selectedCats.length <= pkgLimit) {
      baseAmount = pkgPrice;
    } else {
      baseAmount = pkgPrice + (selectedCats.length - pkgLimit) * feePerEvent;
    }
  } else {
    baseAmount = feePerEvent * selectedCats.length;
  }

  const totalAmount = baseAmount + uniqueCode;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.set("eventId", eventId);
    fd.set("proofUrl", proof);
    fd.set("amountDue", String(totalAmount));
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
      <Card className="mx-auto max-w-2xl p-8 text-center space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Check className="h-7 w-7" />
        </div>
        <h2 className="text-xl font-bold text-foreground">
          {isAdmin ? 'Pendaftaran Manual Berhasil!' : 'Pendaftaran Terkirim!'}
        </h2>
        <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
          {isAdmin ? (
            <span>
              Atlet berhasil didaftarkan ke <b>{selectedCats.length} nomor lomba</b>. Data telah masuk ke daftar <b>Verifikasi Pembayaran</b> dengan status <span className="text-amber-600 font-bold">Menunggu</span>.
            </span>
          ) : (
            <span>
              Atlet didaftarkan ke {selectedCats.length} nomor lomba. Status pembayaran Anda <b>Menunggu Verifikasi</b>. Silakan hubungi nomor admin/panitia untuk informasi lebih lanjut.
            </span>
          )}
        </p>
        <div className="pt-2 flex justify-center gap-3">
          {isAdmin ? (
            <>
              <Button onClick={() => { setDone(false); setStep(0); setSelectedCats([]); }} className="font-bold text-xs">
                + Daftarkan Atlet Lainnya
              </Button>
              <Button variant="outline" onClick={() => router.push("/verifikasi-pembayaran")} className="font-bold text-xs">
                Ke Daftar Verifikasi Pembayaran &rarr;
              </Button>
            </>
          ) : (
            <>
              <Button onClick={() => router.push("/pendaftaran-saya")}>Lihat Pendaftaran</Button>
              <Button variant="outline" onClick={() => router.push("/scoreboard")}>Scoreboard</Button>
            </>
          )}
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
            <div className="flex justify-between"><dt className="text-[var(--m-muted)]">Event</dt><dd className="font-semibold text-[var(--m-ink)]">{event?.name || 'Kejuaraan Renang'}</dd></div>
            <div className="border-t pt-2" />
            {selectedCats.map((cid) => {
              const c = competitionEvents.find((x) => x.id === cid);
              if (!c) return null;
              return (
                <div key={cid} className="flex justify-between text-xs sm:text-sm">
                  <dt className="text-[var(--m-muted)]">{c.distance_meters}m {STROKE_LABELS[c.stroke] ?? c.stroke} ({c.name})</dt>
                  <dd className="font-medium text-[var(--m-ink)]">Rp {feePerEvent.toLocaleString('id-ID')}</dd>
                </div>
              );
            })}
            
            <div className="border-t border-dashed pt-2 space-y-1.5">
              <div className="flex justify-between text-xs">
                <dt className="text-[var(--m-muted)]">Subtotal ({selectedCats.length} nomor lomba)</dt>
                <dd className="font-semibold text-[var(--m-ink)]">Rp {baseAmount.toLocaleString('id-ID')}</dd>
              </div>

              {uniqueCode > 0 && (
                <div className="flex justify-between text-xs items-center bg-amber-50/80 p-2 rounded-lg border border-amber-200">
                  <dt className="text-amber-900 flex items-center gap-1.5 font-medium">
                    <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                    Kode Unik Transfer:
                  </dt>
                  <dd className="font-bold text-amber-900">+Rp {uniqueCode}</dd>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t text-base font-bold text-foreground">
                <dt>Total Transfer:</dt>
                <dd className="text-primary text-lg">Rp {totalAmount.toLocaleString('id-ID')}</dd>
              </div>
            </div>
          </dl>

          {/* Rekening Tujuan */}
          <div className="mt-5 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] block">
              Rekening Tujuan Transfer:
            </span>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 bg-white p-3 rounded-lg border border-slate-200">
              <div>
                <p className="font-bold text-sm text-foreground">{event?.bank_name || 'Bank Central Asia (BCA)'}</p>
                <p className="font-mono text-base font-bold text-primary">{event?.bank_account_no || '1234567890'}</p>
                <p className="text-muted-foreground text-[11px]">a.n {event?.bank_account_name || 'Panitia Pelaksana Renang'}</p>
              </div>
              <div className="text-right sm:text-right">
                <span className="text-[11px] text-muted-foreground block">Nominal Tepat:</span>
                <span className="font-mono text-base font-extrabold text-amber-700">Rp {totalAmount.toLocaleString('id-ID')}</span>
              </div>
            </div>
            <p className="text-[11px] text-amber-800 bg-amber-50/70 p-2 rounded border border-amber-200 leading-relaxed">
              ⚠️ <b>Penting:</b> Mohon transfer <b>tepat sejumlah Rp {totalAmount.toLocaleString('id-ID')}</b> (termasuk 3 digit kode unik). Jangan dibulatkan agar panitia dapat memverifikasi pembayaran Anda secara cepat.
            </p>
          </div>

          <div className="mt-5 space-y-1">
            <label className="text-xs font-semibold">Bukti Pembayaran (Tautan / Referensi Transfer)</label>
            <div className="flex items-center gap-2 rounded-xl border border-dashed border-[var(--m-border)] p-3">
              <Upload className="h-5 w-5 text-[var(--m-aqua)]" />
              <Input value={proof} onChange={(e) => setProof(e.target.value)} placeholder="Tempel tautan bukti transfer / nomor referensi transfer bank" />
            </div>
          </div>

          <div className="mt-4 rounded-xl bg-[var(--m-aqua-soft)] p-3 text-xs text-[var(--m-aqua-ink)] flex items-center gap-2">
            <CreditCard className="h-4 w-4 shrink-0" />
            Status pembayaran akan diverifikasi oleh panitia setelah berkas pendaftaran dikirimkan.
          </div>

          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

          <div className="mt-5 flex items-center justify-between">
            <Button variant="outline" onClick={goBack}><ChevronLeft className="h-4 w-4" /> Kembali</Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? 'Mengirim Pendaftaran...' : 'Kirim Pendaftaran & Bayar'}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
