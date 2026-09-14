'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export function SchoolAddDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    const { error } = await supabase.from('schools').insert([{ name, city: city || null }]);
    setLoading(false);
    if (error) {
      toast.error('Gagal menambah sekolah');
    } else {
      toast.success('Sekolah berhasil ditambahkan');
      setOpen(false);
      setName('');
      setCity('');
      router.refresh();
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" /> Tambah Sekolah / Klub
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Sekolah / Klub</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nama Sekolah / Klub *</label>
            <Input required value={name} onChange={(e) => setName(e.target.value)} placeholder="Masukkan nama..." />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Kota / Kabupaten</label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Opsional..." />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Batal</Button>
            <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
