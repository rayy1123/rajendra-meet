import { PublicShell } from '@/components/layout/public-shell';
import { Waves, Phone, Mail, Share2, ArrowRight, CheckCircle2, HeartHandshake, Stethoscope, Boxes, Trophy } from 'lucide-react';
import Link from 'next/link';

export const metadata = {
  title: 'Rajendra Project — Event Services Sejak 2013',
};

const SERVICES = [
  {
    icon: Trophy,
    title: 'Event Organizer (EO) & Manajemen Event',
    desc: 'Menangani berbagai jenis acara dari skala kecil hingga besar: seminar, konferensi, hiburan, perayaan, hingga kegiatan sosial.',
  },
  {
    icon: Waves,
    title: 'Paket Event Fun Swimming & Karate',
    desc: 'Layanan EO khusus olahraga seperti Fun Swimming dan kejuaraan Karate untuk sekolah, komunitas, maupun instansi.',
  },
  {
    icon: Boxes,
    title: 'Jasa Crew Event Professional',
    desc: 'Tenaga lapangan terlatih untuk persiapan teknis, pengaturan alat, operasional, hingga pembongkaran (load-out).',
  },
  {
    icon: Stethoscope,
    title: 'Jasa Tim Medis Siaga Event',
    desc: 'First Aid dan Tim Medis bersertifikat lengkap dengan peralatan medis dasar, siap di indoor maupun outdoor.',
  },
  {
    icon: HeartHandshake,
    title: 'Penyewaan Sarpras Event',
    desc: 'Penyewaan sarana dan prasarana penunjang kelancaran seluruh rangkaian acara Anda.',
  },
];

export default function HomePage() {
  return (
    <PublicShell>
      {/* Hero */}
      <section className="pub-container pt-12 pb-8 text-center sm:pt-20">
        <span className="pub-chip mx-auto mb-5 w-fit">
          <Waves className="h-3.5 w-3.5 text-[var(--m-aqua)]" /> We Make Everything Easy · Sejak 2013
        </span>
        <h1 className="text-4xl font-black tracking-tight text-[var(--m-ink)] sm:text-5xl">
          Rajendra Project
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-[var(--m-muted)] sm:text-lg">
          Penyedia jasa penyelenggaraan acara (Event Services) berpengalaman sejak 2013.
          Solusi lengkap untuk Event Organizer, crew event, tim medis siaga, serta penyewaan
          sarana dan prasarana penunjang event.
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
          <Link href="/scoreboard" className="pub-btn-primary">
            Lihat Scoreboard <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/login" className="pub-btn-ghost">
            Masuk Panel
          </Link>
        </div>
      </section>

      {/* Layanan */}
      <section className="pub-container py-10">
        <h2 className="mb-6 text-center text-2xl font-bold text-[var(--m-ink)]">Layanan Kami</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {SERVICES.map((s) => (
            <div key={s.title} className="pub-card p-5">
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--m-aqua-soft)] text-[var(--m-aqua-ink)]">
                <s.icon className="h-5 w-5" />
              </span>
              <h3 className="text-base font-bold text-[var(--m-ink)]">{s.title}</h3>
              <p className="mt-2 text-sm text-[var(--m-muted)]">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Scoreboard */}
      <section className="pub-container py-6">
        <div className="pub-card flex flex-col items-center gap-4 bg-[var(--m-aqua-soft)] p-8 text-center sm:flex-row sm:text-left">
          <Trophy className="h-10 w-10 shrink-0 text-[var(--m-aqua-ink)]" />
          <div className="flex-1">
            <h3 className="text-lg font-bold text-[var(--m-ink)]">Pantau Hasil Lomba Secara Langsung</h3>
            <p className="text-sm text-[var(--m-muted)]">
              Buka scoreboard kejuaraan renang untuk melihat peringkat lintas heat secara realtime.
            </p>
          </div>
          <Link href="/scoreboard" className="pub-btn-primary shrink-0">
            Buka Scoreboard
          </Link>
        </div>
      </section>

      {/* Kontak */}
      <section className="pub-container py-10">
        <div className="pub-card p-6">
          <h2 className="mb-4 text-center text-xl font-bold text-[var(--m-ink)]">Hubungi Kami</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <a href="https://wa.me/628877151189" target="_blank" rel="noreferrer" className="pub-btn-ghost justify-center">
              <Phone className="h-4 w-4 text-emerald-600" /> 0887-7151-189
            </a>
            <a href="mailto:rajendra.project25@gmail.com" className="pub-btn-ghost justify-center">
              <Mail className="h-4 w-4 text-[var(--m-aqua-ink)]" /> rajendra.project25@gmail.com
            </a>
            <a href="https://instagram.com/rajendraproject25" target="_blank" rel="noreferrer" className="pub-btn-ghost justify-center">
              <Share2 className="h-4 w-4 text-pink-600" /> @rajendraproject25
            </a>
          </div>
          <p className="mt-4 text-center text-xs text-[var(--m-muted)]">
            Jakarta Selatan, DKI Jakarta 12640
          </p>
        </div>
      </section>

      {/* Konsultasi */}
      <section className="pub-container pb-16">
        <div className="rounded-2xl border border-[var(--m-border)] bg-[var(--m-surface)] p-6 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-9 w-9 text-[var(--m-aqua)]" />
          <p className="mx-auto max-w-lg text-sm text-[var(--m-ink)]">
            Butuh booking, konsultasi harga, atau penawaran (RAB)? Hubungi WhatsApp resmi
            <span className="font-semibold"> 0887-7151-189</span> atau email
            <span className="font-semibold"> rajendra.project25@gmail.com</span>.
          </p>
        </div>
      </section>
    </PublicShell>
  );
}
