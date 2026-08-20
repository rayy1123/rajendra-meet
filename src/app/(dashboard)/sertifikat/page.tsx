/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from '@/lib/supabase/server';
import { PageHeader } from '@/components/ui/page-header';
import { PrintButton } from '@/components/modules/print-button';
import { Trophy } from 'lucide-react';
import { Breadcrumb } from '@/components/ui/breadcrumb';

export const dynamic = 'force-dynamic';

interface CertRow {
  rank: number;
  swimmer: string;
  school: string | null;
  finish: number | null;
}

function fmt(ms: number | null): string {
  if (ms === null || ms <= 0) return '—';
  const totalSec = ms / 1000;
  const m = Math.floor(totalSec / 60);
  const s = (totalSec % 60).toFixed(2).padStart(5, '0');
  return m > 0 ? `${m}:${s}` : s;
}

export default async function CertificatePage({
  searchParams,
}: {
  searchParams: Promise<{ event?: string; ce?: string }>;
}) {
  const { event: eventId, ce: ceId } = await searchParams;
  const supabase = await createClient();

  const { data: events } = await supabase
    .from('events')
    .select('id, name')
    .order('start_date', { ascending: false });
  const current = events?.find((e) => e.id === eventId) ?? events?.[0] ?? null;

  let compEvents: { id: string; label: string }[] = [];
  let certs: CertRow[] = [];
  let eventLabel = '';
  let compLabel = '';

  if (current) {
    const { data: ce } = await supabase
      .from('competition_events')
      .select('id, name, stroke, distance_meters, gender')
      .eq('event_id', current.id)
      .order('distance_meters', { ascending: true });
    compEvents = (ce ?? []).map((c) => ({
      id: c.id,
      label: `${c.distance_meters}m ${c.stroke} ${c.gender === 'male' ? 'Putra' : 'Putri'}`,
    }));
    const ceCur = ce?.find((c) => c.id === ceId) ?? ce?.[0];
    if (ceCur) {
      eventLabel = current.name;
      compLabel = `${ceCur.distance_meters}m ${ceCur.stroke} ${ceCur.gender === 'male' ? 'Putra' : 'Putri'}`;
      const { data: assigns } = await supabase
        .from('heat_assignments')
        .select('id, heat_id, registration_id')
        .in(
          'heat_id',
          // ambil semua heat dari comp_event
          (
            await supabase
              .from('heats')
              .select('id')
              .eq('competition_event_id', ceCur.id)
          ).data?.map((h) => h.id) ?? [],
        );
      const ids = (assigns ?? []).map((a) => a.id);
      // Map assignment -> registration (kolom langsung)
      const regOfAssign: Record<string, string> = {};
      (assigns ?? []).forEach((a: any) => (regOfAssign[a.id] = a.registration_id));
      const regIds = (assigns ?? []).map((a: any) => a.registration_id).filter(Boolean);
      const { data: regRows } = await supabase
        .from('registrations')
        .select('id, athlete_id')
        .in('id', regIds);
      const athleteOfReg: Record<string, string> = {};
      (regRows ?? []).forEach((r: any) => (athleteOfReg[r.id] = r.athlete_id));
      const athIds = Object.values(athleteOfReg);
      const { data: athRows } = await supabase
        .from('athletes')
        .select('id, full_name, school_id')
        .in('id', athIds);
      const athName: Record<string, string> = {};
      const schoolOfAthlete: Record<string, string> = {};
      (athRows ?? []).forEach((a: any) => {
        athName[a.id] = a.full_name;
        schoolOfAthlete[a.id] = a.school_id;
      });
      const { data: schRows } = await supabase.from('schools').select('id, name');
      const schMap: Record<string, string> = {};
      (schRows ?? []).forEach((s: any) => (schMap[s.id] = s.name));

      const personOfAssign = (aid: string): { name: string; school: string | null } => {
        const athId = regOfAssign[aid] && athleteOfReg[regOfAssign[aid]];
        if (!athId) return { name: '—', school: null };
        const sid = schoolOfAthlete[athId];
        return { name: athName[athId] ?? '—', school: sid ? schMap[sid] ?? null : null };
      };

      if (ids.length > 0) {
        const { data: res } = await supabase
          .from('results')
          .select('time_ms, is_new_record, heat_assignment_id')
          .in('heat_assignment_id', ids)
          .eq('status', 'finished')
          .order('time_ms', { ascending: true })
          .limit(50);
        // Ambil 3 atlet BERBEDA tercepat (hindari atlet sama muncul berulang
        // karena seed bisa menempatkan satu atlet di beberapa lane/heat).
        const seen = new Set<string>();
        const picked: any[] = [];
        for (const r of res ?? []) {
          const p = personOfAssign(r.heat_assignment_id);
          if (seen.has(p.name)) continue;
          seen.add(p.name);
          picked.push({ ...r, _person: p });
          if (picked.length >= 3) break;
        }
        certs = picked.map((r: any, i: number) => ({
          rank: i + 1,
          swimmer: r._person.name,
          school: r._person.school,
          finish: r.time_ms,
        }));
      }
    }
  }

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <>
      <PageHeader
        title="Sertifikat Penghargaan"
        description="Cetak sertifikat juara 1–3 per nomor lomba. Gunakan tombol Cetak untuk menyimpan / kirim PDF."
      />
      <Breadcrumb items={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Sertifikat' }]} className="mb-1" />
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <span className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-[var(--m-ink)]">
            {current?.name ?? '—'}
          </span>
          <span className="rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-[var(--m-ink)]">
            {compEvents[0]?.label ?? '—'}
          </span>
          <PrintButton />
        </div>

        {certs.length === 0 ? (
          <div className="pub-card p-12 text-center">
            <Trophy className="mx-auto h-10 w-10 text-[var(--m-aqua)]" />
            <h3 className="mt-3 font-semibold text-[var(--m-ink)]">Belum ada hasil</h3>
            <p className="mt-1 text-sm text-[var(--m-muted)]">
              Nomor lomba ini belum memiliki hasil finished untuk dibuat sertifikat.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {certs.map((c) => (
              <div
                key={c.rank}
                className="relative overflow-hidden rounded-2xl border-4 border-[#D4AF37] bg-white p-8 shadow-lg"
              >
                <div className="absolute left-4 top-4 h-10 w-10 border-l-4 border-t-4 border-[#006780]/40" />
                <div className="absolute right-4 top-4 h-10 w-10 border-r-4 border-t-4 border-[#006780]/40" />
                <div className="absolute bottom-4 left-4 h-10 w-10 border-b-4 border-l-4 border-[#006780]/40" />
                <div className="absolute bottom-4 right-4 h-10 w-10 border-b-4 border-r-4 border-[#006780]/40" />
                <div className="flex flex-col items-center text-center">
                  <div className="text-5xl">{medals[c.rank - 1]}</div>
                  <h2 className="mt-3 text-2xl font-bold uppercase tracking-[0.2em] text-[#0f172a]">
                    Certificate of Achievement
                  </h2>
                  <div className="my-2 h-1 w-32 rounded-full bg-[#F97316]" />
                  <p className="text-sm italic text-[var(--m-muted)]">This is to certify that</p>
                  <h3 className="mt-1 bg-gradient-to-r from-[#0f172a] to-[#006780] bg-clip-text text-3xl font-bold text-transparent">
                    {c.swimmer.toUpperCase()}
                  </h3>
                  <p className="mt-1 text-sm">
                    representing <span className="font-semibold">{c.school ?? '—'}</span>
                  </p>
                  <div className="mt-4 rounded-xl bg-[var(--m-soft)] px-6 py-4">
                    <p className="text-xs uppercase tracking-wide text-[var(--m-muted)]">
                      meraih peringkat ke-{c.rank} pada
                    </p>
                    <p className="text-lg font-semibold text-[var(--m-aqua-ink)]">
                      {compLabel}
                    </p>
                    <p className="mt-2 text-sm text-[var(--m-muted)]">
                      dengan waktu resmi{' '}
                      <span className="rounded bg-[var(--m-aqua-soft)] px-2 py-0.5 font-mono font-bold text-[var(--m-ink)]">
                        {fmt(c.finish)}
                      </span>
                    </p>
                  </div>
                  <p className="mt-4 text-sm text-[var(--m-muted)]">{eventLabel}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
