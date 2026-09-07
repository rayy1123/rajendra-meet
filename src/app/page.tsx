import { LandingShell } from '@/components/layout/landing-shell';
import Link from 'next/link';
import { Phone, Mail } from 'lucide-react';

export const metadata = {
  title: 'Rajendra Project — Event Organizer & SCMS',
  description: 'Wujudkan event olahraga dan spesial dengan sistem manajemen lomba renang Rajendra Meet dan jasa EO/MICE yang terpercaya.',
};

export default async function HomePage() {
  return (
    <LandingShell>
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
    </LandingShell>
  );
}
