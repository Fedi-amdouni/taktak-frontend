import { Client } from '@stomp/stompjs';

export type ConnectFourPlayer = { id: string; name: string } | null;
export type GameEvent = {
  type: 'roulette_players' | 'roulette_spin' | 'connect_four_state' | 'uno_state' | 'uno_hand' | 'party_state' | 'ludo_state';
  players?: string[];
  loser?: string;
  startsAt?: number;
  board?: number[][];
  redPlayer?: ConnectFourPlayer;
  yellowPlayer?: ConnectFourPlayer;
  turn?: 'RED' | 'YELLOW';
  winner?: 'RED' | 'YELLOW' | null;
  draw?: boolean;
  unoPlayers?: Array<{ id: string; name: string }>;
  unoHand?: string[];
  unoHandCounts?: Record<string, number>;
  unoTopCard?: string;
  unoTurnId?: string;
  unoWinner?: string;
  unoStarted?: boolean;
  partyPlayers?: Array<{ id: string; name: string }>;
  partyMode?: 'quiz' | 'truth' | 'words';
  partyTurnId?: string;
  partyPrompt?: string;
  partyAnswer?: string;
  partyDiscussion?: string;
  partyRevealed?: boolean;
  partyStarted?: boolean;
  ludoPlayers?: Array<{ id: string; name: string }>;
  ludoTokens?: Record<string, number[]>;
  ludoTurnId?: string;
  ludoWinner?: string;
  ludoDice?: number | null;
  ludoStarted?: boolean;
  ludoCanRoll?: boolean;
};

const clientId = (() => {
  const key = 'taktak_game_player_id';
  const stored = localStorage.getItem(key);
  if (stored) return stored;
  const created = crypto.randomUUID();
  localStorage.setItem(key, created);
  return created;
})();

export const gamePlayerId = clientId;

export const createGameSocket = (tableId: string, onEvent: (event: GameEvent) => void, onConnected?: () => void, extraTopic?: string) => {
  const wsUrl = import.meta.env.VITE_WS_URL
    ? import.meta.env.VITE_WS_URL.replace(/\/$/, '')
    : `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/ws`;
  const pending: Array<{ action: string; body: object }> = [];
  const client = new Client({
    brokerURL: wsUrl,
    reconnectDelay: 3000,
    onConnect: () => {
      client.subscribe(`/topic/table/${tableId}/game`, message => {
        try { onEvent(JSON.parse(message.body) as GameEvent); } catch { /* ignore malformed messages */ }
      });
      if (extraTopic) client.subscribe(extraTopic, message => { try { onEvent(JSON.parse(message.body) as GameEvent); } catch { /* ignore */ } });
      pending.splice(0).forEach(({ action, body }) => client.publish({ destination: `/app/table/${tableId}/game/${action}`, body: JSON.stringify(body) }));
      onConnected?.();
    },
  });
  client.activate();
  return {
    send: (action: string, body: object = {}) => {
      if (client.connected) client.publish({ destination: `/app/table/${tableId}/game/${action}`, body: JSON.stringify(body) });
      else pending.push({ action, body });
    },
    disconnect: () => client.deactivate(),
  };
};
