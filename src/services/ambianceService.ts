import { AmbianceState } from '../types';
import { API_BASE, fetchJson } from './apiClient';

export const ambianceService = {
  getActiveAmbiance: async (cafeSlug: string, voterSessionId?: string): Promise<AmbianceState> => {
    const param = voterSessionId ? `?voterSessionId=${voterSessionId}` : '';
    return fetchJson<AmbianceState>(`${API_BASE}/v1/cafes/${cafeSlug}/ambiance/active${param}`);
  },

  votePoll: async (cafeSlug: string, optionId: string, voterSessionId: string): Promise<AmbianceState> => {
    return fetchJson<AmbianceState>(`${API_BASE}/v1/cafes/${cafeSlug}/ambiance/vote-poll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId, voterSessionId }),
    });
  },

  voteMusic: async (cafeSlug: string, optionId: string, voterSessionId: string): Promise<AmbianceState> => {
    return fetchJson<AmbianceState>(`${API_BASE}/v1/cafes/${cafeSlug}/ambiance/vote-music`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId, voterSessionId }),
    });
  },

  createPoll: async (cafeSlug: string, title: string, options: string[]): Promise<AmbianceState> => {
    return fetchJson<AmbianceState>(`${API_BASE}/v1/cafes/${cafeSlug}/ambiance/polls`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, options }),
    });
  },

  resetMusicVotes: async (cafeSlug: string): Promise<AmbianceState> => {
    return fetchJson<AmbianceState>(`${API_BASE}/v1/cafes/${cafeSlug}/ambiance/reset-music`, {
      method: 'PUT',
    });
  },

  proposeMusic: async (
    cafeSlug: string,
    title: string,
    genre: string | undefined,
    voterSessionId: string
  ): Promise<AmbianceState> => {
    return fetchJson<AmbianceState>(`${API_BASE}/v1/cafes/${cafeSlug}/ambiance/propose-music`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, genre, voterSessionId }),
    });
  },

  deleteMusicOption: async (cafeSlug: string, musicOptionId: string): Promise<AmbianceState> => {
    return fetchJson<AmbianceState>(`${API_BASE}/v1/cafes/${cafeSlug}/ambiance/music/${musicOptionId}`, {
      method: 'DELETE',
    });
  },
};
