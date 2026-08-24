interface StorageWriter {
  setItem: (key: string, value: string) => void;
}

interface StorageReader {
  getItem: (key: string) => string | null;
}

interface StorageRemover {
  removeItem: (key: string) => void;
}

export const readStorageItemSafely = (
  storage: StorageReader,
  key: string,
): string | null => {
  try {
    return storage.getItem(key);
  } catch (error) {
    console.warn('Impossible de lire le stockage de session du navigateur', error);
    return null;
  }
};

export const writeStorageItemSafely = (
  storage: StorageWriter,
  key: string,
  value: string,
): void => {
  try {
    storage.setItem(key, value);
  } catch (error) {
    console.warn('Impossible d’écrire dans le stockage de session du navigateur', error);
  }
};

export const removeStorageItemSafely = (
  storage: StorageRemover,
  key: string,
): void => {
  try {
    storage.removeItem(key);
  } catch (error) {
    console.warn('Impossible de nettoyer le stockage de session du navigateur', error);
  }
};

export const persistTableSession = (
  storage: StorageWriter,
  key: string,
  session: unknown,
): void => {
  writeStorageItemSafely(storage, key, JSON.stringify(session));
};
