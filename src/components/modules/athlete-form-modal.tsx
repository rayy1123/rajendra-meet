'use client';

import { useState, useEffect } from 'react';
import { saveAthlete, type AthleteFormState } from '@/app/atlet-saya/actions';
import { calculateAgeCategory } from '@/lib/age-category';

export interface AthleteFormValues {
  id?: string;
  full_name: string;
  gender: 'male' | 'female';
  birth_date: string;
  grade_level: string;
  class_name: string;
  school_id: string;
  parent_phone: string;
  medical_notes: string;
  height_cm: string;
  weight_kg: string;
}

interface SchoolOpt {
  id: string;
  name: string;
}

export function AthleteFormModal({
  open,
  initial,
  schools,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial: AthleteFormValues | null;
  schools: SchoolOpt[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [birthDate, setBirthDate] = useState(initial?.birth_date ?? '');
  const [selectedSchoolId, setSelectedSchoolId] = useState(initial?.school_id ?? '');

  useEffect(() => {
    setBirthDate(initial?.birth_date ?? '');
    setSelectedSchoolId(initial?.school_id ?? '');
  }, [initial, open]);

  const kuPreview = birthDate ? calculateAgeCategory(new Date(birthDate)) : '';

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const fd = new FormData(e.currentTarget);
    if (initial?.id) fd.set('id', initial.id);
    const res: AthleteFormState = await saveAthlete(fd);
    setSaving(false);
    if (res.ok) {
      onSaved();
    } else {
      setError(res.error ?? 'Gagal menyimpan.');
    }
  }

  const v = initial;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border bg-card shadow-lg"
      >
        <div className="border-b px-6 py-4">
          <h3 className="text-lg font-bold text-[var(--m-ink)]">
            {v?.id ? 'Edit Atlet' : 'Tambah Atlet'}
          </h3>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          {error && (
            <div className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-medium">Nama Lengkap *</label>
            <input
              name="full_name"
              required
              defaultValue={v?.full_name ?? ''}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Gender</label>
              <select
                name="gender"
                defaultValue={v?.gender ?? 'male'}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                <option value="male">Putra</option>
                <option value="female">Putri</option>
              </select>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Tanggal Lahir *</label>
                {kuPreview && (
                  <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    {kuPreview}
                  </span>
                )}
              </div>
              <input
                type="date"
                name="birth_date"
                required
                value={birthDate}
                onChange={(e) => setBirthDate(e.target.value)}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Jenjang</label>
              <select
                name="grade_level"
                defaultValue={v?.grade_level ?? 'SD'}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                <option value="PAUD/TK">PAUD/TK</option>
                <option value="SD">SD</option>
                <option value="SMP">SMP</option>
                <option value="SMA">SMA</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Kelas</label>
              <input
                name="class_name"
                placeholder="Kelas 1"
                defaultValue={v?.class_name ?? ''}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Sekolah / Kontingen Klub</label>
              {selectedSchoolId && (
                <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  ⚠️ Deteksi Klub Terpilih
                </span>
              )}
            </div>
            <select
              name="school_id"
              value={selectedSchoolId}
              onChange={(e) => setSelectedSchoolId(e.target.value)}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            >
              <option value="">— Tanpa sekolah / Mandiri —</option>
              {schools.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Tinggi (cm)</label>
              <input
                name="height_cm"
                type="number"
                min="0"
                step="0.1"
                defaultValue={v?.height_cm ?? ''}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Berat (kg)</label>
              <input
                name="weight_kg"
                type="number"
                min="0"
                step="0.1"
                defaultValue={v?.weight_kg ?? ''}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Kontak Orang Tua</label>
            <input
              name="parent_phone"
              placeholder="0812xxxx"
              defaultValue={v?.parent_phone ?? ''}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium">Catatan Medis / Alergi</label>
            <textarea
              name="medical_notes"
              rows={2}
              defaultValue={v?.medical_notes ?? ''}
              className="w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-accent"
          >
            Batal
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-ink disabled:opacity-50"
          >
            Simpan
          </button>
        </div>
      </form>
    </div>
  );
}
