'use client';

import { useState, useMemo } from 'react';
import { Plus, Pencil, Trash2, Copy, Search, X, Download, ClipboardList } from 'lucide-react';
import {
  deleteAthlete,
  bulkDeleteAthletes,
  duplicateAthlete,
  type AthleteFormState,
} from '@/app/atlet-saya/actions';
import { AthleteFormModal, type AthleteFormValues } from '@/components/modules/athlete-form-modal';
import { EmptyState } from '@/components/ui/empty-state';
import { AthleteDetailModal, type AthleteDetail } from '@/components/modules/athlete-detail-modal';
import { ConfirmDialog } from '@/components/modules/confirm-dialog';
import { getKuCode } from '@/lib/age-category';

interface SchoolOpt {
  id: string;
  name: string;
}

interface RegInfo {
  athlete_id: string;
  id: string;
  event_name: string;
  comp_name: string;
  status: string;
}

interface AthleteRow {
  id: string;
  full_name: string;
  gender: 'male' | 'female';
  birth_date: string;
  age_group: string;
  grade_level: string;
  class_name: string;
  school_id: string | null;
  schools: { name: string } | null;
  parent_phone: string;
  medical_notes: string;
  height_cm: number | null;
  weight_kg: number | null;
}

const JENJANG_ORDER = ['PAUD/TK', 'SD', 'SMP', 'SMA'];

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

function csvEscape(v: string | null | number): string {
  const s = v === null || v === undefined ? '' : String(v);
  return `"${s.replace(/"/g, '""')}"`;
}

export function AthleteSayaManager({
  athletes,
  schools,
  registrations,
}: {
  athletes: AthleteRow[];
  schools: SchoolOpt[];
  registrations: RegInfo[];
}) {
  const [search, setSearch] = useState('');
  const [filterJenjang, setFilterJenjang] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'age'>('name');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<AthleteFormValues | null>(null);
  const [detail, setDetail] = useState<AthleteDetail | null>(null);
  const [confirm, setConfirm] = useState<{ kind: 'one' | 'bulk'; id?: string } | null>(null);
  const [toast, setToast] = useState<{ ok: boolean; msg: string } | null>(null);

  const regsByAthlete = useMemo(() => {
    const m = new Map<string, RegInfo[]>();
    for (const r of registrations) {
      const list = m.get(r.athlete_id) ?? [];
      list.push(r);
      m.set(r.athlete_id, list);
    }
    return m;
  }, [registrations]);

  const filtered = useMemo(() => {
    let list = athletes.filter((a) => {
      if (search && !a.full_name.toLowerCase().includes(search.toLowerCase())) return false;
      if (filterJenjang && a.grade_level !== filterJenjang) return false;
      if (filterGender && a.gender !== filterGender) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      if (sortBy === 'age') return age(b.birth_date) - age(a.birth_date);
      return a.full_name.localeCompare(b.full_name);
    });
    return list;
  }, [athletes, search, filterJenjang, filterGender, sortBy]);

  const grouped = useMemo(() => {
    const map = new Map<string, AthleteRow[]>();
    for (const a of filtered) {
      const key = JENJANG_ORDER.includes(a.grade_level) ? a.grade_level : a.grade_level || 'Lainnya';
      const arr = map.get(key) ?? [];
      arr.push(a);
      map.set(key, arr);
    }
    return JENJANG_ORDER.filter((j) => map.has(j)).map((j) => ({ jenjang: j, rows: map.get(j)! }));
  }, [filtered]);

  function showToast(ok: boolean, msg: string) {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 2500);
  }

  function openNew() {
    setEditing(null);
    setShowForm(true);
  }
  function openEdit(a: AthleteRow) {
    setEditing({
      id: a.id,
      full_name: a.full_name,
      gender: a.gender,
      birth_date: a.birth_date,
      grade_level: a.grade_level,
      class_name: a.class_name,
      school_id: a.school_id ?? '',
      parent_phone: a.parent_phone,
      medical_notes: a.medical_notes,
      height_cm: a.height_cm?.toString() ?? '',
      weight_kg: a.weight_kg?.toString() ?? '',
    });
    setShowForm(true);
  }
  function openDetail(a: AthleteRow) {
    setDetail({
      id: a.id,
      full_name: a.full_name,
      gender: a.gender,
      birth_date: a.birth_date,
      age_group: a.age_group,
      grade_level: a.grade_level,
      class_name: a.class_name,
      school_name: a.schools?.name ?? null,
      parent_phone: a.parent_phone,
      medical_notes: a.medical_notes,
      height_cm: a.height_cm,
      weight_kg: a.weight_kg,
      registrations: (regsByAthlete.get(a.id) ?? []).map((r) => ({
        id: r.id,
        event_name: r.event_name,
        comp_name: r.comp_name,
        status: r.status,
      })),
    });
  }

  async function doDelete() {
    if (!confirm) return;
    let res: AthleteFormState;
    if (confirm.kind === 'one' && confirm.id) {
      const fd = new FormData();
      fd.set('id', confirm.id);
      res = await deleteAthlete(fd);
    } else {
      const fd = new FormData();
      fd.set('ids', Array.from(selected).join(','));
      res = await bulkDeleteAthletes(fd);
      setSelected(new Set());
    }
    setConfirm(null);
    if (res.ok) showToast(true, 'Atlet dihapus.');
    else showToast(false, res.error ?? 'Gagal menghapus.');
  }

  async function doDuplicate(a: AthleteRow) {
    const fd = new FormData();
    fd.set('id', a.id);
    const res = await duplicateAthlete(fd);
    if (res.ok) showToast(true, 'Atlet diduplikasi.');
    else showToast(false, res.error ?? 'Gagal menduplikasi.');
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }

  function exportCsv() {
    const header = ['Nama', 'Gender', 'Tgl Lahir', 'Usia', 'Jenjang', 'Kelas', 'Sekolah', 'Kontak Ortu', 'Tinggi', 'Berat', 'Catatan Medis'];
    const rows = filtered.map((a) =>
      [
        a.full_name,
        a.gender === 'female' ? 'Putri' : 'Putra',
        a.birth_date,
        age(a.birth_date),
        a.grade_level,
        a.class_name,
        a.schools?.name ?? '',
        a.parent_phone,
        a.height_cm ?? '',
        a.weight_kg ?? '',
        a.medical_notes,
      ]
        .map(csvEscape)
        .join(',')
    );
    const csv = [header.map(csvEscape).join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'atlet-saya.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  const allVisibleSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.id));

  return (
    <div className="space-y-4">
      {toast && (
        <div
          className={`fixed bottom-4 right-4 z-[70] rounded-xl px-4 py-3 text-sm font-medium shadow-lg ${
            toast.ok ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
          }`}
        >
          {toast.msg}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama atlet…"
            className="w-full rounded-lg border border-border py-2 pl-9 pr-3 text-sm"
          />
        </div>
        <select
          value={filterJenjang}
          onChange={(e) => setFilterJenjang(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="">Semua Jenjang</option>
          {JENJANG_ORDER.map((j) => (
            <option key={j} value={j}>
              {j}
            </option>
          ))}
        </select>
        <select
          value={filterGender}
          onChange={(e) => setFilterGender(e.target.value)}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="">Semua Gender</option>
          <option value="male">Putra</option>
          <option value="female">Putri</option>
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as 'name' | 'age')}
          className="rounded-lg border border-border px-3 py-2 text-sm"
        >
          <option value="name">Urut: Nama</option>
          <option value="age">Urut: Usia</option>
        </select>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary-ink"
        >
          <Plus className="h-4 w-4" /> Tambah
        </button>
        <button
          type="button"
          onClick={exportCsv}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold transition-colors hover:bg-accent"
        >
          <Download className="h-4 w-4" /> CSV
        </button>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 && (
        <div className="flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-2 text-sm">
          <span className="font-medium">{selected.size} atlet dipilih</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-semibold hover:bg-accent"
            >
              <X className="h-3.5 w-3.5" /> Batal
            </button>
            <button
              type="button"
              onClick={() => setConfirm({ kind: 'bulk' })}
              className="inline-flex items-center gap-1 rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" /> Hapus Terpilih
            </button>
          </div>
        </div>
      )}

      {/* Select-all */}
      {filtered.length > 0 && (
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={allVisibleSelected}
            onChange={(e) =>
              setSelected(e.target.checked ? new Set(filtered.map((a) => a.id)) : new Set())
            }
          />
          Pilih semua yang terlihat
        </label>
      )}

      {/* Empty state */}
      {athletes.length === 0 ? (
        <EmptyState
          title="Belum ada atlet"
          description="Tambahkan atlet untuk mulai mengelola data."
          action={
            <button
              type="button"
              onClick={openNew}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground"
            >
              <Plus className="h-4 w-4" /> Tambah Atlet
            </button>
          }
        />
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border bg-card p-8 text-center text-sm text-muted-foreground">
          Tidak ada atlet yang cocok dengan filter.
        </div>
      ) : (
        <div className="space-y-6">
          {grouped.map((g) => (
            <div key={g.jenjang}>
              <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{g.jenjang}</h3>
              <div className="overflow-hidden rounded-2xl border bg-card">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={g.rows.every((a) => selected.has(a.id))}
                          onChange={(e) => {
                            const next = new Set(selected);
                            for (const a of g.rows) {
                              if (e.target.checked) next.add(a.id);
                              else next.delete(a.id);
                            }
                            setSelected(next);
                          }}
                        />
                      </th>
                      <th className="px-3 py-2">Nama</th>
                      <th className="px-3 py-2">KU</th>
                      <th className="px-3 py-2">Gender</th>
                      <th className="px-3 py-2">Tgl Lahir</th>
                      <th className="px-3 py-2">Usia</th>
                      <th className="px-3 py-2">Sekolah</th>
                      <th className="px-3 py-2 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {g.rows.map((a) => {
                      const avatar = initials(a.full_name);
                      const athleteKu = a.age_group || (a.birth_date ? getKuCode(a.birth_date) : '–');
                      return (
                        <tr key={a.id} className="transition-colors hover:bg-muted/40">
                          <td className="px-3 py-3">
                            <input
                              type="checkbox"
                              checked={selected.has(a.id)}
                              onChange={() => toggleSelect(a.id)}
                            />
                          </td>
                          <td className="px-3 py-3">
                            <div className="flex items-center gap-3">
                              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                                {avatar}
                              </span>
                              <div>
                                <div className="font-medium">{a.full_name}</div>
                                <div className="text-xs text-muted-foreground">{a.class_name}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3">
                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
                              {athleteKu}
                            </span>
                          </td>
                          <td className="px-3 py-3">{a.gender === 'female' ? 'Putri' : 'Putra'}</td>
                          <td className="px-3 py-3">{a.birth_date}</td>
                          <td className="px-3 py-3">{age(a.birth_date)}</td>
                          <td className="px-3 py-3">{a.schools?.name ?? '-'}</td>
                          <td className="px-3 py-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => openEdit(a)}
                                className="rounded-lg border px-2 py-1 text-xs font-semibold hover:bg-accent"
                                title="Edit"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => openDetail(a)}
                                className="rounded-lg border px-2 py-1 text-xs font-semibold hover:bg-accent"
                                title="Detail"
                              >
                                <ClipboardList className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => doDuplicate(a)}
                                className="rounded-lg border px-2 py-1 text-xs font-semibold hover:bg-accent"
                                title="Duplikat"
                              >
                                <Copy className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirm({ kind: 'one', id: a.id })}
                                className="rounded-lg border border-red-200 px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                                title="Hapus"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form */}
      <AthleteFormModal
        open={showForm}
        initial={editing}
        schools={schools}
        onClose={() => setShowForm(false)}
        onSaved={() => {
          setShowForm(false);
          setEditing(null);
        }}
      />

      {/* Detail */}
      {detail && <AthleteDetailModal athlete={detail} onClose={() => setDetail(null)} />}

      {/* Confirm delete */}
      <ConfirmDialog
        open={!!confirm}
        onCancel={() => setConfirm(null)}
        onConfirm={doDelete}
        title={confirm?.kind === 'bulk' ? 'Hapus atlet terpilih?' : 'Hapus atlet?'}
        message={
          confirm?.kind === 'bulk'
            ? 'Tindakan ini akan menghapus semua atlet yang sedang dipilih.'
            : 'Tindakan ini tidak dapat dibatalkan.'
        }
        confirmLabel="Hapus"
        destructive
      />
    </div>
  );
}
