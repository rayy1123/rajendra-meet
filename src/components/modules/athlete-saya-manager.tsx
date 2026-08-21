'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, User } from 'lucide-react';
import { saveAthlete, deleteAthlete, type AthleteFormState } from '@/app/atlet-saya/actions';

interface SchoolOpt {
  id: string;
  name: string;
}

interface AthleteRow {
  id: string;
  full_name: string;
  gender: 'male' | 'female';
  birth_date: string;
  grade_level: string;
  class_name: string;
  school_id: string | null;
  schools: { name: string } | null;
}

export function AthleteSayaManager({
  athletes,
  schools,
}: {
  athletes: AthleteRow[];
  schools: SchoolOpt[];
}) {
  const [editing, setEditing] = useState<AthleteRow | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFormError(null);
    const fd = new FormData(e.currentTarget);
    const res: AthleteFormState = await saveAthlete(fd);
    setSaving(false);
    if (res.ok) {
      setShowForm(false);
      setEditing(null);
    } else {
      setFormError(res.error ?? 'Gagal menyimpan.');
    }
  }

  async function handleDelete(a: AthleteRow) {
    if (!confirm(`Hapus atlet "${a.full_name}"?`)) return;
    setDeletingId(a.id);
    const fd = new FormData();
    fd.set('id', a.id);
    const res = await deleteAthlete(fd);
    setDeletingId(null);
    if (!res.ok) alert(res.error ?? 'Gagal menghapus.');
  }

  function openNew() {
    setEditing(null);
    setFormError(null);
    setShowForm(true);
  }

  function openEdit(a: AthleteRow) {
    setEditing(a);
    setFormError(null);
    setShowForm(true);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {athletes.length} atlet terdaftar di akun Anda.
        </p>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-ink"
        >
          <Plus className="h-4 w-4" /> Tambah Atlet
        </button>
      </div>

      {athletes.length === 0 && !showForm ? (
        <div className="pub-card p-12 text-center">
          <User className="mx-auto h-10 w-10 text-[var(--m-aqua)]" />
          <h3 className="mt-3 font-semibold text-[var(--m-ink)]">Belum ada atlet</h3>
          <p className="mt-1 text-sm text-[var(--m-muted)]">
            Tambahkan atlet secara manual untuk digunakan saat mendaftar lomba.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {athletes.map((a) => (
            <div key={a.id} className="pub-card flex items-center justify-between p-4">
              <div>
                <div className="font-semibold text-[var(--m-ink)]">{a.full_name}</div>
                <div className="text-xs text-[var(--m-muted)]">
                  {a.gender === 'female' ? 'Putri' : 'Putra'}
                  {a.grade_level ? ` · ${a.grade_level}` : ''}
                  {a.class_name ? ` ${a.class_name}` : ''}
                  {a.schools?.name ? ` · ${a.schools.name}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(a)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold transition-colors hover:bg-accent"
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(a)}
                  disabled={deletingId === a.id}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Hapus
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-lg space-y-4 rounded-2xl border bg-card p-6 shadow-lg"
          >
            <h3 className="text-lg font-bold text-[var(--m-ink)]">
              {editing ? 'Edit Atlet' : 'Tambah Atlet'}
            </h3>

            {formError && (
              <div className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">
                {formError}
              </div>
            )}

            {editing && <input type="hidden" name="id" defaultValue={editing.id} />}

            <div className="space-y-1">
              <label className="text-sm font-medium">Nama Lengkap</label>
              <input
                name="full_name"
                required
                defaultValue={editing?.full_name ?? ''}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Gender</label>
                <select
                  name="gender"
                  defaultValue={editing?.gender ?? 'male'}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                >
                  <option value="male">Putra</option>
                  <option value="female">Putri</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Tanggal Lahir</label>
                <input
                  type="date"
                  name="birth_date"
                  required
                  defaultValue={editing?.birth_date ?? ''}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Jenjang</label>
                <select
                  name="grade_level"
                  defaultValue={editing?.grade_level ?? 'SD'}
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
                  defaultValue={editing?.class_name ?? ''}
                  className="w-full rounded-lg border border-border px-3 py-2 text-sm"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Sekolah / Klub</label>
              <select
                name="school_id"
                defaultValue={editing?.school_id ?? ''}
                className="w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                <option value="">— Tanpa sekolah —</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditing(null);
                }}
                className="rounded-lg border border-border px-3.5 py-2 text-sm font-semibold transition-colors hover:bg-accent"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-ink disabled:opacity-50"
              >
                {saving ? 'Menyimpan…' : 'Simpan'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
