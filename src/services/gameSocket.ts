import { Client } from '@stomp/stompjs';

export type ConnectFourPlayer = { id: string; name: string } | null;
export type ChkobbaCard = { id: string; suit: 'DINARI' | 'KOPPA' | 'SABRES' | 'BASTONI'; rank: string; value: number };
export type RamiMeld = { type: 'set' | 'run'; cards: ChkobbaCard[] };
export type GameEvent = {
  type: 'roulette_players' | 'roulette_spin' | 'connect_four_state' | 'uno_state' | 'uno_hand' | 'party_state' | 'ludo_state' | 'chkobba_state' | 'chkobba_hand' | 'rami_state' | 'rami_hand';
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
  partyTheme?: 'intimate' | 'social' | 'friends' | 'future';
  partyChoice?: 'truth' | 'action' | null;
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
  chkobbaPlayers?: Array<{ id: string; name: string }>;
  chkobbaTable?: ChkobbaCard[];
  chkobbaHand?: ChkobbaCard[];
  chkobbaTurnId?: string;
  chkobbaWinner?: string;
  chkobbaStarted?: boolean;
  chkobbaTargetScore?: 11 | 21;
  chkobbaBotEnabled?: boolean;
  chkobbaScores?: Record<string, number>;
  chkobbaCapturedCounts?: Record<string, number>;
  chkobbaScopaCounts?: Record<string, number>;
  chkobbaRoundScores?: Record<string, number>;
  chkobbaLastRoundScores?: Record<string, number>;
  chkobbaLastRoundWinner?: string;
  chkobbaLastMovePlayerId?: string;
  chkobbaLastMoveCard?: ChkobbaCard | null;
  chkobbaLastCaptureCount?: number;
  chkobbaLastScopa?: boolean;
  chkobbaDeckRemaining?: number;
  chkobbaRound?: number;
  chkobbaDealNumber?: number;
  ramiPlayers?: Array<{ id: string; name: string }>;
  ramiMelds?: RamiMeld[];
  ramiDiscardTop?: ChkobbaCard | null;
  ramiHand?: ChkobbaCard[];
  ramiTurnId?: string;
  ramiWinner?: string;
  ramiStarted?: boolean;
  ramiHasDrawn?: boolean;
  ramiBotEnabled?: boolean;
  ramiDeckRemaining?: number;
  ramiRound?: number;
  ramiHandCounts?: Record<string, number>;
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

const GAME_NAME_KEY = 'taktak_game_name';

export const getStoredGameName = () => localStorage.getItem(GAME_NAME_KEY)?.trim() || '';

export const rememberGameName = (name: string) => {
  const trimmed = name.trim();
  if (trimmed) localStorage.setItem(GAME_NAME_KEY, trimmed);
  return trimmed;
};

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
