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
      const raw = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
      return raw ? (JSON.parse(raw) as AuthSession) : null;
    } catch {
      return null;
    }
  },
  set(session: AuthSession) {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
    sessionStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  },
  clear() {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_STORAGE_KEY);
  },
};

// Helper for HTTP requests with error handling
export async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const session = authSession.get();
  const headers = new Headers(options?.headers);
  if (session?.token) headers.set('Authorization', `Bearer ${session.token}`);

  const method = (options?.method || 'GET').toUpperCase();
  const canRetry = method === 'GET' || method === 'HEAD';
  const retryDelays = canRetry ? [400, 1_000, 2_000] : [];
  let lastError: unknown;

  for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
    let response: Response;
    try {
      response = await fetch(url, { ...options, headers });
    } catch (error) {
      if (!canRetry || options?.signal?.aborted || attempt === retryDelays.length) throw error;
      lastError = error;
      await new Promise(resolve => globalThis.setTimeout(resolve, retryDelays[attempt]));
      continue;
    }

    if (response.ok) {
      if (response.status === 204) return {} as T;
      return response.json();
    }

    const error = new Error(`API Error: ${response.status} ${response.statusText}`);
    const retryableStatus = response.status === 408
      || response.status === 429
      || response.status >= 500;
    if (!canRetry || !retryableStatus || attempt === retryDelays.length) throw error;
    lastError = error;
    await new Promise(resolve => globalThis.setTimeout(resolve, retryDelays[attempt]));
  }

  throw lastError instanceof Error ? lastError : new Error('API request failed');
}
