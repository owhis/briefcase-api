export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface CacheOptions {
  ttl?: number; // Time-to-live in milliseconds, default 60000 (1 minute)
}

export class RequestCache {
  private store: Map<string, CacheEntry<unknown>>;
  private defaultTtl: number;

  constructor(options: CacheOptions = {}) {
    this.store = new Map();
    this.defaultTtl = options.ttl ?? 60_000;
  }

  set<T>(key: string, data: T, ttl?: number): void {
    this.store.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl ?? this.defaultTtl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.store.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.store.delete(key);
      return null;
    }

    return entry.data;
  }

  has(key: string): boolean {
    return this.get(key) !== null;
  }

  invalidate(key: string): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  generateKey(url: string, params?: Record<string, unknown>): string {
    if (!params || Object.keys(params).length === 0) return url;
    const sorted = Object.keys(params)
      .sort()
      .reduce<Record<string, unknown>>((acc, k) => {
        acc[k] = params[k];
        return acc;
      }, {});
    return `${url}?${JSON.stringify(sorted)}`;
  }
}
