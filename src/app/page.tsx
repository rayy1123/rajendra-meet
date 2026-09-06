import { LandingShell } from '@/components/layout/landing-shell';
import Link from 'next/link';
import { Waves, Phone, Mail, Share2, ArrowRight, Trophy, MapPin, CalendarDays, Sparkles, Users, Timer } from 'lucide-react';
import { ResultsTableSample } from '@/components/modules/results-table-sample';

export const metadata = {
  title: 'Rajendra Project — Event Organizer & SCMS',
  description:
    'Wujudkan event olahraga dan spesial dengan sistem manajemen lomba renang Rajendra Meet dan jasa EO/MICE yang terpercaya.',
};

const STATS = [
  { value: '10+ Thn', label: 'Pengalaman' },
  { value: '500+', label: 'Event Terselenggara' },
  { value: '100%', label: 'Kepuasan' },
  { value: 'Real-time', label: 'Respons' },
];

const PILLARS = [
  { title: 'Event Organizer & Manajemen Acara', desc: 'Manajemen acara olahraga, MICE, dan corporate end-to-end.' },
  { title: 'Palet Spesialis Renang & Karate', desc: 'Spesialis kompetisi renang dengan standar teknis resmi.' },
  { title: 'Jasa Crew Event Profesional', desc: 'Personalia event, panitia lapangan, dan operator acara.' },
  { title: 'Tim Medis Siaga & Ambulance Standby', desc: 'Protokol keselamatan dan ambulance standby.' },
  { title: 'Penyewaan Sarana & Prasarana', desc: 'Sarana dan prasarana acara siap pakai dan terawat.' },
];

const FEATURES = [
  { title: 'Auto Seeding & Heatings', desc: 'Pembagian heat otomatis berbasis seed time.' },
  { title: 'Realtime Touchpad', desc: 'Hasil lomba tampil live dan terpercaya.' },
  { title: 'Rekap Hasil & Rekor', desc: 'Cetak rekap per heat, series, dan rekor pertandingan.' },
  { title: 'PDF & Akreditasi', desc: 'Hasil resmi siap cetak untuk panitia dan juri.' },
];

const HERO_IMAGES = [
  { src: '/slider/hero-1.jpg', alt: 'Atlet renang di start block' },
  { src: '/slider/hero-2.jpg', alt: 'Atlet gaya bebas mid-stroke' },
  { src: '/slider/hero-3.jpg', alt: 'Atlet gaya dada menyentuh dinding' },
];

export default async function HomePage() {
  return (
    <LandingShell>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden border-b border-[var(--m-border)] bg-[var(--m-surface)] text-[var(--m-ink)]">
        <div className="pub-container relative grid grid-cols-1 items-center gap-10 pt-16 pb-12 sm:pt-24 sm:pb-16 lg:grid-cols-2 lg:gap-12">
          <div className="text-center lg:text-left">
            <span className="pub-chip mx-auto mb-5 w-fit lg:mx-0 border-[var(--m-border)] bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)]">
              <Waves className="h-3.5 w-3.5 text-[var(--m-aqua-ink)]" /> Rajendra Project
            </span>
            <h1 className="mx-auto max-w-xl lg:mx-0 text-3xl font-bold tracking-[-0.03em] sm:text-5xl text-[var(--m-ink)]">
              Wujudkan Event Olahraga &amp; Spesial Tanpa Beban —{' '}
              <span className="text-[var(--m-aqua-ink)]">We Make Everything Easy</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-[var(--m-muted)] sm:text-base">
              Rajendra Project adalah event organizer yang fokus pada olahraga, corporate event,
              dan MICE — dengan dukungan sistem manajemen kompetisi renang Rajendra Meet agar
              acara Anda terukur, transparan, dan profesional.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link href="/kontak" className="pub-btn-primary">
                Rekomendasi Event Organizer <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/kontak" className="pub-btn-ghost">
                Simulasi RAB Cepat
              </Link>
            </div>

            <dl className="mx-auto mt-10 grid max-w-md grid-cols-4 gap-3 lg:mx-0">
              {STATS.map((s) => (
                <div key={s.label} className="border-l border-[var(--m-border)] px-3 text-center first:border-l-0">
                  <dt className="text-lg font-bold text-[var(--m-ink)] sm:text-xl">{s.value}</dt>
                  <dd className="mt-0.5 text-[11px] text-[var(--m-muted)] sm:text-xs">{s.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {HERO_IMAGES.map((img) => (
                <div key={img.src} className="aspect-[3/4] rounded-2xl bg-white">
                  <img
                    src={img.src}
                    alt={img.alt}
                    className="h-full w-full rounded-2xl object-cover"
                    loading="eager"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== LAYANAN PILAR ===== */}
      <section className="pub-container py-12 sm:py-16">
        <div className="mb-8 text-center">
          <span className="pub-eyebrow">Layanan</span>
          <h2 className="h-title mt-2">5 Layanan Pilar Rajendra Project</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {PILLARS.map((item) => (
            <div key={item.title} className="pub-card p-5 text-center transition-ui hover:-translate-y-1 hover:shadow-pop">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)]">
                <Trophy className="h-5 w-5" />
              </div>
              <div className="text-sm font-semibold text-[var(--m-ink)]">{item.title}</div>
              <p className="mt-1 text-xs text-[var(--m-muted)]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== SCMS ===== */}
      <section className="pub-container py-12 sm:py-16">
        <div className="pub-card overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="flex flex-col justify-center gap-4 p-8 sm:p-10">
              <span className="pub-eyebrow">Produk Digital</span>
              <h2 className="h-title">SCMS — Swimming Competition Management System</h2>
              <p className="text-sm leading-relaxed text-[var(--m-muted)]">
                SCMS membantu panitia renang mengelola event mulai dari pendaftaran,
                penjadwalan heat, input hasil juri, hingga live result dan rekap medali.
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-[var(--m-ink)] sm:grid-cols-2">
                {FEATURES.map((f) => (
                  <div key={f.title} className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-[var(--m-aqua)]" /> {f.title}
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Link href="/scoreboard" className="pub-btn-primary">
                  Lihat Live Scoreboard <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
            <div className="min-h-56 sm:min-h-full">
              <ResultsTableSample />
            </div>
          </div>
        </div>
      </section>

      {/* ===== KONTAK & PROPOSAL ===== */}
      <section className="pub-container py-12 sm:py-16">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="pub-card p-6 sm:p-8">
            <h3 className="text-lg font-bold text-[var(--m-ink)]">Rajendra Event Assistant</h3>
            <p className="mt-2 text-sm text-[var(--m-muted)]">
              Butuh konsultasi event atau simulasi RAB? Tim kami siap membantu.
            </p>
            <div className="mt-4 space-y-2 text-sm text-[var(--m-muted)]">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-[var(--m-aqua)]" /> rajendra.project25@gmail.com
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-emerald-600" /> 0887-7151-189
              </div>
            </div>
          </div>
          <div className="pub-card p-6 sm:p-8">
            <h3 className="text-lg font-bold text-[var(--m-ink)]">Minta Proposal &amp; Penawaran RAB Resmi</h3>
            <form className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <input className="w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="Nama" />
              <input className="w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="Perusahaan" />
              <input className="w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="Email" />
              <input className="w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="Nomor HP" />
              <textarea className="col-span-full h-24 w-full rounded-lg border border-border px-3 py-2 text-sm" placeholder="Pesan" />
              <button type="button" className="col-span-full pub-btn-primary">
                Kirim Permintaan <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
