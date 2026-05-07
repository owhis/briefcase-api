import { createPool, Pool } from './pool';
import {
  buildPoolOptions,
  validatePoolOptions,
  getPoolPreset,
  describePool,
} from './pool.config';

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

describe('createPool', () => {
  it('runs tasks up to concurrency limit', async () => {
    const pool = createPool({ concurrency: 2 });
    let running = 0;
    let maxRunning = 0;

    const task = async () => {
      running++;
      maxRunning = Math.max(maxRunning, running);
      await delay(20);
      running--;
    };

    await Promise.all([pool.run(task), pool.run(task), pool.run(task)]);
    expect(maxRunning).toBeLessThanOrEqual(2);
  });

  it('queues tasks beyond concurrency and processes them', async () => {
    const pool = createPool({ concurrency: 1 });
    const order: number[] = [];
    await Promise.all([
      pool.run(async () => { await delay(10); order.push(1); }),
      pool.run(async () => { order.push(2); }),
    ]);
    expect(order).toEqual([1, 2]);
  });

  it('returns the resolved value of the task', async () => {
    const pool = createPool({ concurrency: 2 });
    const result = await pool.run(async () => 42);
    expect(result).toBe(42);
  });

  it('propagates task errors without blocking pool', async () => {
    const pool = createPool({ concurrency: 2 });
    await expect(pool.run(async () => { throw new Error('fail'); })).rejects.toThrow('fail');
    const state = pool.getState();
    expect(state.active).toBe(0);
  });

  it('rejects queued tasks that exceed timeout', async () => {
    const pool = createPool({ concurrency: 1, timeout: 30 });
    pool.run(() => delay(200)).catch(() => {});
    await expect(pool.run(async () => 'ok')).rejects.toThrow(/timeout/);
  });

  it('getState reflects current pool status', async () => {
    const pool = createPool({ concurrency: 3 });
    expect(pool.getState()).toEqual({ active: 0, queued: 0, concurrency: 3 });
  });

  it('drain resolves when all tasks are complete', async () => {
    const pool = createPool({ concurrency: 2 });
    pool.run(() => delay(30));
    pool.run(() => delay(30));
    await pool.drain();
    expect(pool.getState().active).toBe(0);
  });
});

describe('pool.config', () => {
  it('getPoolPreset returns correct defaults', () => {
    expect(getPoolPreset('low').concurrency).toBe(2);
    expect(getPoolPreset('high').concurrency).toBe(10);
  });

  it('buildPoolOptions merges overrides with preset', () => {
    const opts = buildPoolOptions({ concurrency: 7 }, 'medium');
    expect(opts.concurrency).toBe(7);
    expect(opts.timeout).toBe(10000);
  });

  it('validatePoolOptions throws on invalid concurrency', () => {
    expect(() => validatePoolOptions({ concurrency: 0 })).toThrow(RangeError);
  });

  it('validatePoolOptions throws on invalid timeout', () => {
    expect(() => validatePoolOptions({ concurrency: 2, timeout: -1 })).toThrow(RangeError);
  });

  it('describePool formats options as string', () => {
    expect(describePool({ concurrency: 5, timeout: 1000 })).toBe('Pool(concurrency=5, timeout=1000ms)');
    expect(describePool({ concurrency: 3 })).toBe('Pool(concurrency=3)');
  });
});
