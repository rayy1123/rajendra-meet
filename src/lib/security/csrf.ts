'use server';

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const CSRF_COOKIE = 'csrf_token';
const CSRF_HEADER = 'x-csrf-token';

export async function getCsrfToken(): Promise<string> {
  let token = (await cookies()).get(CSRF_COOKIE)?.value;
  if (!token) {
    token = crypto.randomUUID();
    (await cookies()).set(CSRF_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60,
    });
  }
  return token;
}

export async function verifyCsrfToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const cookieToken = (await cookies()).get(CSRF_COOKIE)?.value;
  return !!cookieToken && cookieToken === token;
}

export function csrfMiddleware() {
  return (request: Request) => {
    const token = request.headers.get(CSRF_HEADER);
    if (!token) {
      return NextResponse.json({ error: 'CSRF token missing' }, { status: 403 });
    }
    return null;
  };
}
