import { PublicShell } from '@/components/layout/public-shell';
import { MapPin, MessageCircle, Camera, Play, Waves } from 'lucide-react';
import { KontakMap } from '@/components/modules/kontak-map';

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
    <PublicShell
      title="Hubungi Kami"
      subtitle="Kontak resmi Rajendra Meet — konsultasi kejuaraan, bantuan teknis, dan lokasi kantor."
      breadcrumbItems={[
        { label: 'Beranda', href: '/' },
        { label: 'Kontak' },
      ]}
    >
      {/* Kontak cards */}
      <section className="pub-container pt-2 pb-12">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {contacts.map((c, i) => {
            const Icon = c.icon;
            return (
              <div
                key={c.title}
                className="reveal group rounded-2xl border border-[var(--m-border)] bg-[var(--m-surface)] p-6 text-center shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-[var(--m-aqua)] hover:shadow-md"
                style={{ animationDelay: `${i * 110}ms` }}
              >
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--m-aqua)] to-[var(--m-aqua-deep)] text-white shadow-2xs transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-heading font-bold text-base text-[var(--m-ink)]">{c.title}</h3>
                {'lines' in c && c.lines ? (
                  <p className="mt-1.5 text-xs text-[var(--m-muted)] leading-relaxed">{c.lines.join(' ')}</p>
                ) : (
                  <div className="mt-1.5 space-y-1 text-xs">
                    {c.links!.map((l) => (
                      <a
                        key={l.href}
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block font-semibold text-[var(--m-aqua-deep)] transition-colors hover:text-[var(--m-aqua)] hover:underline"
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

        {/* Peta lokasi */}
        <div className="mt-8 overflow-hidden rounded-3xl shadow-soft">
          <KontakMap />
        </div>

        <p className="mt-6 flex items-center justify-center gap-2 text-sm text-[var(--m-muted)]">
          <Waves className="h-4 w-4 text-[var(--m-aqua)]" />
          Rajendra Meet — We Organize, You Achieve.
        </p>
      </section>
    </PublicShell>
  );
}
