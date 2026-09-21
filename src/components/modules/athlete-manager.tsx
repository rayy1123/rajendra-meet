'use client';

import { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Plus,
  Search,
  UserPlus,
  Users,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Wand2,
  Edit2,
  Trash2,
  Calendar,
  Hash,
  User,
  School as SchoolIcon,
  Trophy,
  Sparkles,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { getKuCode, calculateAgeCategory, ageInYears } from '@/lib/age-category';
import { generateAthleteNumber } from '@/lib/utils';

export interface AthleteRow {
  id: string;
  athlete_number: string;
  full_name: string;
  gender: string;
  birth_date: string;
  grade_level: string;
  class_name: string;
  age_group: string;
  event_id?: string | null;
  school_id?: string | null;
  schools: { name: string } | null;
}

export interface Opt {
  id: string;
  name: string;
}

const KU_LABELS: Record<string, string> = {
  'KU Master': 'KU Master (22+ Th / Kelahiran ≤ 2004)',
  'KU Senior': 'KU Senior (19-21 Th / Kelahiran 2005–2007)',
  'KU 1': 'KU 1 (16-18 Th / SMA)',
  'KU 2': 'KU 2 (14-15 Th / SMP)',
  'KU 3': 'KU 3 (12-13 Th / SD 5-6)',
  'KU 4': 'KU 4 (10-11 Th / SD 3-4)',
  'KU 5': 'KU 5 (8-9 Th / SD 1-2)',
  'KU 6': 'KU 6 (≤ 7 Th / PAUD-TK)',
  'Senior': 'KU Senior (19-21 Th)',
  'Master': 'KU Master (22+ Th)',
};

export function AthleteManager({
  athletes,
  schools,
  events,
}: {
  athletes: AthleteRow[];
  schools: Opt[];
  events: Opt[];
}) {
  const supabase = createClient();
  const [list, setList] = useState<AthleteRow[]>(athletes);
  const [query, setQuery] = useState('');
  const [genderFilter, setGenderFilter] = useState<'all' | 'male' | 'female'>('all');
  const [kuFilter, setKuFilter] = useState<string>('all');
  const [sort, setSort] = useState<{ key: keyof AthleteRow; dir: 'asc' | 'desc' }>({
    key: 'full_name',
    dir: 'asc',
  });

  // Modal State
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    event_id: events[0]?.id || '',
    athlete_number: '',
    full_name: '',
    gender: 'male',
    birth_date: '',
    grade_level: 'SD',
    class_name: '',
    school_id: schools[0]?.id || '',
    age_group: 'KU 3',
  });

  // Daftar KU standar + dinamis dari database
  const kuOptions = useMemo(() => {
    const standard = ['KU Master', 'KU Senior', 'KU 1', 'KU 2', 'KU 3', 'KU 4', 'KU 5', 'KU 6'];
    const fromList = list
      .map((a) => a.age_group || (a.birth_date ? getKuCode(a.birth_date) : ''))
      .filter(Boolean);
    const set = new Set([...standard, ...fromList]);
    const order = ['KU Master', 'KU Senior', 'Senior', 'Master', 'KU 1', 'KU 2', 'KU 3', 'KU 4', 'KU 5', 'KU 6'];
    return Array.from(set).sort((a, b) => {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      return a.localeCompare(b);
    });
  }, [list]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const out = list.filter((a) => {
      const athleteKu = a.age_group || (a.birth_date ? getKuCode(a.birth_date) : '');
      const matchQ =
        !q ||
        a.full_name.toLowerCase().includes(q) ||
        (a.athlete_number || '').toLowerCase().includes(q) ||
        (a.schools?.name || '').toLowerCase().includes(q) ||
        athleteKu.toLowerCase().includes(q);
      const matchG = genderFilter === 'all' || a.gender === genderFilter;
      const matchKu = kuFilter === 'all' || athleteKu === kuFilter || a.age_group === kuFilter;
      return matchQ && matchG && matchKu;
    });

    const { key, dir } = sort;
    out.sort((a, b) => {
      let av: string, bv: string;
      if (key === 'schools') {
        av = (a.schools?.name || '').toString();
        bv = (b.schools?.name || '').toString();
      } else {
        av = (a[key] ?? '').toString();
        bv = (b[key] ?? '').toString();
      }
      return dir === 'asc' ? av.localeCompare(bv, 'id') : bv.localeCompare(av, 'id');
    });
    return out;
  }, [list, query, genderFilter, kuFilter, sort]);

  const toggleSort = (key: keyof AthleteRow) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' }));

  const renderSort = (col: keyof AthleteRow) => {
    if (sort.key !== col) return <ArrowUpDown className="h-3.5 w-3.5 opacity-40" />;
    return sort.dir === 'asc' ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />;
  };

  const setFormField = (k: keyof typeof form, v: string) => {
    if (k === 'birth_date' && v) {
      const autoKu = getKuCode(v);
      setForm((f) => ({ ...f, birth_date: v, age_group: autoKu }));
    } else {
      setForm((f) => ({ ...f, [k]: v }));
    }
  };

  // 1. Buka Modal Tambah Atlet (Nomor Otomatis Terisi)
  const handleOpenAdd = () => {
    const autoNumber = generateAthleteNumber(list);
    setEditingId(null);
    setForm({
      event_id: events[0]?.id || '',
      athlete_number: autoNumber,
      full_name: '',
      gender: 'male',
      birth_date: '',
      grade_level: 'SD',
      class_name: '',
      school_id: schools[0]?.id || '',
      age_group: 'KU 3',
    });
    setOpen(true);
  };

  // 2. Generate Ulang Nomor Atlet Otomatis
  const handleRegenerateNumber = () => {
    const autoNumber = generateAthleteNumber(list);
    setForm((f) => ({ ...f, athlete_number: autoNumber }));
    toast.info(`Nomor atlet otomatis diperbarui: ${autoNumber}`);
  };

  // 3. Buka Modal Edit Atlet
  const handleOpenEdit = (ath: AthleteRow) => {
    setEditingId(ath.id);
    setForm({
      event_id: ath.event_id || events[0]?.id || '',
      athlete_number: ath.athlete_number,
      full_name: ath.full_name,
      gender: ath.gender || 'male',
      birth_date: ath.birth_date || '',
      grade_level: ath.grade_level || 'SD',
      class_name: ath.class_name || '',
      school_id: ath.school_id || '',
      age_group: ath.age_group || (ath.birth_date ? getKuCode(ath.birth_date) : 'KU 3'),
    });
    setOpen(true);
  };

  // 4. Hapus Atlet
  const handleDelete = async (ath: AthleteRow) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus atlet "${ath.full_name}" (${ath.athlete_number})?`)) {
      return;
    }

    setDeletingId(ath.id);
    const { error } = await supabase.from('athletes').delete().eq('id', ath.id);
    setDeletingId(null);

    if (error) {
      toast.error('Gagal menghapus atlet: ' + error.message);
      return;
    }

    setList((prev) => prev.filter((a) => a.id !== ath.id));
    toast.success(`Atlet ${ath.full_name} berhasil dihapus.`);
  };

  // 5. Submit Form (Tambah / Edit)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.full_name.trim()) {
      toast.error('Nama lengkap atlet wajib diisi.');
      return;
    }

    if (!form.birth_date) {
      toast.error('Tanggal lahir wajib diisi.');
      return;
    }

    // Nomor atlet: Jika kosong secara manual, auto-generate otomatis
    const resolvedAthleteNumber = form.athlete_number.trim() || generateAthleteNumber(list);
    const resolvedKu = form.age_group || (form.birth_date ? getKuCode(form.birth_date) : 'KU 3');

    setSaving(true);

    if (editingId) {
      // Mode Edit
      const { data, error } = await supabase
        .from('athletes')
        .update({
          event_id: form.event_id || null,
          athlete_number: resolvedAthleteNumber,
          full_name: form.full_name.trim(),
          gender: form.gender,
          birth_date: form.birth_date,
          grade_level: form.grade_level,
          class_name: form.class_name.trim(),
          age_group: resolvedKu,
          school_id: form.school_id || null,
        })
        .eq('id', editingId)
        .select(`id, athlete_number, full_name, gender, birth_date, grade_level, class_name, age_group, event_id, school_id, schools ( name )`)
        .single();

      setSaving(false);
      if (error) {
        toast.error('Gagal mengupdate atlet: ' + error.message);
        return;
      }

      toast.success('Data atlet berhasil diperbarui.');
      setList((prev) => prev.map((a) => (a.id === editingId ? (data as AthleteRow) : a)));
      setOpen(false);
    } else {
      // Mode Tambah
      const { data, error } = await supabase
        .from('athletes')
        .insert({
          event_id: form.event_id || null,
          athlete_number: resolvedAthleteNumber,
          full_name: form.full_name.trim(),
          gender: form.gender,
          birth_date: form.birth_date,
          grade_level: form.grade_level,
          class_name: form.class_name.trim(),
          age_group: resolvedKu,
          school_id: form.school_id || null,
        })
        .select(`id, athlete_number, full_name, gender, birth_date, grade_level, class_name, age_group, event_id, school_id, schools ( name )`)
        .single();

      setSaving(false);
      if (error) {
        toast.error('Gagal menambahkan atlet: ' + error.message);
        return;
      }

      toast.success(`Atlet ${data.full_name} berhasil ditambahkan.`);
      setList((prev) => [data as AthleteRow, ...prev]);
      setOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* ── Toolbar Atas: Search, Filter, & Tambah Atlet ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama, nomor, sekolah, KU…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9 h-10 w-full"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Filter Kelamin */}
          <Select value={genderFilter} onValueChange={(v) => setGenderFilter(v as typeof genderFilter)}>
            <SelectTrigger className="h-10 w-[130px] shrink-0">
              <SelectValue placeholder="Kelamin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kelamin</SelectItem>
              <SelectItem value="male">Putra</SelectItem>
              <SelectItem value="female">Putri</SelectItem>
            </SelectContent>
          </Select>

          {/* Filter KU */}
          <Select value={kuFilter} onValueChange={setKuFilter}>
            <SelectTrigger className="h-10 w-[160px] shrink-0">
              <SelectValue placeholder="Kelompok Umur" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua KU (1 - 6)</SelectItem>
              {kuOptions.map((ku) => (
                <SelectItem key={ku} value={ku}>
                  {KU_LABELS[ku] || ku}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Tombol Tambah Atlet */}
          <Button
            onClick={handleOpenAdd}
            className="h-10 bg-[var(--m-aqua)] text-white hover:bg-[var(--m-aqua)]/90 font-semibold shadow-sm w-full sm:w-auto"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Tambah Atlet
          </Button>
        </div>
      </div>

      {/* ── Dialog / Modal Tambah & Edit Atlet ── */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl">
          <DialogHeader className="border-b border-border pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)]">
                {editingId ? <Edit2 className="h-5 w-5" /> : <UserPlus className="h-5 w-5" />}
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-[var(--m-ink)]">
                  {editingId ? 'Edit Data Atlet' : 'Tambah Atlet Baru'}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Nomor atlet dibuat otomatis oleh sistem dan KU dihitung dari tanggal lahir.
                </p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Row 1: Nomor Atlet (Auto) & Nama Lengkap */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-[var(--m-ink)] flex items-center gap-1.5">
                    <Hash className="h-3.5 w-3.5 text-primary" />
                    Nomor Atlet
                  </label>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700 border border-emerald-200">
                    <Sparkles className="h-3 w-3" /> Otomatis
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Input
                    value={form.athlete_number}
                    onChange={(e) => setFormField('athlete_number', e.target.value)}
                    placeholder="ATL-2026-001"
                    className="font-mono text-sm tracking-wider bg-slate-50/60 font-semibold text-[var(--m-ink)]"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRegenerateNumber}
                    className="h-10 px-2.5 text-xs text-muted-foreground hover:text-primary shrink-0"
                    title="Buat nomor acak baru"
                  >
                    <Wand2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">Bisa diubah jika atlet memiliki nomor BIB khusus.</p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--m-ink)] flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-primary" />
                  Nama Lengkap *
                </label>
                <Input
                  value={form.full_name}
                  onChange={(e) => setFormField('full_name', e.target.value)}
                  placeholder="Contoh: Rayhan Pratama"
                  required
                  className="h-10 text-sm"
                />
              </div>
            </div>

            {/* Row 2: Jenis Kelamin & Tanggal Lahir */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--m-ink)]">Jenis Kelamin *</label>
                <Select value={form.gender} onValueChange={(v) => setFormField('gender', v)}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">
                      <span className="flex items-center gap-2 font-medium text-blue-600">
                        <span className="h-2 w-2 rounded-full bg-blue-500" /> Putra (Laki-laki)
                      </span>
                    </SelectItem>
                    <SelectItem value="female">
                      <span className="flex items-center gap-2 font-medium text-rose-600">
                        <span className="h-2 w-2 rounded-full bg-rose-500" /> Putri (Perempuan)
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--m-ink)] flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-primary" />
                  Tanggal Lahir *
                </label>
                <Input
                  type="date"
                  value={form.birth_date}
                  onChange={(e) => setFormField('birth_date', e.target.value)}
                  required
                  className="h-10 text-sm"
                />
              </div>
            </div>

            {/* Row 3: Kelompok Umur (KU) dengan Info Otomatis */}
            <div className="space-y-1.5 rounded-xl border border-blue-100 bg-blue-50/40 p-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <label className="text-xs font-semibold text-blue-900">Kelompok Umur (KU)</label>
                {form.birth_date && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-full border border-blue-200 shadow-2xs">
                    <CheckCircle2 className="h-3 w-3 text-blue-600" />
                    Kategori Otomatis: {calculateAgeCategory(form.birth_date)}
                  </span>
                )}
              </div>
              <Select value={form.age_group} onValueChange={(v) => setFormField('age_group', v)}>
                <SelectTrigger className="h-10 w-full bg-white">
                  <SelectValue placeholder="Pilih Kelompok Umur" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KU Master">KU Master (22+ Tahun / Kelahiran ≤ 2004)</SelectItem>
                  <SelectItem value="KU Senior">KU Senior (19-21 Tahun / Kelahiran 2005–2007)</SelectItem>
                  <SelectItem value="KU 1">KU 1 (16-18 Tahun / SMA)</SelectItem>
                  <SelectItem value="KU 2">KU 2 (14-15 Tahun / SMP)</SelectItem>
                  <SelectItem value="KU 3">KU 3 (12-13 Tahun / SD 5-6)</SelectItem>
                  <SelectItem value="KU 4">KU 4 (10-11 Tahun / SD 3-4)</SelectItem>
                  <SelectItem value="KU 5">KU 5 (8-9 Tahun / SD 1-2)</SelectItem>
                  <SelectItem value="KU 6">KU 6 (≤ 7 Tahun / PAUD-TK)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Row 4: Jenjang & Kelas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--m-ink)]">Jenjang Pendidikan</label>
                <Select value={form.grade_level} onValueChange={(v) => setFormField('grade_level', v)}>
                  <SelectTrigger className="h-10 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TK">PAUD / TK</SelectItem>
                    <SelectItem value="SD">SD (Sekolah Dasar)</SelectItem>
                    <SelectItem value="SMP">SMP (Sekolah Menengah Pertama)</SelectItem>
                    <SelectItem value="SMA">SMA (Sekolah Menengah Atas)</SelectItem>
                    <SelectItem value="Umum">Umum / Mahasiswa</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--m-ink)]">Kelas</label>
                <Input
                  value={form.class_name}
                  onChange={(e) => setFormField('class_name', e.target.value)}
                  placeholder="Contoh: Kelas 3 / 10 MIPA"
                  className="h-10 text-sm"
                />
              </div>
            </div>

            {/* Row 5: Event & Sekolah / Klub */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1.5 min-w-0">
                <label className="text-xs font-semibold text-[var(--m-ink)] flex items-center gap-1.5">
                  <Trophy className="h-3.5 w-3.5 text-primary" />
                  Kejuaraan (Event)
                </label>
                <Select value={form.event_id} onValueChange={(v) => setFormField('event_id', v)}>
                  <SelectTrigger className="h-10 w-full min-w-0 overflow-hidden text-left">
                    <SelectValue placeholder="Pilih event" className="truncate" />
                  </SelectTrigger>
                  <SelectContent className="max-w-[320px] sm:max-w-[400px]">
                    {events.map((e) => (
                      <SelectItem key={e.id} value={e.id} className="truncate">
                        {e.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5 min-w-0">
                <label className="text-xs font-semibold text-[var(--m-ink)] flex items-center gap-1.5">
                  <SchoolIcon className="h-3.5 w-3.5 text-primary" />
                  Sekolah / Klub
                </label>
                <Select value={form.school_id} onValueChange={(v) => setFormField('school_id', v)}>
                  <SelectTrigger className="h-10 w-full min-w-0 overflow-hidden text-left">
                    <SelectValue placeholder="Pilih sekolah/klub" className="truncate" />
                  </SelectTrigger>
                  <SelectContent className="max-w-[320px] sm:max-w-[400px]">
                    {schools.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="truncate">
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <DialogFooter className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
                className="w-full sm:w-auto h-10"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="w-full sm:w-auto h-10 bg-[var(--m-aqua)] text-white hover:bg-[var(--m-aqua)]/90 font-semibold shadow-sm"
              >
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    {editingId ? 'Simpan Perubahan' : 'Simpan Atlet'}
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Konten Data: Info Jumlah & Reset Filter ── */}
      <div className="flex items-center justify-between gap-3 px-1">
        <p className="text-xs text-muted-foreground">
          Menampilkan <span className="font-semibold text-foreground">{filtered.length}</span> dari {list.length} atlet
        </p>
        {(genderFilter !== 'all' || kuFilter !== 'all' || query) && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-primary"
            onClick={() => {
              setGenderFilter('all');
              setKuFilter('all');
              setQuery('');
            }}
          >
            Reset filter & pencarian
          </Button>
        )}
      </div>

      {/* ── 1. Tampilan Desktop: Tabel Lengkap & Responsif ── */}
      <div className="hidden sm:block">
        <Card className="overflow-hidden border border-border/80 shadow-sm">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow className="hover:bg-transparent">
                    <TableHead
                      className="w-[140px] cursor-pointer select-none"
                      onClick={() => toggleSort('athlete_number')}
                    >
                      <span className="inline-flex items-center gap-1 font-semibold">
                        No. Atlet {renderSort('athlete_number')}
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => toggleSort('full_name')}
                    >
                      <span className="inline-flex items-center gap-1 font-semibold">
                        Nama Atlet {renderSort('full_name')}
                      </span>
                    </TableHead>
                    <TableHead
                      className="cursor-pointer select-none"
                      onClick={() => toggleSort('schools')}
                    >
                      <span className="inline-flex items-center gap-1 font-semibold">
                        Sekolah / Klub {renderSort('schools')}
                      </span>
                    </TableHead>
                    <TableHead
                      className="w-[130px] cursor-pointer select-none"
                      onClick={() => toggleSort('age_group')}
                    >
                      <span className="inline-flex items-center gap-1 font-semibold">
                        KU {renderSort('age_group')}
                      </span>
                    </TableHead>
                    <TableHead
                      className="w-[100px] cursor-pointer select-none"
                      onClick={() => toggleSort('gender')}
                    >
                      <span className="inline-flex items-center gap-1 font-semibold">
                        Kelamin {renderSort('gender')}
                      </span>
                    </TableHead>
                    <TableHead
                      className="w-[130px] cursor-pointer select-none"
                      onClick={() => toggleSort('birth_date')}
                    >
                      <span className="inline-flex items-center gap-1 font-semibold">
                        Tgl Lahir {renderSort('birth_date')}
                      </span>
                    </TableHead>
                    <TableHead className="w-[100px] text-right font-semibold">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="p-0">
                        <EmptyState
                          icon={<Users className="h-6 w-6" />}
                          title="Tidak ada atlet ditemukan"
                          description="Coba ubah kata kunci pencarian atau klik 'Tambah Atlet' untuk membuat atlet baru."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((a) => {
                      const effectiveKu = a.age_group || (a.birth_date ? getKuCode(a.birth_date) : '–');
                      return (
                        <TableRow key={a.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="font-mono text-xs font-semibold text-slate-700">
                            <span className="inline-block rounded bg-slate-100 px-2 py-1 border border-slate-200">
                              {a.athlete_number}
                            </span>
                          </TableCell>
                          <TableCell className="font-semibold text-[var(--m-ink)]">
                            {a.full_name}
                            {a.grade_level && (
                              <span className="block text-[11px] font-normal text-muted-foreground">
                                {a.grade_level} {a.class_name ? `• ${a.class_name}` : ''}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <SchoolIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="truncate max-w-[200px]">{a.schools?.name || 'Umum'}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-700 border border-blue-200">
                              {effectiveKu}
                            </span>
                          </TableCell>
                          <TableCell>
                            {a.gender === 'female' ? (
                              <span className="inline-flex items-center rounded-full bg-rose-50 px-2 py-0.5 text-xs font-medium text-rose-700 border border-rose-200">
                                Putri
                              </span>
                            ) : (
                              <span className="inline-flex items-center rounded-full bg-cyan-50 px-2 py-0.5 text-xs font-medium text-cyan-700 border border-cyan-200">
                                Putra
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {a.birth_date || '–'}
                            {a.birth_date && (
                              <span className="block text-[10px] text-slate-400">
                                ({ageInYears(new Date(a.birth_date))} th)
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenEdit(a)}
                                className="h-8 w-8 p-0 text-slate-600 hover:text-primary hover:bg-primary/10"
                                title="Edit Atlet"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(a)}
                                disabled={deletingId === a.id}
                                className="h-8 w-8 p-0 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                title="Hapus Atlet"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── 2. Tampilan Mobile: Kartu Responsif Stabil (<640px) ── */}
      <div className="sm:hidden space-y-3">
        {filtered.length === 0 ? (
          <Card>
            <CardContent className="p-0">
              <EmptyState
                icon={<Users className="h-6 w-6" />}
                title="Tidak ada atlet ditemukan"
                description="Coba ubah kata kunci pencarian atau klik 'Tambah Atlet' untuk membuat atlet baru."
              />
            </CardContent>
          </Card>
        ) : (
          filtered.map((a) => {
            const effectiveKu = a.age_group || (a.birth_date ? getKuCode(a.birth_date) : '–');
            return (
              <Card key={a.id} className="p-3.5 shadow-xs border border-border/80">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-[11px] font-bold text-slate-700 border border-slate-200">
                      {a.athlete_number}
                    </span>
                    {a.gender === 'female' ? (
                      <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 border border-rose-200">
                        Putri
                      </span>
                    ) : (
                      <span className="rounded-full bg-cyan-50 px-2 py-0.5 text-[11px] font-medium text-cyan-700 border border-cyan-200">
                        Putra
                      </span>
                    )}
                  </div>
                  <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700 border border-blue-200">
                    {effectiveKu}
                  </span>
                </div>

                <div className="mt-2">
                  <h4 className="font-bold text-sm text-[var(--m-ink)]">{a.full_name}</h4>
                  <div className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                    <SchoolIcon className="h-3.5 w-3.5 text-primary shrink-0" />
                    <span className="truncate">{a.schools?.name || 'Umum'}</span>
                  </div>
                  {a.grade_level && (
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      Jenjang: {a.grade_level} {a.class_name ? `• ${a.class_name}` : ''}
                    </p>
                  )}
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5">
                  <div className="text-[11px] text-muted-foreground">
                    Lahir: <span className="font-medium text-slate-700">{a.birth_date || '–'}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenEdit(a)}
                      className="h-8 px-2.5 text-xs"
                    >
                      <Edit2 className="mr-1 h-3 w-3" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(a)}
                      disabled={deletingId === a.id}
                      className="h-8 px-2.5 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 border-rose-200"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
