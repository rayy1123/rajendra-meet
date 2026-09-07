import { LandingShell } from '@/components/layout/landing-shell';
import Link from 'next/link';
import { Waves, Phone, Mail, ArrowRight } from 'lucide-react';

export const metadata = {
  title: 'Rajendra Project — Event Organizer & SCMS',
  description: 'Wujudkan event olahraga dan spesial dengan sistem manajemen lomba renang Rajendra Meet dan jasa EO/MICE yang terpercaya.',
};

const HERO_IMAGES = [
  { src: '/slider/hero-1.jpg', alt: 'Atlet renang di start block' },
  { src: '/slider/hero-2.jpg', alt: 'Atlet gaya bebas mid-stroke' },
  { src: '/slider/hero-3.jpg', alt: 'Atlet gaya dada menyentuh dinding' },
];

export default async function HomePage() {
  return (
    <LandingShell>
      {/* HERO */}
      <section className="relative overflow-hidden border-b border-[var(--m-border)] bg-[var(--m-surface)] text-[var(--m-ink)]">
        <div className="pub-container relative grid grid-cols-1 items-center gap-10 pt-16 pb-12 sm:pt-24 sm:pb-16 lg:grid-cols-2 lg:gap-12">
          <div className="text-center lg:text-left">
            <span className="pub-chip mx-auto mb-5 w-fit lg:mx-0 border-[var(--m-border)] bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)]">
              <Waves className="h-3.5 w-3.5 text-[var(--m-aqua-ink)]" /> Rajendra Project
            </span>
            <h1 className="mx-auto max-w-xl lg:mx-0 text-3xl font-bold tracking-[-0.03em] sm:text-5xl text-[var(--m-ink)]">
              We Make Everything Easy
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-[var(--m-muted)] sm:text-base">
              Event organizer olahraga, MICE, dan sistem manajemen kejuaraan renang — profesional, terukur, dan mudah.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 lg:justify-start">
              <Link href="/kontak" className="pub-btn-primary">
                Rekomendasi Event Organizer <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/kontak" className="pub-btn-ghost">
                Simulasi RAB Cepat
              </Link>
            </div>
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

      {/* PANASAN */}
      <section className="pub-container py-12 sm:py-16">
        <div className="mb-8 text-center">
          <span className="pub-eyebrow">Layanan</span>
          <h2 className="h-title mt-2">5 Layanan Pilar Rajendra Project</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            { title: 'Event Organizer & Manajemen Acara', desc: 'Manajemen acara olahraga, MICE, dan corporate end-to-end.' },
            { title: 'Palet Spesialis Renang & Karate', desc: 'Spesialis kompetisi renang dengan standar teknis resmi.' },
            { title: 'Jasa Crew Event Profesional', desc: 'Personalia event, panitia lapangan, dan operator acara.' },
            { title: 'Tim Medis Siaga & Ambulance Standby', desc: 'Protokol keselamatan dan ambulance standby.' },
            { title: 'Penyewaan Sarana & Prasarana', desc: 'Sarana dan prasarana acara siap pakai dan terawat.' },
          ].map((item) => (
            <div key={item.title} className="pub-card p-5 text-center transition-ui hover:-translate-y-1 hover:shadow-pop">
              <div className="text-sm font-semibold text-[var(--m-ink)]">{item.title}</div>
              <p className="mt-1 text-xs text-[var(--m-muted)]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SCMS */}
      <section className="pub-container py-12 sm:py-16">
        <div className="pub-card overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="flex flex-col justify-center gap-4 p-8 sm:p-10">
              <span className="pub-eyebrow">Produk Digital</span>
              <h2 className="h-title">SCMS — Swimming Competition Management System</h2>
              <p className="text-sm leading-relaxed text-[var(--m-muted)]">
                SCMS membantu panitia renang mengelola event mulai dari pendaftaran, penjadwalan heat, input hasil juri, hingga live result dan rekap medali.
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-[var(--m-ink)] sm:grid-cols-2">
                {[
                  'Auto Seeding & Heatings',
                  'Realtime Touchpad',
                  'Rekap Hasil & Rekor',
                  'PDF & Akreditasi',
                ].map((t) => (
                  <div key={t} className="flex items-center gap-2">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--m-aqua)]" />
                    {t}
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Link href="/scoreboard" className="pub-btn-primary">
                  Lihat Live Scoreboard <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </LandingShell>
  );
}
