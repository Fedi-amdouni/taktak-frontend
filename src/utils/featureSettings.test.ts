import { describe, expect, it } from 'vitest';
import { countEnabledFeatures } from './featureSettings';

describe('countEnabledFeatures', () => {
  it('compte uniquement les modules affichés, pas les autres réglages', () => {
    const featureKeys = ['ordering', 'games', 'votes'] as const;
    const settings = { ordering: true, games: false, votes: true };

    expect(countEnabledFeatures(settings, featureKeys)).toBe(2);
    expect(featureKeys).toHaveLength(3);
  });
});
