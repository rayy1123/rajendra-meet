import { LandingShell } from '@/components/layout/landing-shell';
import { Testimonials, type Testimonial } from '@/components/modules/testimonials';
import { PhotoSlider, ABOUT_PHOTOS } from '@/components/modules/photo-slider';
import { Waves, Phone, Mail, Share2, ArrowRight, Trophy, MapPin, CalendarDays, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export const metadata = {
  title: 'Rajendra Meet — Sistem Manajemen Kejuaraan Renang',
  description:
    'Rajendra Meet membantu panitia menyelenggarakan kejuaraan renang dengan mudah: pendaftaran peserta, penyusunan heat, input hasil, dan live scoreboard real-time.',
};

interface UpcomingEvent {
  id: string;
  name: string;
  location: string | null;
  organizer: string | null;
  start_date: string;
  end_date: string;
  logo_url: string | null;
}

export const dynamic = 'force-dynamic';

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

function formatTanggal(iso: string): { hari: string; bulan: string; tahun: string } {
  const d = new Date(iso + 'T00:00:00');
  return {
    hari: String(d.getDate()).padStart(2, '0'),
    bulan: BULAN[d.getMonth()],
    tahun: String(d.getFullYear()),
  };
}

function formatRentang(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`;
}

const TESTIMONIALS: Testimonial[] = [
  {
    text: 'Ini pertama kalinya anak saya ikut kompetisi yang dibantu Rajendra Meet, dan saya benar-benar menikmati setiap momennya! Suasananya mendukung, panitianya ramah, dan acaranya fun banget. Nggak sabar ikut event selanjutnya!',
    name: 'Nadine Kusuma',
    role: 'Orang Tua Peserta',
  },
  {
    text: 'Kejuaraan renang yang diselenggarakan lewat sistem ini sangat terorganisir dengan baik. Anak saya jadi semakin percaya diri dan semangat berlatih renang. Suasana kompetisinya seru tapi tetap menyenangkan untuk anak-anak!',
    name: 'Rina Setyawati',
    role: 'Orang Tua Peserta',
  },
  {
    text: 'Sebagai pelatih, saya sangat mengapresiasi penyelenggaraan lomba ini. Hasil muncul real-time, juri lebih cepat, dan orang tua bisa memantau langsung. Pengalaman positif untuk para atlet muda.',
    name: 'Andi Pratama',
    role: 'Pelatih Renang',
  },
  {
    text: 'Anak saya ikut lomba renang dari sini dan senang banget! Seru, banyak teman baru, dan langsung dapat peringkat di scoreboard. Pengen ikut lagi event selanjutnya!',
    name: 'Nayla',
    role: 'Peserta',
  },
];

export default async function HomePage() {
  const supabase = await createClient();

  const { data: events } = await supabase
    .from('events')
    .select(
      'id, name, location, organizer, start_date, end_date, logo_url',
    )
    .eq('is_published', true)
    .gte('start_date', new Date().toISOString().slice(0, 10))
    .order('start_date', { ascending: true })
    .limit(6);

  const upcoming = (events ?? []) as UpcomingEvent[];

  return (
    <LandingShell>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[var(--m-aqua-soft)] via-[var(--m-bg)] to-[var(--m-bg)]" />
        {/* floating soft blobs — biar nggak kaku */}
        <div className="absolute -left-16 top-10 -z-10 h-64 w-64 rounded-full bg-[var(--m-aqua)]/20 blur-3xl animate-blob" />
        <div className="absolute -right-10 top-40 -z-10 h-72 w-72 rounded-full bg-[var(--m-aqua-2)]/20 blur-3xl animate-blob-slow" />

        <div className="pub-container grid grid-cols-1 items-center gap-10 pt-16 pb-12 sm:pt-24 sm:pb-16 lg:grid-cols-2 lg:gap-12">
          {/* Teks */}
          <div className="text-center lg:text-left">
            <span className="pub-chip mx-auto mb-5 w-fit lg:mx-0">
              <Waves className="h-3.5 w-3.5 text-[var(--m-aqua)]" /> Sistem Kejuaraan Renang · Sejak 2013
            </span>
            <h1 className="mx-auto max-w-xl text-4xl font-black leading-[1.1] tracking-tight text-[var(--m-ink)] sm:text-5xl lg:text-6xl">
              Selenggarakan lomba renang jadi{' '}
              <span className="bg-gradient-to-r from-[var(--m-aqua)] to-[var(--m-aqua-2)] bg-clip-text text-transparent">
                lebih mudah & terukur.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base text-[var(--m-muted)] sm:text-lg">
              Rajendra Meet membantu panitia mengelola pendaftaran peserta, menyusun
              heat, menginput hasil, dan menampilkan scoreboard secara real-time —
              semua dalam satu sistem yang ramah & menyenangkan.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link href="/scoreboard" className="pub-btn-primary">
                Lihat Jadwal Lomba <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/daftar-lomba" className="pub-btn-ghost">
                Daftar Lomba
              </Link>
            </div>

            <dl className="mx-auto mt-10 grid max-w-md grid-cols-3 gap-3 lg:mx-0">
              {[
                { v: 'Real-time', l: 'Live scoreboard' },
                { v: 'Otomatis', l: 'Penyusunan heat' },
                { v: 'Mudah', l: 'Daftar online' },
              ].map((s) => (
                <div key={s.l} className="pub-card rounded-2xl p-4 text-center transition-transform hover:-translate-y-1">
                  <dt className="text-lg font-bold text-[var(--m-aqua-ink)] sm:text-xl">{s.v}</dt>
                  <dd className="mt-0.5 text-xs text-[var(--m-muted)] sm:text-sm">{s.l}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Slider foto yang bergeser */}
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-tr from-[var(--m-aqua-soft)] to-[var(--m-aqua-2)]/30 blur-2xl" />
            <PhotoSlider className="aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5]" />
            <div className="absolute -bottom-5 -left-5 hidden items-center gap-2 rounded-2xl bg-white px-4 py-2.5 soft-shadow sm:inline-flex">
              <Sparkles className="h-4 w-4 text-[var(--m-aqua)]" />
              <span className="text-sm font-semibold text-[var(--m-ink)]">Seru & terukur</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== LOMBA YANG AKAN DATANG ===== */}
      <section className="pub-container py-12 sm:py-16">
        <div className="mb-8 text-center">
          <span className="pub-eyebrow">Event</span>
          <h2 className="mt-2 text-2xl font-bold text-[var(--m-ink)] sm:text-3xl">
            Lomba Yang Akan Datang
          </h2>
        </div>

        {upcoming.length === 0 ? (
          <div className="pub-card p-12 text-center">
            <Trophy className="mx-auto h-10 w-10 text-[var(--m-aqua)]" />
            <h3 className="mt-3 font-semibold text-[var(--m-ink)]">Belum ada lomba mendatang</h3>
            <p className="mt-1 text-sm text-[var(--m-muted)]">
              Pantau terus — kejuaraan berikutnya akan segera dibuka pendaftarannya.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {upcoming.map((ev) => {
              const tgl = formatTanggal(ev.start_date);
              return (
                <div key={ev.id} className="pub-card overflow-hidden">
                  <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">
                    {/* Tanggal */}
                    <div className="flex w-full shrink-0 items-center gap-3 sm:w-32 sm:flex-col sm:items-center sm:gap-0">
                      <div className="flex h-20 w-20 shrink-0 flex-col items-center justify-center rounded-2xl bg-[var(--m-aqua)] text-white sm:h-24 sm:w-24">
                        <span className="text-2xl font-black leading-none sm:text-3xl">{tgl.hari}</span>
                        <span className="text-xs font-semibold uppercase tracking-wide">{tgl.bulan.slice(0, 3)}</span>
                        <span className="text-[10px] font-medium opacity-90">{tgl.tahun}</span>
                      </div>
                    </div>

                    {/* Detail */}
                    <div className="flex-1">
                      <h3 className="text-lg font-bold leading-snug text-[var(--m-ink)]">{ev.name}</h3>
                      {ev.organizer && (
                        <p className="mt-0.5 text-xs font-medium text-[var(--m-aqua-ink)]">{ev.organizer}</p>
                      )}
                      {ev.location && (
                        <p className="mt-1.5 flex items-center gap-2 text-sm text-[var(--m-muted)]">
                          <MapPin className="h-4 w-4 text-[var(--m-aqua)]" /> {ev.location}
                        </p>
                      )}
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--m-muted)]">
                        <span className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 text-[var(--m-aqua)]" />
                          {formatRentang(ev.start_date)}
                          {ev.end_date !== ev.start_date && ` s/d ${formatRentang(ev.end_date)}`}
                        </span>
                      </div>
                    </div>

                    {/* CTA */}
                    <div className="shrink-0 sm:w-44">
                      <Link
                        href={`/scoreboard`}
                        className="pub-btn-primary w-full"
                      >
                        Detail & Hasil
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ===== TENTANG ===== */}
      <section className="pub-container py-12 sm:py-16">
        <div className="pub-card overflow-hidden rounded-3xl">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="flex flex-col justify-center gap-4 p-8 sm:p-10">
              <span className="pub-eyebrow">Tentang Rajendra Meet</span>
              <h2 className="text-2xl font-bold text-[var(--m-ink)] sm:text-3xl">
                Satu sistem untuk seluruh rangkaian kejuaraan renang
              </h2>
              <p className="text-sm leading-relaxed text-[var(--m-muted)] sm:text-base">
                <b>Rajendra Meet</b> adalah sistem manajemen kejuaraan renang yang
                dirancang ramah panitia dan peserta. Dari pendaftaran online,
                penyusunan heat otomatis, input hasil oleh juri, hingga live
                scoreboard yang bisa dipantau orang tua secara langsung — semua
                terintegrasi agar lomba berjalan lancar, transparan, dan menyenangkan.
              </p>
              <ul className="mt-2 grid grid-cols-1 gap-2 text-sm text-[var(--m-ink)] sm:grid-cols-2">
                {[
                  'Pendaftaran peserta online',
                  'Penyusunan heat & lane',
                  'Input hasil real-time',
                  'Live scoreboard & ranking',
                  'Rekap medali & rekor',
                  'Ekspor hasil ke Excel/PDF',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <Trophy className="h-4 w-4 shrink-0 text-[var(--m-aqua)]" /> {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="min-h-56 sm:min-h-full">
              <PhotoSlider photos={ABOUT_PHOTOS} className="h-full min-h-72" />
            </div>
          </div>
        </div>
      </section>

      {/* ===== TESTIMONI ===== */}
      <section className="pub-container py-12 sm:py-16">
        <div className="mb-8 text-center">
          <span className="pub-eyebrow">Testimoni</span>
          <h2 className="mt-2 text-2xl font-bold text-[var(--m-ink)] sm:text-3xl">
            Apa Kata Mereka
          </h2>
        </div>
        <Testimonials items={TESTIMONIALS} />
      </section>

      {/* ===== CTA KONTAK ===== */}
      <section className="pub-container py-12 sm:py-16">
        <div className="pub-card flex flex-col items-center gap-4 bg-[var(--m-aqua-soft)] p-8 text-center sm:flex-row sm:text-left">
          <Trophy className="h-10 w-10 shrink-0 text-[var(--m-aqua-ink)]" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[var(--m-ink)]">Butuh bantuan menyelenggarakan lomba?</h3>
            <p className="text-sm text-[var(--m-muted)]">
              Hubungi tim kami untuk konsultasi kejuaraan renang Anda.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href="https://wa.me/628877151189" target="_blank" rel="noreferrer" className="pub-btn-ghost">
              <Phone className="h-4 w-4 text-emerald-600" /> 0887-7151-189
            </a>
            <a href="mailto:rajendra.project25@gmail.com" className="pub-btn-ghost">
              <Mail className="h-4 w-4 text-[var(--m-aqua-ink)]" /> Email
            </a>
            <a href="https://instagram.com/rajendraproject25" target="_blank" rel="noreferrer" className="pub-btn-ghost">
              <Share2 className="h-4 w-4 text-pink-600" /> Instagram
            </a>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
