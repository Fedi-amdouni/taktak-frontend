import { Client, ReconnectionTimeMode } from '@stomp/stompjs';
import { Order, ServiceCall, AmbianceState } from '../types';
import { subscribeLocalOrders } from './api';

const getWebSocketUrl = () => {
  if (import.meta.env.VITE_WS_URL) {
    return import.meta.env.VITE_WS_URL.replace(/\/$/, '');
  }

  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}/ws`;
};

class StompWebSocketService {
  private client: Client | null = null;
  private isConnected = false;

  public connect(
    cafeSlug: string,
    onOrderReceived: (order: Order) => void,
    onServiceCallReceived?: (call: ServiceCall) => void,
    onConnected?: () => void
  ) {
    const wsUrl = getWebSocketUrl();

    try {
      this.client = new Client({
        brokerURL: wsUrl,
        reconnectDelay: 1000,
        maxReconnectDelay: 30000,
        reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
        connectionTimeout: 10000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          this.isConnected = true;
          console.log('[WebSocket STOMP] Connecté au serveur Spring Boot');
          
          this.client?.subscribe(`/topic/orders/${cafeSlug}`, (message) => {
            if (message.body) {
              const order: Order = JSON.parse(message.body);
              onOrderReceived(order);
            }
          });

          if (onServiceCallReceived) {
            this.client?.subscribe(`/topic/service-calls/${cafeSlug}`, (message) => {
              if (message.body) {
                const call: ServiceCall = JSON.parse(message.body);
                onServiceCallReceived(call);
              }
            });
          }

          onConnected?.();
        },
        onDisconnect: () => {
          this.isConnected = false;
        },
        onStompError: (frame) => {
          console.warn('[WebSocket STOMP] Erreur:', frame.headers['message']);
        },
      });

      this.client.activate();
    } catch (e) {
      console.warn('[WebSocket STOMP] Utilisation du système de broadcast local fallback', e);
    }

    return subscribeLocalOrders((order) => {
      onOrderReceived(order);
    });
  }

  public subscribeAmbiance(
    cafeSlug: string,
    onAmbianceUpdated: (state: AmbianceState) => void,
    onConnected?: () => void
  ) {
    const wsUrl = getWebSocketUrl();

    const client = new Client({
      brokerURL: wsUrl,
      reconnectDelay: 1000,
      maxReconnectDelay: 30000,
      reconnectTimeMode: ReconnectionTimeMode.EXPONENTIAL,
      connectionTimeout: 10000,
      onConnect: () => {
        client.subscribe(`/topic/ambiance/${cafeSlug}`, (message) => {
          if (message.body) {
            try {
              const state: AmbianceState = JSON.parse(message.body);
              onAmbianceUpdated(state);
            } catch (e) {
              console.error('Erreur parse message ambiance WS', e);
            }
          }
        });
        onConnected?.();
      },
    });

    client.activate();
    return () => client.deactivate();
  }

  public disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.isConnected = false;
    }
  }

  public getStatus() {
    return this.isConnected;
  }
}

export const stompService = new StompWebSocketService();
