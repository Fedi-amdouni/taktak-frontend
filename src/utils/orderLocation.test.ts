import { describe, expect, it, vi } from 'vitest';
import { requestOrderLocation } from './orderLocation';

const position = (latitude: number, longitude: number, accuracy: number) => ({
  coords: { latitude, longitude, accuracy },
}) as GeolocationPosition;

describe('requestOrderLocation', () => {
  it('attend et transmet la position après acceptation explicite', async () => {
    const getCurrentPosition = vi.fn((
      success: PositionCallback,
      _error?: PositionErrorCallback | null,
      _options?: PositionOptions,
    ) => {
      success(position(35.77, 10.82, 12));
    });

    await expect(requestOrderLocation({ getCurrentPosition })).resolves.toEqual({
      latitude: 35.77,
      longitude: 10.82,
      accuracyMeters: 12,
    });
    expect(getCurrentPosition.mock.calls[0][2]).not.toHaveProperty('timeout');
  });

  it('poursuit sans coordonnées après refus explicite', async () => {
    const getCurrentPosition = vi.fn((_success: PositionCallback, error: PositionErrorCallback) => {
      error({ code: 1, message: 'denied' } as GeolocationPositionError);
    });

    await expect(requestOrderLocation({ getCurrentPosition })).resolves.toBeUndefined();
  });
});
