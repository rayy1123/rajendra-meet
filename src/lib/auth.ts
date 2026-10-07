import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { UserRole } from '@/types/database';

export type { UserRole };

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

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

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

export async function requireViewer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();
  const role = (profile as { role?: string } | null)?.role;
  const ADMIN_ROLES = [
    'super_admin',
    'event_admin',
    'operator',
    'admin',
    'admin_kejuaraan',
    'admin_keuangan',
    'admin_technical',
    'admin-technical',
  ];
  if (role && ADMIN_ROLES.includes(role)) {
    redirect('/dashboard');
  }
  return { supabase, user, profile };
}

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

/**
 * Validasi hak akses untuk API Route & Server Actions tanpa memicu redirect() Next.js
 */
export async function verifyApiRole(allowed: UserRole[]): Promise<
  | { ok: true; user: any; role: UserRole; profile: any; supabase: any }
  | { ok: false; status: 401 | 403; error: string }
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, status: 401, error: 'Sesi login tidak valid atau berakhir.' };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role =
    (profile?.role as UserRole | undefined) ||
    (user.user_metadata?.role as UserRole | undefined);

  if (!role || !allowed.includes(role)) {
    return {
      ok: false,
      status: 403,
      error: 'Anda tidak memiliki hak akses (wewenang) untuk fungsi ini.',
    };
  }

  return { ok: true, user, role, profile, supabase };
}
