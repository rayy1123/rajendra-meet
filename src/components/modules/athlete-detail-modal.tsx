'use client';

import Link from 'next/link';

export interface AthleteDetail {
  id: string;
  full_name: string;
  gender: 'male' | 'female';
  birth_date: string;
  age_group: string;
  grade_level: string;
  class_name: string;
  school_name: string | null;
  parent_phone: string;
  medical_notes: string;
  height_cm: number | null;
  weight_kg: number | null;
  registrations: {
    id: string;
    event_name: string;
    comp_name: string;
    status: string;
  }[];
}

function age(birth: string): number {
  if (!birth) return 0;
  const d = new Date(birth);
  const diff = Date.now() - d.getTime();
  return Math.floor(diff / (365.25 * 24 * 3600 * 1000));
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function AthleteDetailModal({
  athlete,
  onClose,
}: {
  athlete: AthleteDetail;
  onClose: () => void;
}) {
  if (!athlete) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border bg-card shadow-lg">
        <div className="flex items-center gap-4 border-b px-6 py-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
            {initials(athlete.full_name)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-bold text-[var(--m-ink)]">{athlete.full_name}</h3>
            <p className="text-xs text-[var(--m-muted)]">
              {athlete.gender === 'female' ? 'Putri' : 'Putra'}
              {athlete.grade_level ? ` · ${athlete.grade_level}` : ''}
              {athlete.class_name ? ` ${athlete.class_name}` : ''}
              {` · ${age(athlete.birth_date)} thn`}
              {athlete.age_group ? ` · ${athlete.age_group}` : ''}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[var(--m-muted)] hover:bg-[var(--m-soft)]"
            aria-label="Tutup"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto p-6">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-[var(--m-muted)]">Sekolah / Klub</div>
              <div className="font-medium">{athlete.school_name ?? '—'}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--m-muted)]">Kontak Orang Tua</div>
              <div className="font-medium">{athlete.parent_phone || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-[var(--m-muted)]">Tinggi / Berat</div>
              <div className="font-medium">
                {athlete.height_cm ?? '—'} cm / {athlete.weight_kg ?? '—'} kg
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--m-muted)]">Catatan Medis</div>
              <div className="font-medium">{athlete.medical_notes || '—'}</div>
            </div>
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[var(--m-ink)]">Status Pendaftaran</h4>
              <Link
                href="/daftar-lomba"
                className="text-xs font-semibold text-primary hover:underline"
              >
                + Daftar Lomba
              </Link>
            </div>
            {athlete.registrations.length === 0 ? (
              <div className="rounded-lg border border-dashed px-3 py-4 text-center text-sm text-[var(--m-muted)]">
                Belum terdaftar di nomor lomba mana pun.
              </div>
            ) : (
              <div className="space-y-2">
                {athlete.registrations.map((r) => (
                  <div key={r.id} className="rounded-lg border px-3 py-2 text-sm">
                    <div className="font-medium">{r.comp_name}</div>
                    <div className="text-xs text-[var(--m-muted)]">
                      {r.event_name} ·{' '}
                      <span className="capitalize">{r.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
