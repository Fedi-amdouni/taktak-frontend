import { describe, expect, it, vi } from 'vitest';
import {
  persistTableSession,
  readStorageItemSafely,
  removeStorageItemSafely,
} from './tableSessionStorage';

describe('persistTableSession', () => {
  it('ne bloque pas le transfert lorsque le navigateur refuse localStorage', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const storage = {
      setItem: vi.fn(() => {
        throw new DOMException('Storage disabled', 'SecurityError');
      }),
    };

    expect(() => persistTableSession(storage, 'session-key', { tableNumber: 8 }))
      .not.toThrow();
    expect(storage.setItem).toHaveBeenCalledOnce();
    expect(warning).toHaveBeenCalledOnce();
    warning.mockRestore();
  });

  it('traite une lecture sessionStorage refusée comme un jeton absent', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const storage = {
      getItem: vi.fn(() => {
        throw new DOMException('Storage disabled', 'SecurityError');
      }),
    };

    expect(readStorageItemSafely(storage, 'token-key')).toBeNull();
    expect(warning).toHaveBeenCalledOnce();
    warning.mockRestore();
  });

  it('ne laisse pas un nettoyage sessionStorage bloquer un refus QR', () => {
    const warning = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const storage = {
      removeItem: vi.fn(() => {
        throw new DOMException('Storage disabled', 'SecurityError');
      }),
    };

    expect(() => removeStorageItemSafely(storage, 'token-key')).not.toThrow();
    expect(warning).toHaveBeenCalledOnce();
    warning.mockRestore();
  });
});
