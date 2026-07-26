import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { 
  Plus, 
  MapPin, 
  Calendar, 
  Waves, 
  Trash2, 
  Edit, 
  Trophy 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// ==========================================
// SERVER ACTIONS
// ==========================================

async function createEventAction(formData: FormData) {
  'use server';
  const supabase = await createClient();

  const name = formData.get('name') as string;
  const organizer = formData.get('organizer') as string;
  const location = formData.get('location') as string;
  const start_date = formData.get('start_date') as string;
  const end_date = formData.get('end_date') as string;
  const pool_type = formData.get('pool_type') as string;
  const lane_count = parseInt(formData.get('lane_count') as string, 10);
  const description = formData.get('description') as string;

  const { error } = await supabase.from('events').insert({
    name,
    organizer,
    location,
    start_date,
    end_date,
    pool_type,
    pool_length_meters: pool_type === 'Short Course' ? 25 : 50,
    lane_count,
    description,
  });

  if (error) {
    console.error('Error creating event:', error.message);
    return;
  }

  revalidatePath('/events');
}

async function updateEventAction(formData: FormData) {
  'use server';
  const supabase = await createClient();

  const id = formData.get('id') as string;
  const name = formData.get('name') as string;
  const organizer = formData.get('organizer') as string;
  const location = formData.get('location') as string;
  const start_date = formData.get('start_date') as string;
  const end_date = formData.get('end_date') as string;
  const pool_type = formData.get('pool_type') as string;
  const lane_count = parseInt(formData.get('lane_count') as string, 10);
  const description = formData.get('description') as string;

  const { error } = await supabase.from('events').update({
    name,
    organizer,
    location,
    start_date,
    end_date,
    pool_type,
    pool_length_meters: pool_type === 'Short Course' ? 25 : 50,
    lane_count,
    description,
  }).eq('id', id);

  if (error) {
    console.error('Error updating event:', error.message);
    return;
  }

  revalidatePath('/events');
}

async function deleteEventAction(formData: FormData) {
  'use server';
  const supabase = await createClient();
  const id = formData.get('id') as string;

  const { error } = await supabase.from('events').delete().eq('id', id);

  if (error) {
    console.error('Error deleting event:', error.message);
    return;
  }

  revalidatePath('/events');
}

// ==========================================
// MAIN SERVER COMPONENT
// ==========================================

export default async function EventsPage() {
  const supabase = await createClient();
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Event Management</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Kelola kejuaraan renang, pengaturan lintasan kolam, dan jadwal perlombaan.
          </p>
        </div>

        {/* Modal Tambah Event */}
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Buat Event Baru
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Buat Kejuaraan Renang Baru</DialogTitle>
            </DialogHeader>
            <form action={createEventAction} className="space-y-4 py-2">
              <div className="space-y-1">
                <label className="text-xs font-semibold">Nama Event / Kejuaraan</label>
                <Input name="name" placeholder="Contoh: Kejurda Renang Jabar 2026" required />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Penyelenggara</label>
                  <Input name="organizer" placeholder="PRSI / Club" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Lokasi / Kolam Renang</label>
                  <Input name="location" placeholder="Kolam Renang UPI" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Tanggal Mulai</label>
                  <Input type="date" name="start_date" required />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Tanggal Selesai</label>
                  <Input type="date" name="end_date" required />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Jenis Kolam</label>
                  <Select name="pool_type" defaultValue="Long Course">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Long Course">Long Course (50m)</SelectItem>
                      <SelectItem value="Short Course">Short Course (25m)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">Jumlah Lane (Lintasan)</label>
                  <Select name="lane_count" defaultValue="8">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="6">6 Lane</SelectItem>
                      <SelectItem value="8">8 Lane</SelectItem>
                      <SelectItem value="10">10 Lane</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold">Deskripsi / Catatan Tambahan</label>
                <Input name="description" placeholder="Catatan singkat event..." />
              </div>

              <DialogFooter className="mt-6">
                <Button type="submit">Simpan Event</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Grid List Events */}
      {!events || events.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Trophy className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
          <h3 className="font-semibold text-lg">Belum Ada Event Kejuaraan</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Klik tombol "Buat Event Baru" di atas untuk menambahkan kejuaraan renang pertama kamu.
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {events.map((evt) => (
            <Card key={evt.id} className="hover:shadow-md transition-shadow flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg font-bold line-clamp-1">{evt.name}</CardTitle>
                  <span className="text-xs font-medium px-2 py-1 bg-primary/10 text-primary rounded-md whitespace-nowrap">
                    {evt.lane_count} Lane
                  </span>
                </div>
                <CardDescription className="text-xs">{evt.organizer}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-muted-foreground pb-4">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-primary" />
                  <span className="line-clamp-1">{evt.location}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-primary" />
                  <span>{evt.start_date} s/d {evt.end_date}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Waves className="w-3.5 h-3.5 text-primary" />
                  <span>{evt.pool_type} ({evt.pool_length_meters}m)</span>
                </div>
              </CardContent>

              {/* Action Buttons */}
              <div className="px-6 pb-4 pt-2 border-t flex items-center justify-between gap-2">
                {/* Modal Edit */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full gap-1">
                      <Edit className="w-3.5 h-3.5" /> Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Edit Kejuaraan Renang</DialogTitle>
                    </DialogHeader>
                    <form action={updateEventAction} className="space-y-4 py-2">
                      <input type="hidden" name="id" value={evt.id} />
                      <div className="space-y-1">
                        <label className="text-xs font-semibold">Nama Event</label>
                        <Input name="name" defaultValue={evt.name} required />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">Penyelenggara</label>
                          <Input name="organizer" defaultValue={evt.organizer} required />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">Lokasi</label>
                          <Input name="location" defaultValue={evt.location} required />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">Tanggal Mulai</label>
                          <Input type="date" name="start_date" defaultValue={evt.start_date} required />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">Tanggal Selesai</label>
                          <Input type="date" name="end_date" defaultValue={evt.end_date} required />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">Jenis Kolam</label>
                          <Select name="pool_type" defaultValue={evt.pool_type}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Long Course">Long Course (50m)</SelectItem>
                              <SelectItem value="Short Course">Short Course (25m)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-semibold">Jumlah Lane</label>
                          <Select name="lane_count" defaultValue={evt.lane_count.toString()}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="6">6 Lane</SelectItem>
                              <SelectItem value="8">8 Lane</SelectItem>
                              <SelectItem value="10">10 Lane</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter className="mt-6">
                        <Button type="submit">Perbarui Event</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>

                {/* Form Hapus */}
                <form action={deleteEventAction}>
                  <input type="hidden" name="id" value={evt.id} />
                  <Button variant="destructive" size="sm" type="submit" className="px-3">
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}