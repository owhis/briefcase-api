import { describe, it, expect, beforeEach } from 'vitest';
import { createBench, Bench } from './bench';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('createBench', () => {
  let bench: Bench;

  beforeEach(() => {
    bench = createBench('test-op');
  });

  it('returns initial empty state', () => {
    const state = bench.getState();
    expect(state.label).toBe('test-op');
    expect(state.runs).toBe(0);
    expect(state.totalMs).toBe(0);
    expect(state.avgMs).toBe(0);
  });

  it('records a synchronous run and returns its result', async () => {
    const result = await bench.run(() => 42);
    expect(result).toBe(42);
    const state = bench.getState();
    expect(state.runs).toBe(1);
    expect(state.totalMs).toBeGreaterThanOrEqual(0);
  });

  it('records an async run and returns its result', async () => {
    const result = await bench.run(async () => {
      await delay(10);
      return 'hello';
    });
    expect(result).toBe('hello');
    const state = bench.getState();
    expect(state.runs).toBe(1);
    expect(state.minMs).toBeGreaterThanOrEqual(5);
  });

  it('accumulates multiple runs', async () => {
    for (let i = 0; i < 5; i++) {
      await bench.run(() => i * 2);
    }
    const state = bench.getState();
    expect(state.runs).toBe(5);
    expect(state.totalMs).toBeGreaterThanOrEqual(0);
  });

  it('computes min, max, and avg correctly', async () => {
    await bench.run(() => delay(5));
    await bench.run(() => delay(15));
    const state = bench.getState();
    expect(state.minMs).toBeLessThanOrEqual(state.maxMs);
    expect(state.avgMs).toBeGreaterThanOrEqual(state.minMs);
    expect(state.avgMs).toBeLessThanOrEqual(state.maxMs);
  });

  it('getSamples returns a copy with correct labels', async () => {
    await bench.run(() => 1);
    await bench.run(() => 2);
    const samples = bench.getSamples();
    expect(samples).toHaveLength(2);
    expect(samples.every((s) => s.label === 'test-op')).toBe(true);
  });

  it('reset clears all samples', async () => {
    await bench.run(() => 99);
    bench.reset();
    const state = bench.getState();
    expect(state.runs).toBe(0);
    expect(bench.getSamples()).toHaveLength(0);
  });

  it('p95 is within min/max bounds', async () => {
    for (let i = 0; i < 20; i++) {
      await bench.run(() => i);
    }
    const state = bench.getState();
    expect(state.p95Ms).toBeGreaterThanOrEqual(state.minMs);
    expect(state.p95Ms).toBeLessThanOrEqual(state.maxMs);
  });
});
