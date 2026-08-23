const PARTICIPANT_KEY = 'taktak_participant_id';
const PENDING_ORDER_PREFIX = 'taktak_pending_order';

let inMemoryParticipantId: string | null = null;

const createId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
};

export const getOrCreateParticipantId = (): string => {
  try {
    const existing = window.localStorage.getItem(PARTICIPANT_KEY);
    if (existing) return existing;

    const created = createId();
    window.localStorage.setItem(PARTICIPANT_KEY, created);
    return created;
  } catch {
    inMemoryParticipantId ??= createId();
    return inMemoryParticipantId;
  }
};

const pendingOrderKey = (cafeSlug: string, tableNumber: number) =>
  `${PENDING_ORDER_PREFIX}_${cafeSlug}_${tableNumber}`;

export const getOrCreatePendingOrderId = (
  cafeSlug: string,
  tableNumber: number,
  cartSignature: string,
): string => {
  const key = pendingOrderKey(cafeSlug, tableNumber);
  try {
    const serialized = window.sessionStorage.getItem(key);
    if (serialized) {
      const pending = JSON.parse(serialized) as { clientOrderId?: string; cartSignature?: string };
      if (pending.clientOrderId && pending.cartSignature === cartSignature) {
        return pending.clientOrderId;
      }
    }

    const clientOrderId = createId();
    window.sessionStorage.setItem(key, JSON.stringify({ clientOrderId, cartSignature }));
    return clientOrderId;
  } catch {
    return createId();
  }
};

export const clearPendingOrderId = (cafeSlug: string, tableNumber: number): void => {
  try {
    window.sessionStorage.removeItem(pendingOrderKey(cafeSlug, tableNumber));
  } catch {
    // Le stockage peut être indisponible en navigation privée; la confirmation reste valide.
  }
};
