/**
 * pool.ts — Manages a fixed-size pool of concurrent request slots.
 */

export interface PoolOptions {
  concurrency: number;
  timeout?: number;
}

export interface PoolState {
  active: number;
  queued: number;
  concurrency: number;
}

export interface Pool {
  run: <T>(task: () => Promise<T>) => Promise<T>;
  getState: () => PoolState;
  drain: () => Promise<void>;
}

export function createPool(options: PoolOptions): Pool {
  const { concurrency, timeout } = options;
  let active = 0;
  const queue: Array<() => void> = [];

  function next(): void {
    if (queue.length > 0 && active < concurrency) {
      const resolve = queue.shift()!;
      active++;
      resolve();
    }
  }

  async function run<T>(task: () => Promise<T>): Promise<T> {
    if (active < concurrency) {
      active++;
    } else {
      await new Promise<void>((resolve, reject) => {
        let timer: ReturnType<typeof setTimeout> | undefined;
        if (timeout !== undefined) {
          timer = setTimeout(() => {
            const idx = queue.indexOf(entry);
            if (idx !== -1) queue.splice(idx, 1);
            reject(new Error(`Pool queue timeout after ${timeout}ms`));
          }, timeout);
        }
        const entry = () => {
          if (timer !== undefined) clearTimeout(timer);
          resolve();
        };
        queue.push(entry);
      });
    }

    try {
      return await task();
    } finally {
      active--;
      next();
    }
  }

  function getState(): PoolState {
    return { active, queued: queue.length, concurrency };
  }

  async function drain(): Promise<void> {
    while (active > 0 || queue.length > 0) {
      await new Promise<void>((r) => setTimeout(r, 10));
    }
  }

  return { run, getState, drain };
}
