const rawBase =
  import.meta.env.PUBLIC_API_URL ??
  import.meta.env.PUBLIC_API_BASE_URL ??
  "";

const base = rawBase.replace(/\/$/, "");

export const API_BASE_URL = base;

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
