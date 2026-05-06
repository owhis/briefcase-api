/**
 * Request deduplication — prevents identical in-flight requests
 * from being dispatched more than once simultaneously.
 */

type Resolver<T> = (value: T) => void;
type Rejecter = (reason?: unknown) => void;

interface PendingEntry<T> {
  promise: Promise<T>;
  resolvers: Array<{ resolve: Resolver<T>; reject: Rejecter }>;
}

const pendingMap = new Map<string, PendingEntry<unknown>>();

/**
 * Executes `fn` only once per unique `key` while a request is in-flight.
 * Subsequent callers with the same key receive the same promise.
 */
export async function dedup<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const existing = pendingMap.get(key) as PendingEntry<T> | undefined;
  if (existing) {
    return new Promise<T>((resolve, reject) => {
      existing.resolvers.push({ resolve, reject });
    });
  }

  const entry: PendingEntry<T> = {
    promise: null as unknown as Promise<T>,
    resolvers: [],
  };

  const promise = fn()
    .then((value) => {
      entry.resolvers.forEach(({ resolve }) => resolve(value));
      pendingMap.delete(key);
      return value;
    })
    .catch((err) => {
      entry.resolvers.forEach(({ reject }) => reject(err));
      pendingMap.delete(key);
      throw err;
    });

  entry.promise = promise;
  pendingMap.set(key, entry as PendingEntry<unknown>);

  return promise;
}

/** Returns the number of currently in-flight deduplicated requests. */
export function pendingCount(): number {
  return pendingMap.size;
}

/** Clears all tracked in-flight entries (useful for testing). */
export function clearPending(): void {
  pendingMap.clear();
}
