/**
 * replay.ts — Record and replay HTTP request/response pairs for testing and offline use.
 */

export interface ReplayEntry<T = unknown> {
  key: string;
  request: { url: string; method: string; body?: unknown };
  response: T;
  recordedAt: number;
}

export interface ReplayStore<T = unknown> {
  entries: Map<string, ReplayEntry<T>>;
  mode: "record" | "replay" | "passthrough";
}

export function createReplay<T = unknown>(
  mode: ReplayStore<T>["mode"] = "passthrough"
): ReplayStore<T> {
  return { entries: new Map(), mode };
}

export function record<T>(
  store: ReplayStore<T>,
  key: string,
  request: ReplayEntry<T>["request"],
  response: T
): void {
  store.entries.set(key, { key, request, response, recordedAt: Date.now() });
}

export function replay<T>(
  store: ReplayStore<T>,
  key: string
): T | undefined {
  return store.entries.get(key)?.response;
}

export function hasEntry<T>(store: ReplayStore<T>, key: string): boolean {
  return store.entries.has(key);
}

export function clearEntry<T>(store: ReplayStore<T>, key: string): boolean {
  return store.entries.delete(key);
}

export function clearAll<T>(store: ReplayStore<T>): void {
  store.entries.clear();
}

export function getEntryCount<T>(store: ReplayStore<T>): number {
  return store.entries.size;
}

export function listEntries<T>(store: ReplayStore<T>): ReplayEntry<T>[] {
  return Array.from(store.entries.values());
}
