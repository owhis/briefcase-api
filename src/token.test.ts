import { createTokenBucket, consume, refill, waitTimeMs, getState } from './token';
import { buildTokenOptions, validateTokenOptions, describeTokenBucket, getTokenPreset, listTokenPresets } from './token.config';

describe('token bucket', () => {
  it('starts full by default', () => {
    const b = createTokenBucket({ capacity: 10, refillRate: 0.01 });
    expect(b.tokens).toBe(10);
  });

  it('respects initialTokens', () => {
    const b = createTokenBucket({ capacity: 10, refillRate: 0.01, initialTokens: 3 });
    expect(b.tokens).toBe(3);
  });

  it('allows consume when tokens available', () => {
    const b = createTokenBucket({ capacity: 5, refillRate: 0.001 });
    const { allowed, bucket } = consume(b, 2);
    expect(allowed).toBe(true);
    expect(bucket.tokens).toBeCloseTo(3, 0);
  });

  it('denies consume when insufficient tokens', () => {
    const b = createTokenBucket({ capacity: 5, refillRate: 0.001, initialTokens: 1 });
    const { allowed } = consume(b, 3);
    expect(allowed).toBe(false);
  });

  it('refills tokens over time', () => {
    const past = Date.now() - 1000;
    const b = { capacity: 10, tokens: 0, refillRate: 0.005, lastRefill: past };
    const refilled = refill(b);
    expect(refilled.tokens).toBeGreaterThan(0);
    expect(refilled.tokens).toBeLessThanOrEqual(10);
  });

  it('does not exceed capacity on refill', () => {
    const past = Date.now() - 100000;
    const b = { capacity: 5, tokens: 0, refillRate: 1, lastRefill: past };
    const refilled = refill(b);
    expect(refilled.tokens).toBe(5);
  });

  it('returns 0 waitTime when tokens available', () => {
    const b = createTokenBucket({ capacity: 10, refillRate: 0.01 });
    expect(waitTimeMs(b, 5)).toBe(0);
  });

  it('returns positive waitTime when tokens insufficient', () => {
    const b = createTokenBucket({ capacity: 5, refillRate: 0.001, initialTokens: 0 });
    expect(waitTimeMs(b, 3)).toBeGreaterThan(0);
  });

  it('getState reflects floored tokens', () => {
    const b = createTokenBucket({ capacity: 10, refillRate: 0.01 });
    const state = getState(b);
    expect(state.capacity).toBe(10);
    expect(state.full).toBe(true);
  });
});

describe('token.config', () => {
  it('getTokenPreset returns known preset', () => {
    const p = getTokenPreset('strict');
    expect(p.capacity).toBe(5);
  });

  it('getTokenPreset throws on unknown', () => {
    expect(() => getTokenPreset('unknown' as any)).toThrow();
  });

  it('buildTokenOptions merges overrides', () => {
    const opts = buildTokenOptions({ preset: 'burst', capacity: 200 });
    expect(opts.capacity).toBe(200);
  });

  it('validateTokenOptions throws on bad capacity', () => {
    expect(() => validateTokenOptions({ capacity: 0, refillRate: 1 })).toThrow();
  });

  it('describeTokenBucket returns string', () => {
    const desc = describeTokenBucket({ capacity: 10, refillRate: 0.01 });
    expect(desc).toContain('capacity=10');
  });

  it('listTokenPresets returns all presets', () => {
    expect(listTokenPresets()).toContain('default');
    expect(listTokenPresets().length).toBeGreaterThan(1);
  });
});
