import { createHedge } from './hedge';
import { buildHedgeOptions, validateHedgeOptions, getHedgePreset, describeHedge } from './hedge.config';

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function makeTask<T>(value: T, latencyMs: number): () => Promise<T> {
  return () => delay(latencyMs).then(() => value);
}

function makeFailingTask(latencyMs: number): () => Promise<never> {
  return () => delay(latencyMs).then(() => { throw new Error('task failed'); });
}

describe('createHedge', () => {
  it('resolves with the primary result when fast enough', async () => {
    const handle = createHedge(makeTask('primary', 10), 100);
    await expect(handle.result).resolves.toBe('primary');
    expect(handle.state().winner).toBe('primary');
    expect(handle.state().hedged).toBe(false);
  });

  it('fires hedge request when primary is slow', async () => {
    const handle = createHedge(makeTask('slow', 300), 30);
    const result = await handle.result;
    expect(result).toBe('slow');
    expect(handle.state().hedged).toBe(true);
    expect(handle.state().attempts).toBe(2);
  });

  it('returns the faster of primary and hedge', async () => {
    let calls = 0;
    const fn = () => {
      calls++;
      const latency = calls === 1 ? 200 : 20;
      return delay(latency).then(() => `call-${calls}`);
    };
    const handle = createHedge(fn, 50);
    const result = await handle.result;
    // hedge fires at 50ms and resolves at 70ms; primary resolves at 200ms
    expect(result).toBe('call-2');
    expect(handle.state().winner).toBe('hedge');
  });

  it('exposes attempt count via state()', async () => {
    const handle = createHedge(makeTask(42, 5), 1);
    await handle.result;
    expect(handle.state().attempts).toBeGreaterThanOrEqual(1);
  });
});

describe('hedge.config', () => {
  it('getHedgePreset returns correct values', () => {
    expect(getHedgePreset('fast').delayMs).toBe(50);
    expect(getHedgePreset('conservative').delayMs).toBe(400);
  });

  it('buildHedgeOptions merges overrides', () => {
    const opts = buildHedgeOptions({ delayMs: 75 });
    expect(opts.delayMs).toBe(75);
    expect(opts.maxAttempts).toBe(2);
  });

  it('validateHedgeOptions throws on negative delayMs', () => {
    expect(() => validateHedgeOptions({ delayMs: -1, maxAttempts: 2 })).toThrow(RangeError);
  });

  it('validateHedgeOptions throws on zero maxAttempts', () => {
    expect(() => validateHedgeOptions({ delayMs: 100, maxAttempts: 0 })).toThrow(RangeError);
  });

  it('describeHedge returns a readable string', () => {
    const desc = describeHedge({ delayMs: 150, maxAttempts: 2 });
    expect(desc).toContain('delayMs=150');
    expect(desc).toContain('maxAttempts=2');
  });
});
