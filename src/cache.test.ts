import { RequestCache } from './cache';

describe('RequestCache', () => {
  let cache: RequestCache;

  beforeEach(() => {
    cache = new RequestCache({ ttl: 500 });
  });

  afterEach(() => {
    cache.clear();
  });

  it('stores and retrieves a value', () => {
    cache.set('key1', { page: 1, data: ['a', 'b'] });
    expect(cache.get('key1')).toEqual({ page: 1, data: ['a', 'b'] });
  });

  it('returns null for a missing key', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('returns null after ttl expires', async () => {
    cache.set('expiring', 'value', 100);
    await new Promise((r) => setTimeout(r, 150));
    expect(cache.get('expiring')).toBeNull();
  });

  it('reports has() correctly before and after expiry', async () => {
    cache.set('key2', 42, 100);
    expect(cache.has('key2')).toBe(true);
    await new Promise((r) => setTimeout(r, 150));
    expect(cache.has('key2')).toBe(false);
  });

  it('invalidates a specific key', () => {
    cache.set('key3', 'hello');
    cache.invalidate('key3');
    expect(cache.get('key3')).toBeNull();
  });

  it('clears all entries', () => {
    cache.set('a', 1);
    cache.set('b', 2);
    cache.clear();
    expect(cache.size()).toBe(0);
  });

  it('generates a stable cache key from url and params', () => {
    const key1 = cache.generateKey('https://api.example.com/items', { page: 2, limit: 10 });
    const key2 = cache.generateKey('https://api.example.com/items', { limit: 10, page: 2 });
    expect(key1).toBe(key2);
  });

  it('generates a key without params when params are empty', () => {
    const key = cache.generateKey('https://api.example.com/items', {});
    expect(key).toBe('https://api.example.com/items');
  });
});
