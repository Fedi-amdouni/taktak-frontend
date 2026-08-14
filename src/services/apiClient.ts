import { Waiter } from '../types';

export const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '');
const AUTH_STORAGE_KEY = 'taktakAuth';

export interface AuthSession {
  token: string;
  role: 'ADMIN' | 'STAFF';
  cafeSlug?: string | null;
  cafeSlugs?: string[];
  waiter?: Waiter | null;
}

export const authSession = {
  get(): AuthSession | null {
    try {
      const raw = sessionStorage.getItem(AUTH_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  },
  set(session: AuthSession) {
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  },
  clear() {
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  },
};

// Helper for HTTP requests with error handling
export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const session = authSession.get();
  const headers = new Headers(options?.headers);
  if (session?.token) headers.set('Authorization', `Bearer ${session.token}`);
  const response = await fetch(url, { ...options, headers });
  if (!response.ok) {
    if (response.status === 401 && !url.includes('/auth/')) authSession.clear();
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  if (response.status === 24 || response.status === 204) {
    return {} as T;
  }
  return response.json();
}
