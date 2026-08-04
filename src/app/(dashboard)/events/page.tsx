import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function EventsPage() {
  const supabase = await createClient();

  // 1. Cek User Session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // 2. Fetch Data Events dari Supabase
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased pb-12">
      {/* HEADER / NAVBAR UTAMA */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold bg-linear-to-r from-blue-400 to-teal-400 bg-clip-text text-transparent">
                Rajendra Meet Manager
              </h1>
              <p className="text-xs text-slate-400">SCMS Platform</p>
            </div>
          </div>

          {/* Tombol Navigasi Kanan */}
          <div className="flex items-center space-x-3">
            <Link
              href="/scoreboard"
              target="_blank"
              className="hidden sm:flex items-center space-x-2 px-3 py-1.5 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition"
            >
              <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>Live Scoreboard</span>
            </Link>

            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="px-3 py-1.5 text-xs font-medium text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition"
              >
                Logout
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* CONTAINER UTAMA */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* TITLE BAR & ACTION BUTTONS */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Event Management</h2>
            <p className="text-sm text-slate-400 mt-1">
              Kelola kejuaraan renang, pengaturan lintasan kolam, dan jadwal perlombaan.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Tombol Buat Event Manual */}
            <Link
              href="/events/new"
              className="inline-flex items-center space-x-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-900/20 transition"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>Buat Event Baru</span>
            </Link>
          </div>
        </div>

        {/* EVENT CARDS GRID */}
        {!events || events.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
            <p className="text-slate-400 text-sm">Belum ada event kejuaraan yang dibuat.</p>
            <p className="text-xs text-slate-500 mt-1">Silakan klik "Buat Event Baru" atau "Import Buku Acara".</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <div
                key={event.id}
                className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition flex flex-col justify-between space-y-4"
              >
                {/* Card Header */}
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-lg text-white line-clamp-1">{event.name}</h3>
                    <span className="px-2.5 py-1 text-[11px] font-semibold bg-slate-800 text-blue-400 border border-slate-700 rounded-lg whitespace-nowrap">
                      {event.lane_count || 8} Lane
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 font-medium">{event.organizer || 'Panitia Pelaksana'}</p>
                </div>

                {/* Card Info */}
                <div className="space-y-2 text-xs text-slate-300 border-t border-b border-slate-800/80 py-3">
                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="truncate">{event.location || 'Lokasi Belum Diatur'}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{event.start_date} s/d {event.end_date}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    <svg className="w-4 h-4 text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>{event.pool_type || 'Long Course'} ({event.pool_length_meters || 50}m)</span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <Link
                    href={`/events/${event.id}`}
                    className="w-full text-center py-2 px-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl text-xs font-semibold transition"
                  >
                    Kelola Event
                  </Link>
                  <Link
                    href={`/heats?eventId=${event.id}`}
                    className="w-full text-center py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition"
                  >
                    Atur Heat
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}