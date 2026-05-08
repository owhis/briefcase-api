/**
 * semaphore.ts — Counting semaphore for limiting concurrent async operations.
 */

export interface SemaphoreState {
  capacity: number;
  active: number;
  queued: number;
}

export interface Semaphore {
  acquire(): Promise<() => void>;
  getState(): SemaphoreState;
  drain(): Promise<void>;
}

interface Waiter {
  resolve: (release: () => void) => void;
}

export function createSemaphore(capacity: number): Semaphore {
  if (capacity < 1) throw new RangeError(`Semaphore capacity must be >= 1, got ${capacity}`);

  let active = 0;
  const queue: Waiter[] = [];

  function release(): void {
    active--;
    if (queue.length > 0) {
      const next = queue.shift()!;
      active++;
      next.resolve(release);
    }
  }

  function acquire(): Promise<() => void> {
    if (active < capacity) {
      active++;
      return Promise.resolve(release);
    }
    return new Promise<() => void>((resolve) => {
      queue.push({ resolve });
    });
  }

  function getState(): SemaphoreState {
    return { capacity, active, queued: queue.length };
  }

  function drain(): Promise<void> {
    if (active === 0 && queue.length === 0) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const interval = setInterval(() => {
        if (active === 0 && queue.length === 0) {
          clearInterval(interval);
          resolve();
        }
      }, 10);
    });
  }

  return { acquire, getState, drain };
}
