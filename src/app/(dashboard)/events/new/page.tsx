'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function NewEventPage() {
  const router = useRouter();
  const supabase = createClient();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: '',
    organizer: '',
    location: '',
    start_date: '',
    end_date: '',
    pool_type: 'Long Course',
    lane_count: '8',
    pool_length_meters: '50',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const { error } = await supabase.from('events').insert({
      name: form.name,
      organizer: form.organizer,
      location: form.location,
      start_date: form.start_date || new Date().toISOString().slice(0, 10),
      end_date: form.end_date || form.start_date || new Date().toISOString().slice(0, 10),
      pool_type: form.pool_type,
      lane_count: Number(form.lane_count) || 8,
      pool_length_meters: Number(form.pool_length_meters) || 50,
    });
    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }
    router.push('/events');
    router.refresh();
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      <Link href="/events" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Kembali ke Event
      </Link>
      <Card>
        <CardHeader>
          <CardTitle>Buat Event Kejuaraan Baru</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">{error}</div>}
            <div className="space-y-1">
              <label htmlFor="name" className="text-sm font-medium">Nama Kejuaraan</label>
              <Input id="name" required value={form.name} onChange={set('name')} placeholder="Kejurda Banten 2026" />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="organizer" className="text-sm font-medium">Penyelenggara</label>
                <Input id="organizer" value={form.organizer} onChange={set('organizer')} />
              </div>
              <div className="space-y-1">
                <label htmlFor="location" className="text-sm font-medium">Lokasi</label>
                <Input id="location" value={form.location} onChange={set('location')} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <label htmlFor="start_date" className="text-sm font-medium">Tanggal Mulai</label>
                <Input id="start_date" type="date" value={form.start_date} onChange={set('start_date')} />
              </div>
              <div className="space-y-1">
                <label htmlFor="end_date" className="text-sm font-medium">Tanggal Selesai</label>
                <Input id="end_date" type="date" value={form.end_date} onChange={set('end_date')} />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <label htmlFor="pool_type" className="text-sm font-medium">Tipe Kolam</label>
                <Input id="pool_type" value={form.pool_type} onChange={set('pool_type')} />
              </div>
              <div className="space-y-1">
                <label htmlFor="lane_count" className="text-sm font-medium">Jumlah Lintasan</label>
                <Input id="lane_count" type="number" min={1} value={form.lane_count} onChange={set('lane_count')} />
              </div>
              <div className="space-y-1">
                <label htmlFor="pool_length_meters" className="text-sm font-medium">Panjang (m)</label>
                <Input id="pool_length_meters" type="number" value={form.pool_length_meters} onChange={set('pool_length_meters')} />
              </div>
            </div>
            <Button type="submit" disabled={saving} className="w-full">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Simpan Event
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
