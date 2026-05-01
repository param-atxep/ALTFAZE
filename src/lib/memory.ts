const globalForMemory = globalThis as typeof globalThis & {
  __altfazeMemory?: Map<string, { value: unknown; expiresAt: number }>;
};

const memoryStore = globalForMemory.__altfazeMemory || new Map<string, { value: unknown; expiresAt: number }>();
globalForMemory.__altfazeMemory = memoryStore;

export function remember<T>(key: string, value: T, ttlMs: number) {
  memoryStore.set(key, {
    value,
    expiresAt: Date.now() + ttlMs,
  });
}

export function recall<T>(key: string): T | null {
  const record = memoryStore.get(key);

  if (!record) {
    return null;
  }

  if (record.expiresAt < Date.now()) {
    memoryStore.delete(key);
    return null;
  }

  return record.value as T;
}
