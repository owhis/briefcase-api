/**
 * snapshot.ts — Captures and restores API response snapshots for offline/testing use.
 */

export interface Snapshot<T> {
  key: string;
  data: T;
  capturedAt: number;
  expiresAt: number | null;
}

export interface SnapshotStore<T> {
  save(snapshot: Snapshot<T>): void;
  load(key: string): Snapshot<T> | undefined;
  remove(key: string): void;
  clear(): void;
  keys(): string[];
}

export function createMemoryStore<T>(): SnapshotStore<T> {
  const store = new Map<string, Snapshot<T>>();
  return {
    save(snapshot) {
      store.set(snapshot.key, snapshot);
    },
    load(key) {
      return store.get(key);
    },
    remove(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
    keys() {
      return Array.from(store.keys());
    },
  };
}

export function captureSnapshot<T>(
  key: string,
  data: T,
  ttlMs: number | null = null
): Snapshot<T> {
  const now = Date.now();
  return {
    key,
    data,
    capturedAt: now,
    expiresAt: ttlMs !== null ? now + ttlMs : null,
  };
}

export function isExpired<T>(snapshot: Snapshot<T>): boolean {
  if (snapshot.expiresAt === null) return false;
  return Date.now() > snapshot.expiresAt;
}

export function resolveSnapshot<T>(
  store: SnapshotStore<T>,
  key: string
): T | undefined {
  const snapshot = store.load(key);
  if (!snapshot) return undefined;
  if (isExpired(snapshot)) {
    store.remove(key);
    return undefined;
  }
  return snapshot.data;
}
