import { LandingShell } from '@/components/layout/landing-shell';
import { Testimonials, type Testimonial } from '@/components/modules/testimonials';
import { PhotoSlider } from '@/components/modules/photo-slider';
import { HeroBannerSlider } from '@/components/modules/hero-banner-slider';
import { AutoslidePhotoGallery } from '@/components/modules/autoslide-photo-gallery';
import { Waves, Phone, Mail, Share2, ArrowRight, Trophy, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { getServerShowcases } from '@/lib/data/landing-showcases-server';
import {
  UpcomingEventsShowcase,
  type UpcomingEventItem,
} from '@/components/modules/upcoming-events-showcase';
import { AboutSection } from '@/components/modules/about-section';
import { ServicesSection } from '@/components/modules/services-section';
import { ClientsSection } from '@/components/modules/clients-section';

export const metadata = {
  title: 'Rajendra Meet — Sistem Manajemen Kejuaraan Renang',
  description:
    'Rajendra Meet membantu panitia menyelenggarakan kejuaraan renang dengan mudah: pendaftaran peserta, penyusunan heat, input hasil, dan live scoreboard real-time.',
};

export const dynamic = 'force-dynamic';

const TESTIMONIALS: Testimonial[] = [
  {
    name: 'Naya Kurnia',
    role: 'Orang Tua Peserta',
    category: 'parent',
    event: 'Home Tournament Series IV',
    highlight: 'Suasana Ramah & Fun untuk Anak',
    rating: 5,
    club: 'Harahap Swimming School',
    text: 'Ini pertama kalinya anak saya ikut kompetisi yang diselenggarakan bersama Rajendra Meet, dan saya benar-benar menikmati setiap momennya! Suasananya sangat mendukung, panitianya ramah dan informatif, serta acaranya fun banget. Anak jadi tidak trauma berlomba, malah nggak sabar mau ikut event selanjutnya!',
  },
  {
    name: 'Koko Nugroho',
    role: 'Orang Tua Peserta',
    category: 'parent',
    event: 'Kejurda Pelajar Banten 2026',
    highlight: 'Disiplin Waktu & Terorganisir Rapih',
    rating: 5,
    club: 'Klub Akuatik Tirta',
    text: 'Event lomba renang dari Rajendra Meet sangat terorganisir dengan baik. Panggilan Call Room tertib, jadwal seri tepat waktu, dan anak saya jadi semakin percaya diri serta bersemangat berlatih renang. Suasana kompetisinya seru tapi tetap menyenangkan untuk anak-anak!',
  },
  {
    name: 'Willy Surya',
    role: 'Pelatih Kepala (Head Coach)',
    category: 'coach',
    event: 'Kejurnas Akuatik Seri I',
    highlight: 'Live Scoreboard Real-Time & Transparan',
    rating: 5,
    club: 'Jangkar Swimming Club',
    text: 'Sebagai pelatih, saya sangat mengapresiasi sistem Rajendra Meet. Fasilitas memadai, panitia ramah, hasil waktu muncul real-time di scoreboard, dan seluruh rangkaian acara berjalan lancar tepat waktu. Pengalaman yang sangat positif untuk pembinaan atlet muda.',
  },
  {
    name: 'Elly Anggraini',
    role: 'Wali Atlet Pemula',
    category: 'parent',
    event: 'Festival Renang Pelajar',
    highlight: 'Sertifikat & Medali Resmi Instan',
    rating: 5,
    club: 'Mandiri / Sekolah',
    text: 'Terima kasih Rajendra Meet sudah membuat event yang penuh semangat, sportivitas, dan keceriaan. Transparansi nomor lomba sangat jelas, dan sertifikat resmi berstempel langsung siap diunduh setelah acara selesai. Ditunggu event selanjutnya!',
  },
];

export default async function HomePage() {
  const supabase = await createClient();

  // Ambil data showcase yang telah diatur di Kelola Beranda SCMS (Poster, Stat, Galeri, Tentang, Pilar, Layanan/RAB, Client)
  const posters = getServerShowcases('poster');
  const stats = getServerShowcases('stat');
  const gallery = getServerShowcases('gallery');
  const aboutItems = getServerShowcases('about');
  const aboutItem = aboutItems.length > 0 ? aboutItems[0] : undefined;
  const pillars = getServerShowcases('pillar');
  const services = getServerShowcases('service');
  const clients = getServerShowcases('client');

  // Ambil data kejuaraan resmi dari database (prioritaskan mendatang, jika belum ada tampilkan event aktif)
  let upcomingEvents: UpcomingEventItem[] = [];
  const { data: futureEvents } = await supabase
    .from('events')
    .select('id, name, location, organizer, start_date, end_date, logo_url')
    .eq('is_published', true)
    .gte('start_date', new Date().toISOString().slice(0, 10))
    .order('start_date', { ascending: true })
    .limit(6);

  if (futureEvents && futureEvents.length > 0) {
    upcomingEvents = futureEvents as UpcomingEventItem[];
  } else {
    const { data: allEvents } = await supabase
      .from('events')
      .select('id, name, location, organizer, start_date, end_date, logo_url')
      .eq('is_published', true)
      .order('start_date', { ascending: false })
      .limit(6);
    upcomingEvents = (allEvents ?? []) as UpcomingEventItem[];
  }

  const heroPhotos = gallery
    .filter((g) => g.isActive && g.imageUrl)
    .map((g) => ({ src: g.imageUrl as string, alt: g.title }));

  return (
    <LandingShell>
      {/* ===== 1. WIDESCREEN HERO BANNER SLIDER (Sesuai Image #11: "Saatnya Jadi Juara") ===== */}
      <HeroBannerSlider />

      {/* ===== 2. CONTINUOUS AUTOSLIDE PHOTO GALLERY (Sesuai Image #11, #12, #13, #14) ===== */}
      <AutoslidePhotoGallery />

      {/* ===== 3. CORE OVERVIEW & VALUE PROPOSITION HERO ===== */}
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
            <h1 className="font-heading mx-auto max-w-xl text-4xl font-black leading-[1.08] tracking-tight text-[var(--m-ink)] sm:text-5xl lg:text-6xl">
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
              {stats
                .filter((s) => s.isActive)
                .slice(0, 3)
                .map((s) => (
                  <div
                    key={s.id}
                    className="pub-card rounded-2xl p-4 text-center transition-transform hover:-translate-y-1"
                  >
                    <dt className="text-lg font-bold text-[var(--m-aqua-ink)] sm:text-xl">
                      {s.value || '100+'}
                    </dt>
                    <dd className="mt-0.5 text-xs text-[var(--m-muted)] sm:text-sm">
                      {s.title}
                    </dd>
                  </div>
                ))}
            </dl>
          </div>

          {/* Slider foto yang bergeser */}
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-tr from-[var(--m-aqua-soft)] to-[var(--m-aqua-2)]/30 blur-2xl" />
            <PhotoSlider
              photos={heroPhotos.length > 0 ? heroPhotos : undefined}
              className="aspect-[4/5] sm:aspect-[4/3] lg:aspect-[4/5]"
            />
            <div className="absolute -bottom-5 -left-5 hidden items-center gap-2 rounded-2xl bg-white px-4 py-2.5 soft-shadow sm:inline-flex">
              <Sparkles className="h-4 w-4 text-[var(--m-aqua)]" />
              <span className="text-sm font-semibold text-[var(--m-ink)]">Seru & terukur</span>
            </div>
          </div>
        </div>
      </section>

      {/* ===== LOMBA YANG AKAN DATANG (TERHUBUNG KE KELOLA BERANDA SCMS) ===== */}
      <section className="pub-container py-12 sm:py-16">
        <div className="mb-8 text-center">
          <span className="pub-eyebrow">Event</span>
          <h2 className="mt-2 text-2xl font-bold text-[var(--m-ink)] sm:text-3xl">
            Lomba Yang Akan Datang
          </h2>
        </div>

        <UpcomingEventsShowcase
          initialPosters={posters}
          events={upcomingEvents}
        />
      </section>

      {/* ===== TENTANG KAMI & MENGAPA MEMILIH RAJENDRA SWIMMING ORGANIZER ===== */}
      <section id="tentang" className="pub-container scroll-mt-20 py-12 sm:py-16">
        <AboutSection
          about={aboutItem}
          pillars={pillars && pillars.length > 0 ? pillars : undefined}
        />
      </section>

      {/* ===== LAYANAN KAMI / PAKET RAB KEJUARAAN ===== */}
      <section id="layanan" className="pub-container scroll-mt-20 py-12 sm:py-16">
        <div className="mb-10 text-center space-y-2">
          <span className="pub-eyebrow">Layanan &amp; Paket RAB</span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-[var(--m-ink)]">
            Layanan Kami &amp; Estimasi RAB Event
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Paket manajemen teknologi informasi, tim IT berlisensi, sistem penyusunan heat otomatis, serta live timing scoreboard untuk kejuaraan renang Anda.
          </p>
        </div>

        <ServicesSection services={services && services.length > 0 ? services : undefined} />
      </section>

      {/* ===== KLIEN KAMI & DOKUMENTASI KOMUNITAS ===== */}
      <section className="pub-container py-12 sm:py-16">
        <ClientsSection clients={clients && clients.length > 0 ? clients : undefined} />
      </section>

      {/* ===== TESTIMONI & ULASAN PESERTA ===== */}
      <section id="testimoni" className="pub-container py-12 sm:py-16">
        <Testimonials items={TESTIMONIALS} />
      </section>

      {/* ===== CTA KONTAK ===== */}
      <section id="kontak" className="pub-container scroll-mt-20 py-12 sm:py-16">
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
