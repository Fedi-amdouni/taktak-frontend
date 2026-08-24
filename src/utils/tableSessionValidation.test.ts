import { describe, expect, it } from 'vitest';
import { decideTableSessionValidation } from './tableSessionValidation';

describe('decideTableSessionValidation', () => {
  it('préserve une session déjà validée lorsque le backend est temporairement indisponible', () => {
    expect(decideTableSessionValidation(undefined, true)).toBe('PRESERVE');
  });

  it('refuse un premier accès non validé lorsque le backend est indisponible', () => {
    expect(decideTableSessionValidation(undefined, false)).toBe('REJECT');
  });

  it('expire uniquement une session explicitement refusée par le backend', () => {
    expect(decideTableSessionValidation(false, true)).toBe('REJECT');
    expect(decideTableSessionValidation(true, false)).toBe('ACCEPT');
  });
});
