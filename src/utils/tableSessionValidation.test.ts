import { describe, expect, it } from 'vitest';
import { decideTableSessionValidation } from './tableSessionValidation';

describe('decideTableSessionValidation', () => {
  it('préserve la session lorsque le backend est temporairement indisponible', () => {
    expect(decideTableSessionValidation(undefined)).toBe('PRESERVE');
  });

  it('expire uniquement une session explicitement refusée par le backend', () => {
    expect(decideTableSessionValidation(false)).toBe('REJECT');
    expect(decideTableSessionValidation(true)).toBe('ACCEPT');
  });
});
