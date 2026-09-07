import { cookies } from 'next/headers';

type SameSite = 'lax' | 'strict' | 'none';

type SecureCookieOptions = {
  httpOnly: boolean;
  sameSite: SameSite;
  path: string;
  secure: boolean;
  maxAge?: number;
};

const SECURE_COOKIE_OPTIONS: Omit<SecureCookieOptions, 'maxAge'> = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  secure: process.env.NODE_ENV === 'production',
};

export async function setSecureCookie(name: string, value: string, maxAge?: number) {
  const cookieStore = await cookies();
  const options: SecureCookieOptions = { ...SECURE_COOKIE_OPTIONS, maxAge };
  cookieStore.set(name, value, options);
}

export async function getSecureCookie(name: string): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(name)?.value;
}

export async function deleteSecureCookie(name: string) {
  const cookieStore = await cookies();
  cookieStore.delete(name);
}
