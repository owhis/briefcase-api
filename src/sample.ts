/**
 * sample.ts — Reservoir sampling utilities for streaming/paginated data.
 * Maintains a fixed-size sample of items seen so far using Algorithm R.
 */

export interface SampleState<T> {
  items: T[];
  seen: number;
  capacity: number;
}

export interface Sampler<T> {
  add: (item: T) => void;
  addMany: (items: T[]) => void;
  getState: () => SampleState<T>;
  getSample: () => T[];
  reset: () => void;
  isFull: () => boolean;
}

export function createSample<T>(capacity: number): Sampler<T> {
  if (capacity < 1) throw new RangeError(`capacity must be >= 1, got ${capacity}`);

  let items: T[] = [];
  let seen = 0;

  function add(item: T): void {
    seen += 1;
    if (items.length < capacity) {
      items.push(item);
    } else {
      const j = Math.floor(Math.random() * seen);
      if (j < capacity) {
        items[j] = item;
      }
    }
  }

  function addMany(batch: T[]): void {
    for (const item of batch) add(item);
  }

  function getState(): SampleState<T> {
    return { items: [...items], seen, capacity };
  }

  function getSample(): T[] {
    return [...items];
  }

  function reset(): void {
    items = [];
    seen = 0;
  }

  function isFull(): boolean {
    return items.length >= capacity;
  }

  return { add, addMany, getState, getSample, reset, isFull };
}
