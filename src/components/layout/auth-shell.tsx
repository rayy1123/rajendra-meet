import Link from 'next/link';
import { Waves } from 'lucide-react';

interface AuthShellProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthShell({ children, title, subtitle }: AuthShellProps) {
  return (
    <div className="flex min-h-screen bg-muted/35 text-foreground">
      <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-full max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <img src="/brand/logo.png" alt="Rajendra Project" className="h-9 w-auto" />
            <span className="text-sm font-semibold tracking-tight text-foreground">Rajendra Project</span>
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Link href="/" className="rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted">
              Beranda
            </Link>
            <Link href="/scoreboard" className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90">
              Live Scoreboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 pt-16">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-3 py-1 text-xs font-medium text-foreground/80">
                <Waves className="h-3.5 w-3.5 text-primary" /> Rajendra Project
              </p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{title}</h1>
              {subtitle && <p className="mt-3 max-w-md text-sm text-muted-foreground">{subtitle}</p>}
            </div>
            <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-pop)] sm:p-8">
              {children}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-background">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-muted-foreground sm:flex-row sm:px-6">
          <p>© 2014 - 2026 Rajendra Project. All rights reserved.</p>
          <p>Bantuan teknis: 0887-7151-189</p>
        </div>
      </footer>
    </div>
  );
}
