import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('./apiClient', () => ({
  API_BASE: '/api',
  fetchJson: vi.fn(),
}));

import { fetchJson } from './apiClient';
import { orderService } from './orderService';

describe('orderService.transferOrderTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchJson).mockResolvedValue([]);
  });

  it('uses the secured cafe-scoped POST contract with both table tokens', async () => {
    const request = {
      sourceTableNumber: 5,
      newTableNumber: 8,
      participantId: 'participant-1',
      sourceSessionToken: 'source-token',
      targetSessionToken: 'target-token',
    };

    await orderService.transferOrderTable('order-1', 'monastir-lounge', request);

    expect(fetchJson).toHaveBeenCalledWith(
      '/api/cafes/monastir-lounge/orders/order-1/transfer-table',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      },
    );
  });
});
