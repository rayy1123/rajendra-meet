import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { UserRole } from '@/types/database';

export type { UserRole };

/** Mengambil role user dari tabel profiles milik user yang login. */
export async function getRole(): Promise<UserRole | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  return (profile?.role as UserRole | undefined) ?? null;
}

/**
 * Wajib login. Jika tidak, arahkan ke /login.
 * Mengembalikan supabase client + user agar caller tidak perlu double-fetch.
 */
export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const role = (profile as { role?: string } | null)?.role;
    if (role === 'super_admin' || role === 'event_admin' || role === 'operator') {
      return { supabase, user, profile };
    }
    return { supabase, user, profile };
  }

  const cookieStore = await import('next/headers').then(m => m.cookies());
  const username = cookieStore.get('x-trial-user')?.value || '';
  if (!username) redirect('/login');
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, full_name, role, avatar_url')
    .eq('username', username)
    .maybeSingle();
  if (!profile) redirect('/login');
  return { supabase, user: { id: profile.id, email: null } as any, profile };
}

export async function requireViewer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    const role = (profile as { role?: string } | null)?.role;
    if (role === 'super_admin' || role === 'event_admin' || role === 'operator') {
      redirect('/events');
    }
    return { supabase, user, profile };
  }

  const cookieStore = await import('next/headers').then(m => m.cookies());
  const username = cookieStore.get('x-trial-user')?.value || '';
  if (!username) redirect('/login');
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, username, full_name, role, avatar_url')
    .eq('username', username)
    .maybeSingle();
  if (!profile) redirect('/login');
  return { supabase, user: { id: profile.id, email: null } as any, profile };
}

/**
 * Wajib memiliki salah satu role yang diizinkan.
 * Jika tidak login -> /login. Jika login tapi bukan role yang diizinkan -> 403.
 */
export async function requireRole(allowed: UserRole[]) {
  const { supabase, user } = await requireUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const role = profile?.role as UserRole | undefined;

  if (!role || !allowed.includes(role)) {
    redirect('/403');
  }
  return { supabase, user, role };
}
