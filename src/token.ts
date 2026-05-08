export interface TokenBucket {
  capacity: number;
  tokens: number;
  refillRate: number; // tokens per ms
  lastRefill: number;
}

export interface TokenOptions {
  capacity: number;
  refillRate: number; // tokens per ms
  initialTokens?: number;
}

export function createTokenBucket(options: TokenOptions): TokenBucket {
  const { capacity, refillRate, initialTokens } = options;
  return {
    capacity,
    refillRate,
    tokens: initialTokens !== undefined ? Math.min(initialTokens, capacity) : capacity,
    lastRefill: Date.now(),
  };
}

export function refill(bucket: TokenBucket): TokenBucket {
  const now = Date.now();
  const elapsed = now - bucket.lastRefill;
  const added = elapsed * bucket.refillRate;
  const tokens = Math.min(bucket.capacity, bucket.tokens + added);
  return { ...bucket, tokens, lastRefill: now };
}

export function consume(bucket: TokenBucket, count = 1): { bucket: TokenBucket; allowed: boolean } {
  const refilled = refill(bucket);
  if (refilled.tokens < count) {
    return { bucket: refilled, allowed: false };
  }
  return { bucket: { ...refilled, tokens: refilled.tokens - count }, allowed: true };
}

export function waitTimeMs(bucket: TokenBucket, count = 1): number {
  const refilled = refill(bucket);
  if (refilled.tokens >= count) return 0;
  const deficit = count - refilled.tokens;
  return Math.ceil(deficit / bucket.refillRate);
}

export function getState(bucket: TokenBucket): { tokens: number; capacity: number; full: boolean } {
  const refilled = refill(bucket);
  return {
    tokens: Math.floor(refilled.tokens),
    capacity: refilled.capacity,
    full: refilled.tokens >= refilled.capacity,
  };
}
