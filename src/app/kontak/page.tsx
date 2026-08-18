import { PublicShell } from '@/components/layout/public-shell';
import { MapPin, MessageCircle, Camera, Play, Waves } from 'lucide-react';

const contacts = [
  {
    icon: MapPin,
    title: 'Alamat',
    lines: ['Jl. Setu Babakan No. 14A,', 'Srengseng Sawah, Jagakarsa,', 'Jakarta Selatan'],
  },
  {
    icon: MessageCircle,
    title: 'WhatsApp',
    links: [
      { label: '0887-7151-189', href: 'https://wa.me/628877151189' },
      { label: '0889-9915-1189', href: 'https://wa.me/6288999151189' },
    ],
  },
  {
    icon: Camera,
    title: 'Instagram',
    links: [{ label: '@rajendrarenang', href: 'https://www.instagram.com/rajendrarenang/' }],
  },
  {
    icon: Play,
    title: 'YouTube',
    links: [{ label: '@rajendrarenang', href: 'https://www.youtube.com/@rajendrarenang' }],
  },
];

export const metadata = {
  title: 'Hubungi Kami',
  description: 'Kontak Rajendra Meet — alamat, WhatsApp, Instagram, dan YouTube.',
};

export default function KontakPage() {
  return (
    <PublicShell>
      {/* Hero */}
      <section
        className="relative bg-cover bg-center text-white"
        style={{
          backgroundImage:
            'linear-gradient(rgba(13,44,66,0.62), rgba(13,44,66,0.62)), url(/brand/contact-hero.png)',
        }}
      >
        <div className="pub-container py-12 text-center sm:py-14">
          <p className="pub-eyebrow !text-white/80">Rajendra Meet · Kontak</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-4xl">Hubungi Kami</h1>
          <p className="mx-auto mt-2 max-w-xl text-sm text-white/85 sm:text-base">
            Kami siap membantu mewujudkan acara renang impian Anda — dari pendaftaran hingga
            live scoreboard.
          </p>
        </div>
      </section>

      {/* Kontak cards */}
      <section className="pub-container -mt-8 pb-12">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {contacts.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="reveal rounded-2xl bg-[var(--m-surface)] p-6 text-center shadow-soft"
                style={{ animationDelay: `${i * 110}ms` }}
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-[var(--m-aqua)] to-[var(--m-aqua-deep)] text-white transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold text-[var(--m-ink)]">{c.title}</h3>
                {'lines' in c && c.lines ? (
                  <p className="mt-1 text-sm text-[var(--m-muted)]">{c.lines.join(' ')}</p>
                ) : (
                  <div className="mt-1 space-y-0.5 text-sm">
                    {c.links!.map((l) => (
                      <a
                        key={l.href}
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-[var(--m-aqua-deep)] transition-colors hover:text-[var(--m-aqua)] hover:underline"
                      >
                        {l.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Map */}
        <div className="mt-8 overflow-hidden rounded-3xl shadow-soft">
          <iframe
            title="Lokasi Rajendra Meet"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d253840.656274439!2d106.68942838127395!3d-6.229746460330873!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e69f157c6a414e3%3A0x2e947c268b05b65d!2sSouth%20Jakarta%2C%20South%20Jakarta%20City%2C%20Jakarta!5e0!3m2!1sen!2sid!4v1663123456789!5m2!1sen!2sid"
            className="h-80 w-full border-0"
            allowFullScreen
            loading="lazy"
          />
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-[var(--m-muted)]">
          <Waves className="h-4 w-4 text-[var(--m-aqua)]" />
          Rajendra Meet — We Organize, You Achieve.
        </p>
      </section>
    </PublicShell>
  );
}
