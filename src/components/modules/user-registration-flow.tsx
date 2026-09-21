'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Trophy,
  CalendarDays,
  MapPin,
  Users,
  ArrowRight,
  AlertCircle,
  Sparkles,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { formatTimeToMs } from '@/lib/utils';

export interface EventOption {
  id: string;
  name: string;
  location?: string | null;
  start_date: string;
  end_date: string;
  is_published: boolean;
}

export interface CompEventOption {
  id: string;
  event_id: string;
  order_no?: number | null;
  name: string;
  stroke: string;
  distance_meters: number;
  gender: string;
  age_group: string;
}

export interface MyAthleteOption {
  id: string;
  athlete_number: string;
  full_name: string;
  gender: string;
  birth_date: string;
  age_group: string;
  schools?: { id: string; name: string } | null;
}

export function UserRegistrationFlow({
  events,
  selectedEventId,
  compEvents,
  myAthletes,
  existingRegistrationIds,
}: {
  events: EventOption[];
  selectedEventId: string;
  compEvents: CompEventOption[];
  myAthletes: MyAthleteOption[];
  existingRegistrationIds: string[]; // "compEventId_athleteId"
}) {
  const router = useRouter();
  const supabase = createClient();

  const [activeEventId, setActiveEventId] = useState(selectedEventId || events[0]?.id || '');
  const [selectedAthleteId, setSelectedAthleteId] = useState(myAthletes[0]?.id || '');
  const [selectedCompEventIds, setSelectedCompEventIds] = useState<string[]>([]);
  const [seedTimes, setSeedTimes] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const activeEvent = events.find((e) => e.id === activeEventId);
  const activeAthlete = myAthletes.find((a) => a.id === selectedAthleteId);

  const handleEventChange = (eventId: string) => {
    setActiveEventId(eventId);
    setSelectedCompEventIds([]);
    router.push(`/daftar-lomba?eventId=${eventId}`);
  };

  // Filter nomor lomba yang cocok dengan jenis kelamin & KU atlet
  const availableCompEvents = useMemo(() => {
    if (!compEvents || compEvents.length === 0) return [];
    if (!activeAthlete) return compEvents;

    return compEvents.filter((ce) => {
      // Kecocokan gender
      const matchGender =
        ce.gender === activeAthlete.gender ||
        ce.gender === 'mixed' ||
        ce.gender === 'all';

      return matchGender;
    });
  }, [compEvents, activeAthlete]);

  const toggleSelectCompEvent = (compEventId: string) => {
    setSelectedCompEventIds((prev) =>
      prev.includes(compEventId)
        ? prev.filter((id) => id !== compEventId)
        : [...prev, compEventId]
    );
  };

  const handleSeedTimeChange = (compEventId: string, value: string) => {
    setSeedTimes((prev) => ({ ...prev, [compEventId]: value }));
  };

  const handleSubmitRegistration = async () => {
    if (!activeAthlete) {
      toast.error('Silakan pilih atlet yang akan didaftarkan.');
      return;
    }

    if (selectedCompEventIds.length === 0) {
      toast.error('Pilih minimal 1 nomor lomba yang akan diikuti.');
      return;
    }

    setSubmitting(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Sesi login telah berakhir.');

      // Masukkan pendaftaran untuk setiap nomor lomba yang dipilih
      for (const compId of selectedCompEventIds) {
        const timeInput = seedTimes[compId] || '';
        let seedTimeMs: number | null = null;
        if (timeInput) {
          const parsed = formatTimeToMs(timeInput);
          if (parsed && parsed > 0) seedTimeMs = parsed;
        }

        const { data: reg, error: regError } = await supabase
          .from('registrations')
          .insert({
            competition_event_id: compId,
            athlete_id: activeAthlete.id,
            seed_time_ms: seedTimeMs,
            registrant_id: user.id,
            payment_status: 'pending',
          })
          .select('id')
          .single();

        if (regError) {
          // Jika sudah terdaftar (duplicate key), skip atau lempar pesan ramah
          if (regError.code === '23505') continue;
          throw new Error(regError.message);
        }

        // Otomatis buat data verifikasi pembayaran pending
        if (reg?.id) {
          await supabase.from('payment_verifications').insert({
            registration_id: reg.id,
            status: 'pending',
            amount_due: 50000, // Biaya per nomor lomba standar Rp 50.000 (dapat disesuaikan panitia)
            notes: 'Menunggu konfirmasi dan upload bukti pembayaran peserta',
          });
        }
      }

      toast.success('Pendaftaran nomor lomba berhasil dikirim!');
      setSelectedCompEventIds([]);
      router.push('/pendaftaran-saya');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Gagal memproses pendaftaran.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Pemilihan Event & Profil Atlet */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pilihan Kejuaraan */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" /> 1. Pilih Kejuaraan Renang
            </CardTitle>
            <CardDescription className="text-xs">
              Pilih kompetisi yang pendaftarannya sedang dibuka.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {events.length === 0 ? (
              <p className="text-xs text-muted-foreground">Belum ada kejuaraan yang dibuka saat ini.</p>
            ) : (
              <Select value={activeEventId} onValueChange={handleEventChange}>
                <SelectTrigger className="font-semibold">
                  <SelectValue placeholder="Pilih Kejuaraan" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {activeEvent && (
              <div className="rounded-xl bg-muted/40 p-3 space-y-1 text-xs text-muted-foreground">
                <p className="font-bold text-foreground">{activeEvent.name}</p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  {activeEvent.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-primary" /> {activeEvent.location}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <CalendarDays className="w-3 h-3 text-primary" /> {activeEvent.start_date}
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pilihan Atlet Saya */}
        <Card className="shadow-xs">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-bold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> 2. Pilih Atlet yang Didaftarkan
              </span>
              <Link href="/atlet-saya" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
                <UserPlus className="w-3.5 h-3.5" /> Tambah Atlet
              </Link>
            </CardTitle>
            <CardDescription className="text-xs">
              Pilih atlet dari daftar data diri atlet yang Anda kelola.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {myAthletes.length === 0 ? (
              <div className="rounded-xl border border-dashed p-4 text-center space-y-2">
                <p className="text-xs text-muted-foreground">Anda belum memiliki data atlet terdaftar.</p>
                <Link href="/atlet-saya">
                  <Button size="sm" className="gap-1.5 text-xs font-bold">
                    <UserPlus className="w-3.5 h-3.5" /> Buat Data Atlet Dulu
                  </Button>
                </Link>
              </div>
            ) : (
              <Select value={selectedAthleteId} onValueChange={setSelectedAthleteId}>
                <SelectTrigger className="font-semibold">
                  <SelectValue placeholder="Pilih Atlet" />
                </SelectTrigger>
                <SelectContent>
                  {myAthletes.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.full_name} ({a.gender === 'female' ? 'Putri' : 'Putra'} - {a.age_group || 'KU'})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {activeAthlete && (
              <div className="rounded-xl bg-muted/40 p-3 space-y-1.5 text-xs text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-foreground">{activeAthlete.full_name}</span>
                  <Badge variant="outline" className="text-[10px] font-bold border-amber-400 text-amber-700">
                    {activeAthlete.age_group || 'Umum'}
                  </Badge>
                </div>
                <p>
                  Jenis Kelamin: <b>{activeAthlete.gender === 'female' ? 'Putri' : 'Putra'}</b> | Lahir: <b>{activeAthlete.birth_date}</b>
                </p>
                <p>Klub / Sekolah: <b>{activeAthlete.schools?.name || 'Umum / Perorangan'}</b></p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 2. Daftar Nomor Lomba yang Tersedia */}
      <Card className="shadow-xs">
        <CardHeader className="pb-3 border-b flex flex-col sm:flex-row justify-between sm:items-center gap-2">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" /> 3. Pilih Nomor Lomba yang Diikuti
            </CardTitle>
            <CardDescription className="text-xs">
              Centang nomor lomba yang ingin diikuti dan masukkan estimasi waktu terbaik (seed time opsional).
            </CardDescription>
          </div>
          {selectedCompEventIds.length > 0 && (
            <Badge className="bg-primary text-xs font-bold self-start sm:self-auto">
              {selectedCompEventIds.length} Nomor Terpilih (Total: Rp {(selectedCompEventIds.length * 50000).toLocaleString('id-ID')})
            </Badge>
          )}
        </CardHeader>

        <CardContent className="p-0">
          {availableCompEvents.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <AlertCircle className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="font-bold text-sm text-foreground">Tidak ada nomor lomba yang sesuai</p>
              <p className="text-xs mt-1">
                Pastikan kejuaraan memiliki nomor lomba untuk jenis kelamin atlet Anda.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {availableCompEvents.map((ce) => {
                const isSelected = selectedCompEventIds.includes(ce.id);
                const isAlreadyRegistered =
                  activeAthlete &&
                  existingRegistrationIds.includes(`${ce.id}_${activeAthlete.id}`);

                return (
                  <div
                    key={ce.id}
                    className={`p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-colors ${
                      isAlreadyRegistered
                        ? 'bg-muted/20 opacity-70'
                        : isSelected
                        ? 'bg-primary/5'
                        : 'hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected || isAlreadyRegistered}
                        disabled={isAlreadyRegistered}
                        onChange={() => toggleSelectCompEvent(ce.id)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-muted-foreground">
                            #{ce.order_no ?? '-'}
                          </span>
                          <h4 className="text-sm font-bold text-foreground">
                            {ce.name}
                          </h4>
                          {isAlreadyRegistered && (
                            <Badge variant="outline" className="text-[10px] border-emerald-500 text-emerald-600 bg-emerald-50">
                              Sudah Terdaftar
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Gaya: {ce.stroke} · Jarak: {ce.distance_meters}m · KU: {ce.age_group || 'Umum'} · Gender: {ce.gender === 'female' ? 'Putri' : 'Putra'}
                        </p>
                      </div>
                    </div>

                    {!isAlreadyRegistered && (
                      <div className="w-full sm:w-44 shrink-0">
                        <label className="text-[11px] font-semibold text-muted-foreground block mb-1">
                          Seed Time (cth: 32.50)
                        </label>
                        <Input
                          placeholder="00:00.00"
                          value={seedTimes[ce.id] || ''}
                          disabled={!isSelected}
                          onChange={(e) => handleSeedTimeChange(ce.id, e.target.value)}
                          className="h-8 text-xs font-mono"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Tombol Submit Pendaftaran */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 bg-card border rounded-2xl shadow-xs">
        <div>
          <p className="text-xs font-semibold text-muted-foreground">
            Total Nomor Lomba Dipilih: <b>{selectedCompEventIds.length}</b>
          </p>
          <p className="text-xs text-muted-foreground">
            Setelah dikirim, Anda dapat mengunggah bukti pembayaran di menu <b>Verifikasi Pembayaran</b>.
          </p>
        </div>

        <Button
          onClick={handleSubmitRegistration}
          disabled={submitting || selectedCompEventIds.length === 0 || !activeAthlete}
          className="gap-2 font-bold px-6 shadow-xs w-full sm:w-auto"
        >
          {submitting ? 'Memproses...' : 'Kirim Pendaftaran & Lanjut ke Pembayaran'}
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
