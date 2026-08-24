import type { Order } from '../types';
import type { TableTransferRequest } from '../services/orderService';

export interface TableTransferFlowInput {
  activeOrderId: string | null;
  cafeSlug: string;
  sourceTableNumber: number;
  targetTableNumber: number;
  participantId: string;
  sourceSessionToken: string | null;
  targetSessionToken: string | null;
}

interface TableTransferFlowDependencies {
  transferOrder: (
    orderId: string,
    cafeSlug: string,
    request: TableTransferRequest,
  ) => Promise<Order[]>;
  commitLocalTransfer: () => void;
}

export async function completeTableTransfer(
  input: TableTransferFlowInput,
  dependencies: TableTransferFlowDependencies,
): Promise<void> {
  if (input.activeOrderId) {
    if (!input.sourceSessionToken || !input.targetSessionToken) {
      throw new Error('Les jetons QR des deux tables sont nécessaires pour transférer la commande.');
    }

    await dependencies.transferOrder(input.activeOrderId, input.cafeSlug, {
      sourceTableNumber: input.sourceTableNumber,
      newTableNumber: input.targetTableNumber,
      participantId: input.participantId,
      sourceSessionToken: input.sourceSessionToken,
      targetSessionToken: input.targetSessionToken,
    });
  }

  dependencies.commitLocalTransfer();
}

export const clientTablePath = (cafeSlug: string, tableNumber: number): string =>
  `/m/${encodeURIComponent(cafeSlug)}/t/${tableNumber}`;
