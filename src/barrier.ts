/**
 * barrier.ts — Synchronization primitive that blocks until N parties arrive.
 */

export interface BarrierState {
  count: number;
  target: number;
  generation: number;
  released: boolean;
}

export interface Barrier {
  arrive(): Promise<void>;
  reset(): void;
  getState(): BarrierState;
  remaining(): number;
}

export function createBarrier(target: number): Barrier {
  if (target < 1) throw new RangeError(`Barrier target must be >= 1, got ${target}`);

  let count = 0;
  let generation = 0;
  let released = false;
  let resolvers: Array<() => void> = [];

  function getState(): BarrierState {
    return { count, target, generation, released };
  }

  function remaining(): number {
    return Math.max(0, target - count);
  }

  function arrive(): Promise<void> {
    count += 1;

    if (count >= target) {
      released = true;
      const pending = resolvers.slice();
      resolvers = [];
      count = 0;
      generation += 1;
      released = false;
      pending.forEach(r => r());
      return Promise.resolve();
    }

    return new Promise<void>(resolve => {
      resolvers.push(resolve);
    });
  }

  function reset(): void {
    count = 0;
    released = false;
    const pending = resolvers.slice();
    resolvers = [];
    pending.forEach(r => r());
  }

  return { arrive, reset, getState, remaining };
}
