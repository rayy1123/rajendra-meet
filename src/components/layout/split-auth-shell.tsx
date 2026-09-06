'use client';

import Link from 'next/link';
import { Waves } from 'lucide-react';
import { ReactNode } from 'react';

interface SplitAuthShellProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
  footerLinks?: { label: string; href: string }[];
}

export function SplitAuthShell({ children, title, subtitle, footerLinks = [] }: SplitAuthShellProps) {
  return (
    <div className="flex min-h-screen bg-[var(--m-bg)]">
      {/* Left panel */}
      <div className="flex w-full flex-col bg-[var(--m-surface)] lg:w-1/2">
        {/* Top bar */}
        <header className="flex h-16 items-center justify-between px-6 sm:px-10">
          <div className="flex items-center gap-2.5">
            <img src="/brand/logo.png" alt="Rajendra SCMS" className="h-8 w-auto rounded-md" />
            <span className="text-sm font-semibold tracking-tight text-[#0b1220]">
              Rajendra SCMS
            </span>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#334155] hover:text-[#0b1220]"
          >
            <span aria-hidden="true">←</span> Beranda
          </Link>
        </header>

        {/* Main form area */}
        <main className="flex-1 px-6 py-12 sm:px-10 sm:py-16">
          <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-[#0b1220]">{title}</h1>
              {subtitle && <p className="mt-2 text-sm text-[#334155]">{subtitle}</p>}
            </div>
            {children}
          </div>
        </main>

        {/* Footer */}
        <footer className="px-6 pb-6 pt-2 sm:px-10">
          <div className="flex flex-col items-center justify-between gap-2 text-xs text-[#64748b] sm:flex-row">
            <p>© {new Date().getFullYear()} Rajendra Sports System</p>
            <div className="flex items-center gap-4">
              {footerLinks.map((link) => (
                <Link key={link.href} href={link.href} className="hover:text-[#0b1220]">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </footer>
      </div>

      {/* Right visual panel */}
      <div
        className="hidden bg-[var(--m-aqua-soft)] lg:block lg:w-1/2"
        style={{
          backgroundImage: "url('/login-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="h-full w-full bg-white/25" />
      </div>
    </div>
  );
}
