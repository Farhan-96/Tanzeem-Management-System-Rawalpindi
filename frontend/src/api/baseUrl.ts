const RENDER_API_BASE_URL =
  'https://tanzeem-management-system-rawalpindi.onrender.com';

/** API origin — Render backend. Override with VITE_API_BASE_URL if needed. */
export function getApiBaseUrl(): string {
  return (import.meta.env.VITE_API_BASE_URL || RENDER_API_BASE_URL).replace(
    /\/$/,
    ''
  );
}

export function apiUrl(path: string): string {
  const base = getApiBaseUrl();
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalized}`;
}
