'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { GlassCard } from '@/components/ui/glass-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { Breadcrumb } from '@/components/ui/breadcrumb';


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
    fee_calculation_mode: 'per_event',
    flat_package_limit: '3',
    flat_package_price: '275000',
    use_unique_code: true,
    unique_code_mode: 'random_3_digit',
    unique_code_fixed: '0',
    unique_code_min: '100',
    unique_code_max: '999',
    fee_per_event: '50000',
    bank_name: 'Bank Central Asia (BCA)',
    bank_account_no: '',
    bank_account_name: 'Panitia Pelaksana Renang',
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
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
    <div className="mx-auto max-w-7xl space-y-6 p-6">
      <Breadcrumb items={[{ label: 'Dasbor', href: '/dashboard' }, { label: 'Kejuaraan / Events', href: '/events' }, { label: 'Buat Event Baru' }]} className="mb-2" />
      <PageHeader
        title="Buat Event Kejuaraan Baru"
        description="Isi detail kejuaraan renang: nama, penyelenggara, lokasi, jadwal, konfigurasi kolam, biaya, dan kode unik transfer."
      />
      <GlassCard className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && <div className="rounded-lg bg-destructive/15 px-3 py-2 text-sm text-destructive">{error}</div>}
            
            {/* 1. Informasi Umum Event */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">1. Informasi Umum Kejuaraan</h3>
              <div className="space-y-1">
                <label htmlFor="name" className="text-sm font-medium">Nama Kejuaraan</label>
                <Input id="name" required value={form.name} onChange={set('name')} placeholder="Kejurda Banten 2026" />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="organizer" className="text-sm font-medium">Penyelenggara</label>
                  <Input id="organizer" value={form.organizer} onChange={set('organizer')} placeholder="Pengprov PRSI / Rajendra Swimming Organizer" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="location" className="text-sm font-medium">Lokasi / Venue Kolam</label>
                  <Input id="location" value={form.location} onChange={set('location')} placeholder="Kolam Renang Gelora Bung Karno" />
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
            </div>

            {/* 2. Konfigurasi Kolam */}
            <div className="space-y-4 pt-2">
              <h3 className="text-sm font-bold uppercase tracking-wider text-primary border-b pb-2">2. Konfigurasi Kolam & Lintasan</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="space-y-1">
                  <label htmlFor="pool_type" className="text-sm font-medium">Tipe Kolam</label>
                  <Input id="pool_type" value={form.pool_type} onChange={set('pool_type')} placeholder="Long Course / Short Course" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="lane_count" className="text-sm font-medium">Jumlah Lintasan</label>
                  <Input id="lane_count" type="number" min={1} max={12} value={form.lane_count} onChange={set('lane_count')} />
                </div>
                <div className="space-y-1">
                  <label htmlFor="pool_length_meters" className="text-sm font-medium">Panjang Kolam (m)</label>
                  <Input id="pool_length_meters" type="number" value={form.pool_length_meters} onChange={set('pool_length_meters')} />
                </div>
              </div>
            </div>

            {/* 3. Pengaturan Biaya & Kode Unik Transfer Bank */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-sm font-bold uppercase tracking-wider text-primary">3. Pengaturan Biaya & Kode Unik Transfer</h3>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                  Khusus Event Ini
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <label htmlFor="fee_calculation_mode" className="text-sm font-medium">Mode Perhitungan Biaya</label>
                  <select
                    id="fee_calculation_mode"
                    value={form.fee_calculation_mode}
                    onChange={set('fee_calculation_mode')}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="per_event">Per Nomor Lomba (Linear)</option>
                    <option value="flat_package">Paket Hemat (Contoh: Rp 275.000 untuk 3 Nomor Pertama)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="fee_per_event" className="text-sm font-medium">Biaya per Nomor Lomba (Rp)</label>
                  <Input
                    id="fee_per_event"
                    type="number"
                    min={0}
                    step={1000}
                    value={form.fee_per_event}
                    onChange={set('fee_per_event')}
                    placeholder="50000"
                  />
                  <p className="text-[11px] text-muted-foreground">Nominal pokok per nomor jika tidak pakai paket.</p>
                </div>
              </div>

              {form.fee_calculation_mode === 'flat_package' && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <label htmlFor="flat_package_limit" className="text-xs font-bold text-foreground">Maks Nomor Paket (Contoh: 3)</label>
                    <Input
                      id="flat_package_limit"
                      type="number"
                      min={1}
                      value={form.flat_package_limit}
                      onChange={set('flat_package_limit')}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label htmlFor="flat_package_price" className="text-xs font-bold text-foreground">Harga Paket (Contoh: 275000)</label>
                    <Input
                      id="flat_package_price"
                      type="number"
                      min={0}
                      step={1000}
                      value={form.flat_package_price}
                      onChange={set('flat_package_price')}
                      className="h-8 text-xs bg-white"
                    />
                  </div>
                  <p className="col-span-2 text-[11px] text-muted-foreground">
                    💡 Peserta yang mendaftar hingga {form.flat_package_limit} nomor pertama cukup membayar total Rp {Number(form.flat_package_price || 275000).toLocaleString('id-ID')}, dan kelipatan nomor berikutnya dihitung tarif reguler.
                  </p>
                </div>
              )}

              {form.use_unique_code && (
                <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
                  <div className="space-y-1">
                    <label htmlFor="unique_code_mode" className="text-xs font-bold text-foreground">Mode Penentuan Kode Unik</label>
                    <select
                      id="unique_code_mode"
                      value={form.unique_code_mode}
                      onChange={set('unique_code_mode')}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-medium ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="random_3_digit">3 Digit Acak / Random (100 s/d 999) — [Rekomendasi]</option>
                      <option value="sequential">Nomor Urut Pendaftaran (Sequential: 001, 002, dst)</option>
                      <option value="fixed">Digit Tetap Identitas Event (Fixed)</option>
                      <option value="custom_range">Rentang Angka Kustom (Custom Range)</option>
                    </select>
                  </div>

                  {form.unique_code_mode === 'fixed' && (
                    <div className="space-y-1">
                      <label htmlFor="unique_code_fixed" className="text-xs font-semibold">Nominal Digit Tetap (Contoh: 77)</label>
                      <Input
                        id="unique_code_fixed"
                        type="number"
                        min={1}
                        max={9999}
                        value={form.unique_code_fixed}
                        onChange={set('unique_code_fixed')}
                        className="h-8 text-xs max-w-xs"
                      />
                    </div>
                  )}

                  {form.unique_code_mode === 'custom_range' && (
                    <div className="grid grid-cols-2 gap-3 max-w-sm">
                      <div className="space-y-1">
                        <label htmlFor="unique_code_min" className="text-xs font-semibold">Batas Minimum</label>
                        <Input
                          id="unique_code_min"
                          type="number"
                          value={form.unique_code_min}
                          onChange={set('unique_code_min')}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label htmlFor="unique_code_max" className="text-xs font-semibold">Batas Maksimum</label>
                        <Input
                          id="unique_code_max"
                          type="number"
                          value={form.unique_code_max}
                          onChange={set('unique_code_max')}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  )}

                  <div className="text-[11px] text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200">
                    💡 <b>Contoh Hasil:</b> Jika atlet mendaftar 3 nomor lomba (3 × Rp {Number(form.fee_per_event || 50000).toLocaleString('id-ID')} = Rp {(3 * Number(form.fee_per_event || 50000)).toLocaleString('id-ID')}), maka total tagihan pendaftar menjadi <b>Rp {((3 * Number(form.fee_per_event || 50000)) + 382).toLocaleString('id-ID')}</b>.
                  </div>
                </div>
              )}

              {/* 4. Rekening Tujuan Pembayaran */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-1">
                <div className="space-y-1">
                  <label htmlFor="bank_name" className="text-sm font-medium">Nama Bank Tujuan</label>
                  <Input id="bank_name" value={form.bank_name} onChange={set('bank_name')} placeholder="BCA / Mandiri / BNI / BRI" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="bank_account_no" className="text-sm font-medium">Nomor Rekening</label>
                  <Input id="bank_account_no" value={form.bank_account_no} onChange={set('bank_account_no')} placeholder="1234567890" />
                </div>
                <div className="space-y-1">
                  <label htmlFor="bank_account_name" className="text-sm font-medium">Atas Nama Rekening</label>
                  <Input id="bank_account_name" value={form.bank_account_name} onChange={set('bank_account_name')} placeholder="Panitia Kejuaraan Renang" />
                </div>
              </div>
            </div>

            <Button type="submit" disabled={saving} className="w-full text-sm font-bold">
              {saving ? 'Menyimpan Event...' : 'Simpan & Publikasikan Event'}
            </Button>
          </form>
      </GlassCard>
    </div>
  );
}
