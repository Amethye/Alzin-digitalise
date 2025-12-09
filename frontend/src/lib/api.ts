const base = (import.meta.env.PUBLIC_API_URL ?? "").replace(/\/$/, "");

export const API_BASE_URL = base;

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
