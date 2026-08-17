import { SidebarNav, MobileSidebar } from '@/components/layout/sidebar';
import { Waves } from 'lucide-react';
import Link from 'next/link';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      {/* Sidebar Desktop */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col border-r border-border bg-sidebar md:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <Waves className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-black text-base leading-none tracking-tight text-foreground">
              Rajendra Meet
            </h2>
            <p className="text-[10px] font-semibold tracking-[0.14em] text-muted-foreground">
              MANAJEMEN KEJUARAAN
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-4">
          <SidebarNav />
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        {/* Mobile Header Bar */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4 md:hidden">
          <div className="flex items-center gap-2">
            <MobileSidebar />
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Waves className="h-4 w-4" />
            </span>
            <span className="font-bold text-sm tracking-tight text-foreground">
              Rajendra Meet
            </span>
          </div>
          <Link
            href="/scoreboard"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Live
          </Link>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
