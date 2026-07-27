import { SidebarNav, MobileSidebar } from '@/components/layout/sidebar';
import { Waves } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50/50 dark:bg-slate-950">
      {/* Sidebar Desktop */}
      <aside className="hidden md:flex w-64 flex-col border-r bg-background h-screen sticky top-0">
        <div className="flex h-16 items-center gap-2 border-b px-6 shrink-0">
          <Waves className="h-7 w-7 text-blue-600" />
          <div>
            <h2 className="font-black text-lg tracking-tight leading-none">
              RAJENDRA
            </h2>
            <p className="text-[10px] text-muted-foreground font-semibold tracking-wider">
              SWIMMING MEET APP
            </p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <SidebarNav />
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Mobile Header Bar */}
        <header className="flex h-14 items-center justify-between border-b bg-background px-4 md:hidden sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <MobileSidebar />
            <Waves className="h-5 w-5 text-blue-600" />
            <span className="font-bold text-sm tracking-tight">Rajendra Meet</span>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}