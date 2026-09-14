'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Users, Trash2, Calendar, School, Sparkles, IdCard } from 'lucide-react';
import Link from 'next/link';

function generateAthleteNumber(): string {
  return `AT-${Math.floor(100000 + Math.random() * 900000)}`;
}

export interface UserAthleteItem {
  id: string;
  athlete_number: string;
  full_name: string;
  gender: string;
  birth_date: string;
  grade_level: string;
  class_name: string;
  age_group: string;
  school_id?: string | null;
  schools?: { id: string; name: string } | null;
}

export interface SchoolOption {
  id: string;
  name: string;
}

export function UserAthleteManager({
  initialAthletes,
  schools,
  userId,
}: {
  initialAthletes: UserAthleteItem[];
  schools: SchoolOption[];
  userId: string;
}) {
  const supabase = createClient();
  const [athletes, setAthletes] = useState<UserAthleteItem[]>(initialAthletes);
  const [openAdd, setOpenAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    athlete_number: '',
    full_name: '',
    gender: 'male',
    birth_date: '',
    grade_level: 'Umum',
    class_name: '',
    school_id: schools[0]?.id || '',
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.birth_date) {
      toast.error('Nama lengkap dan tanggal lahir wajib diisi.');
      return;
    }

    setSaving(true);
    try {
      const athleteNum = form.athlete_number.trim() || generateAthleteNumber();

      const { data, error } = await supabase
        .from('athletes')
        .insert({
          athlete_number: athleteNum,
          full_name: form.full_name.trim(),
          gender: form.gender,
          birth_date: form.birth_date,
          grade_level: form.grade_level || 'Umum',
          class_name: form.class_name || '-',
          school_id: form.school_id || null,
          owner_id: userId,
        })
        .select(`
          id,
          athlete_number,
          full_name,
          gender,
          birth_date,
          grade_level,
          class_name,
          age_group,
          schools ( id, name )
        `)
        .single();

      if (error) {
        throw new Error(error.message);
      }

      setAthletes((prev) => [data as unknown as UserAthleteItem, ...prev]);
      toast.success('Data atlet berhasil ditambahkan!');
      setOpenAdd(false);
      setForm({
        athlete_number: '',
        full_name: '',
        gender: 'male',
        birth_date: '',
        grade_level: 'Umum',
        class_name: '',
        school_id: schools[0]?.id || '',
      });
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menambahkan atlet.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus data atlet "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }

    setDeletingId(id);
    try {
      const { error } = await supabase.from('athletes').delete().eq('id', id);
      if (error) throw new Error(error.message);

      setAthletes((prev) => prev.filter((a) => a.id !== id));
      toast.success(`Atlet "${name}" telah dihapus.`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal menghapus atlet.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card border rounded-2xl p-5 shadow-xs">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Daftar Atlet Saya ({athletes.length})
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Kelola data diri atlet yang akan didaftarkan ke kejuaraan renang.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/daftar-lomba">
            <Button variant="outline" className="gap-2 text-xs font-semibold">
              <Sparkles className="w-4 h-4 text-amber-500" /> Daftar ke Lomba
            </Button>
          </Link>

          <Dialog open={openAdd} onOpenChange={setOpenAdd}>
            <DialogTrigger asChild>
              <Button className="gap-2 text-xs font-bold shadow-xs">
                <UserPlus className="w-4 h-4" /> Tambah Atlet Baru
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-base font-bold">
                  <UserPlus className="w-5 h-5 text-primary" /> Tambah Data Diri Atlet
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handleCreate} className="space-y-4 pt-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Nama Lengkap Atlet <span className="text-red-500">*</span>
                  </label>
                  <Input
                    placeholder="Contoh: Budi Pratama"
                    value={form.full_name}
                    onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Jenis Kelamin <span className="text-red-500">*</span>
                    </label>
                    <Select
                      value={form.gender}
                      onValueChange={(val) => setForm({ ...form, gender: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Putra (Laki-laki)</SelectItem>
                        <SelectItem value="female">Putri (Perempuan)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">
                      Tanggal Lahir <span className="text-red-500">*</span>
                    </label>
                    <Input
                      type="date"
                      value={form.birth_date}
                      onChange={(e) => setForm({ ...form, birth_date: e.target.value })}
                      required
                    />
                    <span className="text-[10px] text-muted-foreground">KU dihitung otomatis</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground">
                    Asal Sekolah / Klub Renang (Cabang)
                  </label>
                  <Select
                    value={form.school_id}
                    onValueChange={(val) => setForm({ ...form, school_id: val })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="-- Pilih Sekolah / Klub --" />
                    </SelectTrigger>
                    <SelectContent>
                      {schools.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">NIK / NISN (Opsional)</label>
                    <Input
                      placeholder="Nomor identitas"
                      value={form.athlete_number}
                      onChange={(e) => setForm({ ...form, athlete_number: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground">Jenjang Pendidikan</label>
                    <Select
                      value={form.grade_level}
                      onValueChange={(val) => setForm({ ...form, grade_level: val })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SD">SD / Sederajat</SelectItem>
                        <SelectItem value="SMP">SMP / Sederajat</SelectItem>
                        <SelectItem value="SMA">SMA / Sederajat</SelectItem>
                        <SelectItem value="Umum">Umum / Klub</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpenAdd(false)}
                    disabled={saving}
                  >
                    Batal
                  </Button>
                  <Button type="submit" disabled={saving} className="gap-1.5">
                    {saving ? 'Menyimpan...' : 'Simpan Data Atlet'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Athletes List */}
      {athletes.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
          <h3 className="font-bold text-base text-foreground">Belum ada atlet terdaftar</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Tambahkan data atlet Anda terlebih dahulu agar dapat didaftarkan ke nomor lomba pada kejuaraan renang.
          </p>
          <Button
            onClick={() => setOpenAdd(true)}
            className="mt-4 gap-2 text-xs font-bold"
          >
            <UserPlus className="w-4 h-4" /> Tambah Atlet Sekarang
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {athletes.map((a) => (
            <Card key={a.id} className="relative overflow-hidden hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-black text-base text-foreground tracking-tight line-clamp-1">
                      {a.full_name}
                    </h3>
                    <p className="text-xs font-mono text-muted-foreground">
                      ID: {a.athlete_number || '–'}
                    </p>
                  </div>
                  <Badge variant={a.gender === 'female' ? 'secondary' : 'default'} className="text-[10px] uppercase font-bold shrink-0">
                    {a.gender === 'female' ? 'Putri' : 'Putra'}
                  </Badge>
                </div>

                <div className="pt-2 border-t space-y-1.5 text-xs text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Lahir: <b>{a.birth_date}</b></span>
                    {a.age_group && (
                      <Badge variant="outline" className="text-[10px] font-bold border-amber-400 text-amber-700 dark:text-amber-300 ml-auto">
                        {a.age_group}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <School className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">Klub/Sekolah: <b>{a.schools?.name || 'Umum / Perorangan'}</b></span>
                  </div>
                </div>

                <div className="pt-3 border-t flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Link href={`/daftar-lomba?athleteId=${a.id}`}>
                      <Button variant="outline" size="sm" className="h-8 text-xs font-bold gap-1 text-primary hover:bg-primary/10">
                        Daftar Lomba &rarr;
                      </Button>
                    </Link>
                    <Link href={`/kartu-peserta?athleteId=${a.id}`}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs font-bold gap-1 border border-slate-200 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200"
                        title="Cetak Kartu Tanda Peserta Atlet Ini"
                      >
                        <IdCard className="w-3.5 h-3.5 text-primary" /> Kartu
                      </Button>
                    </Link>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(a.id, a.full_name)}
                    disabled={deletingId === a.id}
                    className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
