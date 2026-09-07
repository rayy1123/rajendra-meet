export function assertString(value: unknown, label = 'value'): string {
  if (typeof value !== 'string') throw new Error(`${label} harus berupa teks.`);
  return value;
}

export function assertUuid(value: unknown, label = 'id'): string {
  const s = assertString(value, label);
  if (!/^[0-9a-f-]{36}$/i.test(s)) throw new Error(`${label} tidak valid.`);
  return s;
}

export function sanitizeText(value: unknown, max = 255): string {
  const s = assertString(value, 'Teks');
  const trimmed = s.trim();
  if (trimmed.length > max) throw new Error(`Teks maksimal ${max} karakter.`);
  return trimmed.replace(/[<>"]/g, '');
}

export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function trimResponse<T>(data: T): T {
  if (Array.isArray(data)) return data.slice(0, 200) as T;
  if (data && typeof data === 'object') {
    const clone: any = { ...data };
    for (const key of Object.keys(clone)) {
      if (typeof clone[key] === 'string') clone[key] = clone[key].trim();
    }
    return clone;
  }
  return data;
}
