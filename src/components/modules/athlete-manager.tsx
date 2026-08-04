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
  DialogTrigger,
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
import { Plus, Search, UserPlus, Loader2 } from 'lucide-react';

interface AthleteRow {
  id: string;
  athlete_number: string;
  full_name: string;
  gender: string;
  birth_date: string;
  grade_level: string;
  class_name: string;
  age_group: string;
  schools: { name: string } | null;
}

interface Opt {
  id: string;
  name: string;
}

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
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    event_id: events[0]?.id || '',
    athlete_number: '',
    full_name: '',
    gender: 'male',
    birth_date: '',
    grade_level: 'SMA',
    class_name: '',
    school_id: '',
  });

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return list.filter(
      (a) =>
        a.full_name.toLowerCase().includes(q) ||
        (a.schools?.name || '').toLowerCase().includes(q) ||
        (a.age_group || '').toLowerCase().includes(q)
    );
  }, [list, query]);

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.athlete_number || !form.birth_date) {
      toast.error('Nama, nomor atlet, dan tanggal lahir wajib diisi.');
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from('athletes')
      .insert({
        event_id: form.event_id || null,
        athlete_number: form.athlete_number,
        full_name: form.full_name,
        gender: form.gender,
        birth_date: form.birth_date,
        grade_level: form.grade_level,
        class_name: form.class_name,
        school_id: form.school_id || null,
      })
      .select(`id, athlete_number, full_name, gender, birth_date, grade_level, class_name, age_group, schools ( name )`)
      .single();

    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Atlet ditambahkan.');
    setList((l) => [...l, data as AthleteRow]);
    setOpen(false);
    setForm({ event_id: events[0]?.id || '', athlete_number: '', full_name: '', gender: 'male', birth_date: '', grade_level: 'SMA', class_name: '', school_id: '' });
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Cari nama, sekolah, atau KU…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4" /> Tambah Atlet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Tambah Atlet Baru</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Nomor Atlet</label>
                  <Input value={form.athlete_number} onChange={(e) => set('athlete_number', e.target.value)} placeholder="A-001" required />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Nama Lengkap</label>
                  <Input value={form.full_name} onChange={(e) => set('full_name', e.target.value)} placeholder="Nama Atlet" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Jenis Kelamin</label>
                  <Select value={form.gender} onValueChange={(v) => set('gender', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Putra</SelectItem>
                      <SelectItem value="female">Putri</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Tanggal Lahir</label>
                  <Input type="date" value={form.birth_date} onChange={(e) => set('birth_date', e.target.value)} required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Tingkat</label>
                  <Input value={form.grade_level} onChange={(e) => set('grade_level', e.target.value)} placeholder="SMA" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Kelas</label>
                  <Input value={form.class_name} onChange={(e) => set('class_name', e.target.value)} placeholder="Kelas 10" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Event</label>
                  <Select value={form.event_id} onValueChange={(v) => set('event_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Pilih event" /></SelectTrigger>
                    <SelectContent>
                      {events.map((e) => (
                        <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Sekolah</label>
                  <Select value={form.school_id} onValueChange={(v) => set('school_id', v)}>
                    <SelectTrigger><SelectValue placeholder="Pilih sekolah" /></SelectTrigger>
                    <SelectContent>
                      {schools.map((s) => (
                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Simpan Atlet
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>No</TableHead>
                <TableHead>Nama</TableHead>
                <TableHead>Sekolah</TableHead>
                <TableHead>KU</TableHead>
                <TableHead>Kelamin</TableHead>
                <TableHead>Tgl Lahir</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                    Belum ada atlet. Klik “Tambah Atlet” untuk memulai.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-mono text-xs">{a.athlete_number}</TableCell>
                    <TableCell className="font-medium">{a.full_name}</TableCell>
                    <TableCell>{a.schools?.name || 'Umum'}</TableCell>
                    <TableCell>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {a.age_group || '–'}
                      </span>
                    </TableCell>
                    <TableCell>{a.gender === 'female' ? 'Putri' : 'Putra'}</TableCell>
                    <TableCell className="text-muted-foreground">{a.birth_date}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
