'use client';

import Link from 'next/link';
import { MapPin, Phone, ArrowUp } from 'lucide-react';

function InstagramIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function YoutubeIcon({ className = 'h-4 w-4' }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

export function PublicFooter() {
  const scrollToTop = () => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
      <footer className="relative border-t border-[#134b6b] bg-gradient-to-br from-[#0c344b] via-[#0f435c] to-[#0a2c40] text-white">
        {/* Konten Utama Footer 4 Kolom */}
        <div className="pub-container grid grid-cols-1 gap-8 py-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Kolom 1: Logo Rajendra Meet + Logo Rajendra Organizer & Copyright */}
          <div className="space-y-4">
            <div className="flex flex-col gap-3">
              {/* Logo Rajendra Meet */}
              <div className="inline-flex w-fit items-center bg-white/95 px-3 py-1.5 rounded-xl shadow-xs">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/logo.png"
                  alt="Rajendra Meet"
                  className="h-7 w-auto object-contain"
                />
              </div>

              {/* Logo Rajendra Swimming Organizer */}
              <div className="inline-flex w-fit items-center pt-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/brand/rajendra-organizer-logo.png"
                  alt="Rajendra Swimming Organizer"
                  className="h-11 w-auto object-contain drop-shadow-md"
                />
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-1">
              © {new Date().getFullYear()} Rajendra Swimming Organizer.<br />
              All rights reserved.
            </p>

            {/* Social Media Icons */}
            <div className="flex items-center gap-3 pt-2 text-slate-300">
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 hover:text-white transition-colors"
                title="Instagram"
              >
                <InstagramIcon className="h-4 w-4" />
              </a>
              <a
                href="https://wa.me/628877151189"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 hover:text-white transition-colors"
                title="WhatsApp"
              >
                <Phone className="h-4 w-4" />
              </a>
              <a
                href="https://youtube.com"
                target="_blank"
                rel="noreferrer"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 hover:text-white transition-colors"
                title="YouTube"
              >
                <YoutubeIcon className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Kolom 2: Kontak */}
          <div className="space-y-3.5">
            <h4 className="text-base font-bold tracking-wide text-white">Kontak</h4>
            <div className="space-y-3 text-xs text-slate-200">
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-cyan-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">Alamat:</span>
                  <p className="text-slate-300 leading-relaxed mt-0.5">
                    Jl.Setu Babakan No.14A, Srengseng Sawah, Jagakarsa, Jakarta Selatan
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <Phone className="h-4 w-4 text-emerald-300 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">WhatsApp:</span>
                  <a
                    href="https://wa.me/628877151189"
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-300 hover:text-cyan-200 hover:underline transition-colors block mt-0.5"
                  >
                    08877151189 & 088999151189
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Kolom 3: Menu */}
          <div className="space-y-3.5">
            <h4 className="text-base font-bold tracking-wide text-white">Menu</h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link href="/" className="hover:text-cyan-200 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/kontak" className="hover:text-cyan-200 transition-colors">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link href="/kontak" className="hover:text-cyan-200 transition-colors">
                  Layanan Kami
                </Link>
              </li>
              <li>
                <Link href="/kontak" className="hover:text-cyan-200 transition-colors">
                  Kontak
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 4: Rajendra Swimming Organizer */}
          <div className="space-y-3">
            <h4 className="text-base font-bold tracking-wide text-white">
              Rajendra Swimming Organizer
            </h4>
            <p className="italic text-cyan-200 text-xs font-medium">
              &ldquo;We Organize, You Achieve&rdquo;
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">
              Mitra strategis dan terpercaya dalam penyelenggaraan acara olahraga renang di Indonesia.
            </p>
          </div>
        </div>

        {/* Bar Bawah Footer */}
        <div className="border-t border-white/10 bg-black/20">
          <div className="pub-container flex flex-col items-center justify-between gap-2 py-4 text-xs text-slate-400 sm:flex-row">
            <p>© 2014 - {new Date().getFullYear()} Rajendra Project. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link href="/kontak" className="hover:text-slate-200 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/kontak" className="hover:text-slate-200 transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Action Button */}
      <a
        href="https://wa.me/628877151189"
        target="_blank"
        rel="noreferrer"
        className="fixed bottom-16 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xl transition-all duration-300 hover:scale-110 hover:bg-[#20bd5a]"
        title="Hubungi Kami via WhatsApp"
      >
        <Phone className="h-5 w-5" />
      </a>

      {/* Floating Scroll-to-Top Button */}
      <button
        type="button"
        onClick={scrollToTop}
        className="fixed bottom-4 right-5 z-40 flex h-10 w-10 items-center justify-center rounded-full bg-slate-900/80 text-white shadow-lg backdrop-blur-sm transition-all duration-300 hover:scale-110 hover:bg-slate-900 border border-white/10"
        title="Kembali ke Atas"
      >
        <ArrowUp className="h-4 w-4" />
      </button>
    </>
  );
}
