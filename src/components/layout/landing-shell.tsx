import Link from 'next/link';
import { Waves, Phone, Mail } from 'lucide-react';
import { LandingNav } from '@/components/layout/landing-nav';
import { ThemeToggle } from '@/components/modules/theme-toggle';

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

/**
 * Kerangka khusus halaman landing publik (beranda marketing).
 * Mirip dengan PublicShell namun dengan header nav lengkap dan footer
 * berisi kontak. Tema "Marine" (lihat globals.css).
 */
export function LandingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="pub-shell">
      <header className="pub-header">
        <div className="pub-container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img
              src="/brand/logo.png"
              alt="Rajendra Meet"
              className="h-9 w-auto rounded-md"
            />
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <LandingNav />
            <ThemeToggle />
            <Link href="/login" className="pub-btn-ghost">
              Masuk
            </Link>
            <Link href="/register" className="pub-btn-primary">
              Daftar
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[var(--m-border)] bg-[var(--m-surface)]">
        <div className="pub-container grid grid-cols-1 gap-8 py-10 sm:grid-cols-2">
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <img
                src="/brand/logo.png"
                alt="Rajendra Meet"
                className="h-9 w-auto rounded-md"
              />
            </Link>
            <p className="mt-3 max-w-md text-sm text-[var(--m-muted)]">
              Sistem manajemen kejuaraan renang yang memudahkan panitia
              menyelenggarakan lomba, mengelola peserta, dan menampilkan hasil
              secara real-time.
            </p>
          </div>

          <div className="sm:justify-self-end">
            <h4 className="mb-3 text-sm font-bold text-[var(--m-ink)]">Kontak</h4>
            <ul className="space-y-2.5 text-sm text-[var(--m-muted)]">
              <li>
                <a
                  href="https://wa.me/628877151189"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-[var(--m-aqua-ink)]"
                >
                  <Phone className="h-4 w-4 text-emerald-600" /> 0887-7151-189
                </a>
              </li>
              <li>
                <a
                  href="mailto:rajendra.project25@gmail.com"
                  className="inline-flex items-center gap-2 transition-colors hover:text-[var(--m-aqua-ink)]"
                >
                  <Mail className="h-4 w-4 text-[var(--m-aqua-ink)]" /> rajendra.project25@gmail.com
                </a>
              </li>
              <li>
                <a
                  href="https://instagram.com/rajendraproject25"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 transition-colors hover:text-[var(--m-aqua-ink)]"
                >
                  <InstagramIcon className="h-4 w-4 text-pink-600" /> @rajendraproject25
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[var(--m-border)] py-4">
          <div className="pub-container flex flex-col items-center justify-between gap-2 text-xs text-[var(--m-muted)] sm:flex-row">
            <p>© {new Date().getFullYear()} Rajendra Meet — Sistem Manajemen Kejuaraan Renang</p>
            <p className="flex items-center gap-1.5">
              <Waves className="h-3.5 w-3.5 text-[var(--m-aqua)]" /> Hasil Lomba Real-time
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
