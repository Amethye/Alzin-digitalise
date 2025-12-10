const rawBase =
  import.meta.env.PUBLIC_API_URL ??
  import.meta.env.PUBLIC_API_BASE_URL ??
  "";

let base = rawBase.replace(/\/$/, "");

if (typeof window !== "undefined") {
  const pageProtocol = window.location.protocol;
  if (pageProtocol === "https:" && base.startsWith("http://")) {
    base = "";
  }
}

export const API_BASE_URL = base;

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}
