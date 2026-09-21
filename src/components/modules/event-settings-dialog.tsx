'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings2, CheckCircle2, AlertCircle } from 'lucide-react';
import type { Event } from '@/types/database';

interface EventSettingsDialogProps {
  event: Event;
}

export function EventSettingsDialog({ event }: EventSettingsDialogProps) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState({
    fee_per_event: String(event.fee_per_event || 100000),
    fee_calculation_mode: (event as any).fee_calculation_mode || 'per_event', // 'per_event' or 'flat_package'
    flat_package_limit: String((event as any).flat_package_limit || 3),
    flat_package_price: String((event as any).flat_package_price || 275000),
    use_unique_code: event.use_unique_code ?? true,
    unique_code_mode: event.unique_code_mode || 'random_3_digit',
    unique_code_fixed: String(event.unique_code_fixed || 0),
    unique_code_min: String(event.unique_code_min || 100),
    unique_code_max: String(event.unique_code_max || 999),
    bank_name: event.bank_name || 'Bank Central Asia (BCA)',
    bank_account_no: event.bank_account_no || '123347485',
    bank_account_name: event.bank_account_name || 'Panitia Pelaksana Renang',
  });

  // Load existing settings when modal opens
  useEffect(() => {
    if (!open) return;
    fetch(`/api/events/${event.id}/settings`)
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          setForm({
            fee_per_event: String(d.fee_per_event ?? 100000),
            fee_calculation_mode: d.fee_calculation_mode || 'per_event',
            flat_package_limit: String(d.flat_package_limit || 3),
            flat_package_price: String(d.flat_package_price || 275000),
            use_unique_code: d.use_unique_code ?? true,
            unique_code_mode: d.unique_code_mode || 'random_3_digit',
            unique_code_fixed: String(d.unique_code_fixed || 0),
            unique_code_min: String(d.unique_code_min || 100),
            unique_code_max: String(d.unique_code_max || 999),
            bank_name: d.bank_name || 'Bank Central Asia (BCA)',
            bank_account_no: d.bank_account_no || '123347485',
            bank_account_name: d.bank_account_name || 'Panitia Pelaksana Renang',
          });
        }
      })
      .catch((err) => {
        console.error('Error fetching event settings:', err);
      });
  }, [open, event.id]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess(false);

    try {
      const payload = {
        fee_per_event: Number(form.fee_per_event) || 100000,
        fee_calculation_mode: form.fee_calculation_mode,
        flat_package_limit: Number(form.flat_package_limit) || 3,
        flat_package_price: Number(form.flat_package_price) || 275000,
        use_unique_code: Boolean(form.use_unique_code),
        unique_code_mode: form.unique_code_mode,
        unique_code_fixed: Number(form.unique_code_fixed) || 0,
        unique_code_min: Number(form.unique_code_min) || 100,
        unique_code_max: Number(form.unique_code_max) || 999,
        bank_name: form.bank_name,
        bank_account_no: form.bank_account_no,
        bank_account_name: form.bank_account_name,
      };

      // Kirim ke API server JSON store (tidak gagal meskipun Supabase belum ada kolomnya)
      const res = await fetch(`/api/events/${event.id}/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error('Gagal menyimpan pengaturan event ke server.');
      }

      setSaving(false);
      setSuccess(true);
      setTimeout(() => {
        setOpen(false);
        setSuccess(false);
        router.refresh();
      }, 800);
    } catch (err: any) {
      setSaving(false);
      setError(err?.message || 'Terjadi kesalahan saat menyimpan pengaturan.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5 text-xs font-semibold">
          <Settings2 className="h-4 w-4 text-primary" />
          Atur Biaya & Kode Unik
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Settings2 className="h-5 w-5 text-primary" />
            Pengaturan Kode Unik & Rekening Event
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 pt-2 text-xs">
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/15 p-2.5 text-destructive text-xs">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-emerald-800 text-xs font-semibold">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              Pengaturan berhasil diperbarui!
            </div>
          )}

          {/* Biaya & Paket Pendaftaran */}
          <div className="space-y-3 rounded-xl border p-3 bg-slate-50/70">
            <h4 className="font-bold text-foreground uppercase tracking-wide text-[11px] text-primary">
              Skema Biaya & Paket Lomba
            </h4>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Mode Perhitungan Biaya</label>
              <select
                value={form.fee_calculation_mode}
                onChange={(e) => setForm((f) => ({ ...f, fee_calculation_mode: e.target.value }))}
                className="w-full rounded-md border border-input bg-white px-2.5 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="per_event">Per Nomor Lomba (Linear)</option>
                <option value="flat_package">Paket Hemat (Contoh: Rp 275rb untuk 3 Nomor Pertama)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="font-semibold text-slate-700">Biaya Pendaftaran per Nomor Lomba (Rp)</label>
              <Input
                type="number"
                min={0}
                step={1000}
                value={form.fee_per_event}
                onChange={(e) => setForm((f) => ({ ...f, fee_per_event: e.target.value }))}
                className="h-8 text-xs bg-white"
                required
              />
              <p className="text-[11px] text-muted-foreground">
                Nominal pokok per nomor lomba jika tidak menggunakan paket hemat.
              </p>
            </div>

            {form.fee_calculation_mode === 'flat_package' && (
              <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Maks Nomor Paket</label>
                  <Input
                    type="number"
                    min={1}
                    value={form.flat_package_limit}
                    onChange={(e) => setForm((f) => ({ ...f, flat_package_limit: e.target.value }))}
                    className="h-8 text-xs bg-white"
                    placeholder="Misal: 3"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700">Harga Paket (Rp)</label>
                  <Input
                    type="number"
                    min={0}
                    step={1000}
                    value={form.flat_package_price}
                    onChange={(e) => setForm((f) => ({ ...f, flat_package_price: e.target.value }))}
                    className="h-8 text-xs bg-white"
                    placeholder="Misal: 275000"
                  />
                </div>
                <p className="col-span-2 text-[11px] text-muted-foreground">
                  Contoh: 3 nomor pertama dikenakan total Rp 275.000, kelipatan/nomor ke-4 dan seterusnya mengikuti biaya per nomor biasa.
                </p>
              </div>
            )}
          </div>

          {/* Toggle Kode Unik */}
          <div className="rounded-xl border p-3 bg-slate-50/70 space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer font-bold text-foreground text-xs">
              <input
                type="checkbox"
                checked={form.use_unique_code}
                onChange={(e) => setForm((f) => ({ ...f, use_unique_code: e.target.checked }))}
                className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
              />
              Aktifkan Kode Unik Transfer Bank
            </label>

            {form.use_unique_code && (
              <div className="space-y-3 pt-1 border-t border-slate-200">
                <div className="space-y-1">
                  <label className="font-semibold text-slate-700 block">Mode Penentuan Kode Unik</label>
                  <select
                    value={form.unique_code_mode}
                    onChange={(e) => setForm((f) => ({ ...f, unique_code_mode: e.target.value as any }))}
                    className="w-full rounded-md border border-input bg-white px-2.5 py-1.5 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="random_3_digit">3 Digit Acak / Random (100 s/d 999) — [Rekomendasi]</option>
                    <option value="sequential">Nomor Urut Pendaftaran (Sequential: 001, 002, dst)</option>
                    <option value="fixed">Digit Tetap Identitas Event (Fixed)</option>
                    <option value="custom_range">Rentang Angka Kustom (Custom Range)</option>
                  </select>
                </div>

                {form.unique_code_mode === 'fixed' && (
                  <div className="space-y-1">
                    <label className="font-semibold text-slate-700">Nominal Digit Tetap (Contoh: 77)</label>
                    <Input
                      type="number"
                      min={1}
                      max={9999}
                      value={form.unique_code_fixed}
                      onChange={(e) => setForm((f) => ({ ...f, unique_code_fixed: e.target.value }))}
                      className="h-8 text-xs max-w-xs bg-white"
                    />
                  </div>
                )}

                {form.unique_code_mode === 'custom_range' && (
                  <div className="grid grid-cols-2 gap-2 max-w-xs">
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Min</label>
                      <Input
                        type="number"
                        value={form.unique_code_min}
                        onChange={(e) => setForm((f) => ({ ...f, unique_code_min: e.target.value }))}
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-semibold text-slate-700">Max</label>
                      <Input
                        type="number"
                        value={form.unique_code_max}
                        onChange={(e) => setForm((f) => ({ ...f, unique_code_max: e.target.value }))}
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-slate-500 italic">
                  Kode unik akan otomatis ditambahkan ke total transfer pendaftar agar pencocokan mutasi bank akurat.
                </p>
              </div>
            )}
          </div>

          {/* Rekening Bank */}
          <div className="space-y-3 pt-1">
            <h4 className="font-bold text-foreground uppercase tracking-wide text-[11px] text-primary">
              Informasi Rekening Bank Tujuan
            </h4>
            <div className="space-y-2">
              <div>
                <label className="font-semibold text-slate-700">Nama Bank</label>
                <Input
                  value={form.bank_name}
                  onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
                  placeholder="BCA / Bank Mandiri / BRI"
                  className="h-8 text-xs"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700">Nomor Rekening</label>
                  <Input
                    value={form.bank_account_no}
                    onChange={(e) => setForm((f) => ({ ...f, bank_account_no: e.target.value }))}
                    placeholder="Contoh: 1234567890"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Atas Nama Pemilik</label>
                  <Input
                    value={form.bank_account_name}
                    onChange={(e) => setForm((f) => ({ ...f, bank_account_name: e.target.value }))}
                    placeholder="Panitia Kejuaraan Renang"
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t flex items-center justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" size="sm" disabled={saving} className="font-bold">
              {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
