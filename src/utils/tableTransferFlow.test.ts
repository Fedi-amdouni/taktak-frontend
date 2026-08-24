import { describe, expect, it, vi } from 'vitest';
import { clientTablePath, completeTableTransfer } from './tableTransferFlow';

describe('completeTableTransfer', () => {
  it('keeps the current table when the backend transfer fails', async () => {
    const commitLocalTransfer = vi.fn();
    const transferOrder = vi.fn().mockRejectedValue(new Error('backend unavailable'));

    await expect(completeTableTransfer({
      activeOrderId: 'order-1',
      cafeSlug: 'monastir-lounge',
      sourceTableNumber: 5,
      targetTableNumber: 8,
      participantId: 'participant-1',
      sourceSessionToken: 'source-token',
      targetSessionToken: 'target-token',
    }, {
      transferOrder,
      commitLocalTransfer,
    })).rejects.toThrow('backend unavailable');

    expect(commitLocalTransfer).not.toHaveBeenCalled();
  });

  it('commits locally only after the backend has transferred the active orders', async () => {
    const calls: string[] = [];
    const transferOrder = vi.fn().mockImplementation(async () => {
      calls.push('backend');
      return [];
    });
    const commitLocalTransfer = vi.fn().mockImplementation(() => calls.push('local'));

    await completeTableTransfer({
      activeOrderId: 'order-1',
      cafeSlug: 'monastir-lounge',
      sourceTableNumber: 5,
      targetTableNumber: 8,
      participantId: 'participant-1',
      sourceSessionToken: 'source-token',
      targetSessionToken: 'target-token',
    }, {
      transferOrder,
      commitLocalTransfer,
    });

    expect(calls).toEqual(['backend', 'local']);
    expect(transferOrder).toHaveBeenCalledWith('order-1', 'monastir-lounge', {
      sourceTableNumber: 5,
      newTableNumber: 8,
      participantId: 'participant-1',
      sourceSessionToken: 'source-token',
      targetSessionToken: 'target-token',
    });
  });

  it('moves a cart-only session without calling the order API', async () => {
    const transferOrder = vi.fn();
    const commitLocalTransfer = vi.fn();

    await completeTableTransfer({
      activeOrderId: null,
      cafeSlug: 'monastir-lounge',
      sourceTableNumber: 5,
      targetTableNumber: 8,
      participantId: 'participant-1',
      sourceSessionToken: null,
      targetSessionToken: 'target-token',
    }, {
      transferOrder,
      commitLocalTransfer,
    });

    expect(transferOrder).not.toHaveBeenCalled();
    expect(commitLocalTransfer).toHaveBeenCalledOnce();
  });

  it('builds the old-table route used when the user cancels', () => {
    expect(clientTablePath('monastir-lounge', 5)).toBe('/m/monastir-lounge/t/5');
  });
});
