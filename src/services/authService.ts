import { API_BASE, AuthSession, authSession, fetchJson } from './apiClient';

export const authService = {
  loginAdmin: async (username: string, password: string): Promise<AuthSession> => {
    const session = await fetchJson<AuthSession>(`${API_BASE}/auth/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    authSession.set(session);
    return session;
  },
};

export { authSession, type AuthSession };
