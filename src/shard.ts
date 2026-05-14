/**
 * shard.ts — Distributes keys across a fixed set of buckets using a hashing strategy.
 */

export interface ShardOptions {
  buckets: number;
  hash?: (key: string) => number;
}

export interface ShardState {
  buckets: number;
  assigned: Map<string, number>;
}

function defaultHash(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) {
    h = (Math.imul(31, h) + key.charCodeAt(i)) >>> 0;
  }
  return h;
}

export interface Shard {
  assign(key: string): number;
  lookup(key: string): number | undefined;
  getState(): ShardState;
  clear(): void;
}

export function createShard(options: ShardOptions): Shard {
  const { buckets, hash = defaultHash } = options;
  if (buckets < 1) throw new RangeError("buckets must be >= 1");

  const assigned = new Map<string, number>();

  function assign(key: string): number {
    if (assigned.has(key)) return assigned.get(key)!;
    const bucket = hash(key) % buckets;
    assigned.set(key, bucket);
    return bucket;
  }

  function lookup(key: string): number | undefined {
    return assigned.get(key);
  }

  function getState(): ShardState {
    return { buckets, assigned: new Map(assigned) };
  }

  function clear(): void {
    assigned.clear();
  }

  return { assign, lookup, getState, clear };
}
