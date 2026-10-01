"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Upload, CreditCard, School, Plus, Building, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  calculateAgeCategory,
  STROKE_LABELS,
  formatRupiah,
  isEventEligibleForAthlete,
  formatCompEventSubtitle,
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
  school_name?: string | null;
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
  schools?: { id: string; name: string }[];
  isAdmin?: boolean;
}

export function RegistrationWizard({
  eventId,
  event,
  competitionEvents,
  existingAthletes,
  schools = [],
  isAdmin = false,
}: RegistrationWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [mode, setMode] = useState<"existing" | "new">("existing");
  const [athleteId, setAthleteId] = useState<string | null>(
    existingAthletes[0]?.id ?? null
  );

  const [athleteSearch, setAthleteSearch] = useState("");

  const filteredExistingAthletes = useMemo(() => {
    if (!athleteSearch.trim()) return existingAthletes;
    const q = athleteSearch.toLowerCase();
    return existingAthletes.filter(
      (a) =>
        a.full_name.toLowerCase().includes(q) ||
        (a.school_name || '').toLowerCase().includes(q) ||
        a.grade_level.toLowerCase().includes(q)
    );
  }, [existingAthletes, athleteSearch]);

  // Kode unik pendaftaran (dihitung sekali saat flow dibuka)
  const [uniqueCode] = useState<number>(() => {
    if (event?.use_unique_code === false) return 0;
    if (event?.unique_code_mode === 'fixed') return Number(event?.unique_code_fixed) || 0;
    if (event?.unique_code_mode === 'custom_range') {
      const minVal = Number(event?.unique_code_min);
      const maxVal = Number(event?.unique_code_max);
      const safeMin = !isNaN(minVal) && minVal > 0 ? minVal : 100;
      const safeMax = !isNaN(maxVal) && maxVal > 0 ? maxVal : 999;
      const actualMin = Math.min(safeMin, safeMax);
      const actualMax = Math.max(safeMin, safeMax);
      return Math.floor(Math.random() * (actualMax - actualMin + 1)) + actualMin;
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
  const [schoolId, setSchoolId] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [isCustomSchool, setIsCustomSchool] = useState(false);
  const [schoolsList, setSchoolsList] = useState<{ id: string; name: string }[]>(schools || []);

  useEffect(() => {
    if (schools && schools.length > 0) {
      setSchoolsList(schools);
    } else {
      fetch("/api/schools")
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) setSchoolsList(data);
          else if (data?.data && Array.isArray(data.data)) setSchoolsList(data.data);
        })
        .catch((err) => console.warn("Fetch schools in wizard error:", err));
    }
  }, [schools]);

  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [strokeFilter, setStrokeFilter] = useState<string>('all');
  const [compEventSearch, setCompEventSearch] = useState<string>('');
  const [proof, setProof] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const primarySchoolId = useMemo(() => {
    const counts = new Map<string, number>();
    existingAthletes.forEach((a) => {
      if (a.school_id) {
        counts.set(a.school_id, (counts.get(a.school_id) || 0) + 1);
      }
    });
    let max = 0;
    let topId: string | null = null;
    counts.forEach((cnt, id) => {
      if (cnt > max) {
        max = cnt;
        topId = id;
      }
    });
    return topId;
  }, [existingAthletes]);

  const chosen = mode === "existing"
    ? existingAthletes.find((a) => a.id === athleteId) ?? null
    : { full_name: fullName, birth_date: birthDate, gender, grade_level: gradeLevel };

  const athleteKU = chosen && chosen.birth_date ? calculateAgeCategory(new Date(chosen.birth_date)) : "";

  // Saring ketat nomor lomba: jika atlet KU 1, HANYA tampilkan nomor lomba yang berkualifikasi KU 1 (dan gender cocok).
  // Seluruh nomor lomba KU lain (KU 2-5, Senior, SD, SMP, dll.) otomatis dihilangkan.
  const eligibleCats = useMemo(() => {
    return competitionEvents.filter((c) => {
      if (!chosen) return false;
      if (!isEventEligibleForAthlete(chosen, c)) return false;
      if (strokeFilter !== 'all' && c.stroke !== strokeFilter) return false;
      if (compEventSearch.trim()) {
        const q = compEventSearch.toLowerCase();
        const combined = `${c.distance_meters} ${c.stroke} ${STROKE_LABELS[c.stroke] || ''} ${c.name} ${c.grade_level || ''} ${c.age_group || ''}`.toLowerCase();
        return combined.includes(q);
      }
      return true;
    });
  }, [competitionEvents, chosen, strokeFilter, compEventSearch]);

  const allEligibleCount = useMemo(() => {
    return competitionEvents.filter((c) => chosen && isEventEligibleForAthlete(chosen, c)).length;
  }, [competitionEvents, chosen]);

  const toggleCat = (cid: string) =>
    setSelectedCats((prev) => (prev.includes(cid) ? prev.filter((x) => x !== cid) : [...prev, cid]));

  // Pastikan kategori yang dipilih tetap valid (tidak ada kebocoran nomor yang tidak eligible)
  const validSelectedCats = selectedCats.filter((cid) =>
    competitionEvents.some((c) => c.id === cid && chosen && isEventEligibleForAthlete(chosen, c))
  );

  const goNext = () => {
    if (step === 0 && mode === "existing" && !athleteId) return;
    if (step === 0 && mode === "new" && (!fullName || !birthDate)) return;
    if (step === 1 && validSelectedCats.length === 0) return;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  };
  const goBack = () => setStep((s) => Math.max(0, s - 1));

  const feePerEvent = Number(event?.fee_per_event) || 50000;
  const calcMode = event?.fee_calculation_mode || 'per_event';
  const pkgLimit = Number(event?.flat_package_limit) || 3;
  const pkgPrice = Number(event?.flat_package_price) || 275000;
  const extraFeePerEvent = Number((event as any)?.extra_fee_per_event) || 80000;

  let baseAmount = 0;
  let extraCount = 0;
  if (calcMode === 'flat_package' && validSelectedCats.length > 0) {
    if (validSelectedCats.length <= pkgLimit) {
      baseAmount = pkgPrice;
    } else {
      extraCount = validSelectedCats.length - pkgLimit;
      baseAmount = pkgPrice + extraCount * extraFeePerEvent;
    }
  } else {
    baseAmount = feePerEvent * validSelectedCats.length;
  }

  const totalAmount = baseAmount + uniqueCode;

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const fd = new FormData();
    fd.set("eventId", eventId);
    fd.set("proofUrl", proof);
    fd.set("amountDue", String(totalAmount));
    validSelectedCats.forEach((c) => fd.append("competitionEventId", c));
    if (mode === "existing" && athleteId) {
      fd.set("athleteId", athleteId);
      if (schoolId) fd.set("schoolId", schoolId);
      if (schoolName) fd.set("schoolName", schoolName);
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
      fd.set("schoolId", schoolId);
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
              {/* Search Bar Atlet Tersimpan (Item #2) */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Cari nama atlet, klub, atau KU..."
                  value={athleteSearch}
                  onChange={(e) => setAthleteSearch(e.target.value)}
                  className="pl-9 text-xs rounded-xl bg-slate-50/80 border-slate-200"
                />
              </div>

              {filteredExistingAthletes.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 rounded-xl border border-dashed">
                  Tidak ada atlet yang cocok dengan pencarian &quot;{athleteSearch}&quot;.
                </div>
              ) : (
                filteredExistingAthletes.map((a) => {
                  const ku = calculateAgeCategory(new Date(a.birth_date));
                  const sel = a.id === athleteId;
                  return (
                    <button type="button" key={a.id} onClick={() => {
                      if (a.id !== athleteId) setSelectedCats([]);
                      setAthleteId(a.id);
                    }}
                      className={`flex w-full items-center justify-between rounded-xl border p-4 text-left transition-colors ${sel ? "border-[var(--m-aqua)] bg-[var(--m-aqua-soft)]" : "border-[var(--m-border)] hover:border-[var(--m-aqua)]"}`}>
                      <div>
                        <div className="font-semibold text-[var(--m-ink)] flex items-center gap-2">
                          <span>{a.full_name}</span>
                          {primarySchoolId && a.school_id && a.school_id !== primarySchoolId && (
                            <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-2 py-0.5 rounded border border-rose-300">
                              ⚠️ Beda Klub ({a.school_name || 'Lainnya'})
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-[var(--m-muted)]">
                          {ku}{a.school_name ? ` · ${a.school_name}` : ""}
                        </div>
                      </div>
                      <span className={`h-5 w-5 rounded-full border-2 ${sel ? "border-[var(--m-aqua)] bg-[var(--m-aqua)]" : "border-[var(--m-border)]"}`} />
                    </button>
                  );
                })
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Nama Lengkap</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nama atlet" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold">Tanggal Lahir</label>
                  {birthDate && (
                    <span className="text-[10px] font-bold text-[var(--m-aqua-ink)] bg-[var(--m-aqua-soft)] px-2 py-0.5 rounded-full">
                      {calculateAgeCategory(new Date(birthDate))}
                    </span>
                  )}
                </div>
                <Input
                  type="date"
                  value={birthDate}
                  onChange={(e) => {
                    setBirthDate(e.target.value);
                    setSelectedCats([]);
                  }}
                />
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

              {/* Sekolah / Klub dengan Opsi Database Terdaftar */}
              <div className="space-y-1.5 sm:col-span-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                    <School className="h-3.5 w-3.5 text-blue-600" />
                    <span>Sekolah / Klub Kontingen</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomSchool((v) => !v);
                      if (!isCustomSchool) {
                        setSchoolId("");
                      }
                    }}
                    className="text-[11px] font-bold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    {isCustomSchool ? "← Pilih dari Database Klub" : "+ Input Klub Lain / Baru"}
                  </button>
                </div>

                {!isCustomSchool ? (
                  <select
                    value={schoolId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "__custom__") {
                        setIsCustomSchool(true);
                        setSchoolId("");
                      } else {
                        setSchoolId(val);
                        const found = schoolsList.find((s) => s.id === val);
                        setSchoolName(found?.name || "");
                      }
                    }}
                    className="h-10 w-full rounded-xl border border-slate-300 bg-white px-3 text-xs font-medium text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 shadow-2xs"
                  >
                    <option value="">-- Pilih dari Database Klub / Kontingen Terdaftar --</option>
                    {schoolsList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                    <option value="__custom__">+ Ketik Nama Klub / Sekolah Baru...</option>
                  </select>
                ) : (
                  <div className="space-y-1">
                    <Input
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      placeholder="Ketik nama lengkap klub atau kontingen sekolah baru"
                      className="h-10 text-xs rounded-xl"
                      autoFocus
                    />
                    <p className="text-[10px] text-slate-500">
                      Nama klub baru akan otomatis tersimpan ke master database dan dikaitkan ke atlet ini.
                    </p>
                  </div>
                )}

                {((schoolId && primarySchoolId && schoolId !== primarySchoolId) || (isCustomSchool && schoolName.trim())) && (
                  <div className="rounded-xl border border-rose-300 bg-rose-50 p-2.5 text-xs font-bold text-rose-900 flex items-center gap-2">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-600 text-white text-[10px]">!</span>
                    <span>⚠️ Deteksi Klub Berbeda: Atlet ini akan terdaftar di bawah kontingen {schoolName || 'klub baru'} (berbeda dari klub utama Anda).</span>
                  </div>
                )}
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
        <Card className="p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-[var(--m-ink)]">Pilih Nomor Lomba</h2>
              <p className="text-xs text-[var(--m-muted)]">
                Nomor otomatis disaring ketat berdasarkan gender ({chosen.gender === 'female' ? 'Putri' : 'Putra'}) dan kelompok umur atlet.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 border border-blue-200 text-blue-900">
                <span className="h-2 w-2 rounded-full bg-blue-600" />
                {chosen.full_name || fullName}
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-black bg-cyan-100 text-cyan-900 border border-cyan-300">
                {athleteKU}
              </span>
            </div>
          </div>

          {/* Stroke Filter Tabs & Search Bar */}
          <div className="space-y-2.5 pt-1">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                { id: 'all', label: 'Semua Gaya' },
                { id: 'Freestyle', label: 'Bebas' },
                { id: 'Breaststroke', label: 'Dada' },
                { id: 'Backstroke', label: 'Punggung' },
                { id: 'Butterfly', label: 'Kupu-kupu' },
                { id: 'Individual Medley', label: 'Ganti (IM)' },
              ].map((st) => (
                <button
                  type="button"
                  key={st.id}
                  onClick={() => setStrokeFilter(st.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    strokeFilter === st.id
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <Input
                type="text"
                placeholder="Cari jarak (25m, 50m, 100m) atau nomor acara..."
                value={compEventSearch}
                onChange={(e) => setCompEventSearch(e.target.value)}
                className="pl-8 text-xs h-9 rounded-xl bg-slate-50 border-slate-200"
              />
            </div>
          </div>

          {/* List Nomor Lomba */}
          <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
            {eligibleCats.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 rounded-xl border border-dashed bg-slate-50 space-y-1">
                <p className="font-bold text-slate-700">Tidak ada nomor lomba yang cocok</p>
                <p className="text-[11px] text-slate-500">
                  {compEventSearch || strokeFilter !== 'all'
                    ? 'Coba ubah filter gaya atau kata kunci pencarian di atas.'
                    : `Tidak ada nomor lomba yang dibuka untuk kategori ${athleteKU} pada kejuaraan ini.`}
                </p>
              </div>
            ) : (
              eligibleCats.map((c) => {
                const sel = selectedCats.includes(c.id);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleCat(c.id)}
                    className={`flex w-full items-center justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                      sel
                        ? 'border-blue-500 bg-blue-50/80 shadow-2xs'
                        : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/70'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="font-bold text-slate-900 text-sm flex items-center gap-2">
                        <span>{c.distance_meters}m {STROKE_LABELS[c.stroke] ?? c.stroke}</span>
                        {sel && (
                          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300">
                            Terpilih
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-600">
                        {formatCompEventSubtitle(c.name, c.grade_level, c.age_group)}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold font-mono text-slate-700">
                        Rp {feePerEvent.toLocaleString('id-ID')}
                      </span>
                      <span
                        className={`flex h-5 w-5 items-center justify-center rounded-md border-2 transition-all ${
                          sel ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 bg-white'
                        }`}
                      >
                        {sel && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Live Estimate Footer Bar */}
          <div className="p-3.5 rounded-xl bg-slate-900 text-white flex items-center justify-between shadow-xs">
            <div>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Biaya Sementara
              </span>
              <p className="text-base font-black text-cyan-300 font-mono">
                Rp {totalAmount.toLocaleString('id-ID')}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[11px] font-bold text-slate-200">
                {validSelectedCats.length} Nomor Terpilih
              </span>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="mt-4 flex items-center justify-between pt-2">
            <Button variant="outline" onClick={goBack}>
              <ChevronLeft className="h-4 w-4" /> Kembali
            </Button>
            <Button onClick={goNext} disabled={validSelectedCats.length === 0} className="bg-blue-600 hover:bg-blue-700 text-white">
              Lanjut ke Pembayaran <ChevronRight className="h-4 w-4" />
            </Button>
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
            {validSelectedCats.map((cid) => {
              const c = competitionEvents.find((x) => x.id === cid);
              if (!c) return null;
              return (
                <div key={cid} className="flex justify-between text-xs sm:text-sm">
                  <dt className="text-[var(--m-muted)]">{c.distance_meters}m {STROKE_LABELS[c.stroke] ?? c.stroke} ({formatCompEventSubtitle(c.name, c.grade_level, c.age_group)})</dt>
                  <dd className="font-medium text-[var(--m-ink)]">Rp {feePerEvent.toLocaleString('id-ID')}</dd>
                </div>
              );
            })}

            <div className="border-t border-dashed pt-2 space-y-1.5">
              {calcMode === 'flat_package' && (
                <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs space-y-1">
                  <div className="flex justify-between font-bold text-blue-950">
                    <span>Skema Paket Hemat ({pkgLimit} Nomor Pertama):</span>
                    <span>Rp {pkgPrice.toLocaleString('id-ID')}</span>
                  </div>
                  {extraCount > 0 && (
                    <div className="flex justify-between text-blue-900">
                      <span>+ {extraCount} Nomor Tambahan (@ Rp {extraFeePerEvent.toLocaleString('id-ID')}):</span>
                      <span>+Rp {(extraCount * extraFeePerEvent).toLocaleString('id-ID')}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-between text-xs">
                <dt className="text-[var(--m-muted)]">Subtotal ({validSelectedCats.length} nomor lomba)</dt>
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
