/**
 * Sliding window tracker for time-based aggregation of values.
 */

export interface WindowEntry {
  value: number;
  timestamp: number;
}

export interface WindowState {
  entries: WindowEntry[];
  sum: number;
  count: number;
  min: number;
  max: number;
  avg: number;
}

export interface SlidingWindow {
  record: (value: number) => void;
  getState: () => WindowState;
  prune: () => void;
  reset: () => void;
}

export function createWindow(durationMs: number): SlidingWindow {
  let entries: WindowEntry[] = [];

  function prune(): void {
    const cutoff = Date.now() - durationMs;
    entries = entries.filter((e) => e.timestamp >= cutoff);
  }

  function record(value: number): void {
    prune();
    entries.push({ value, timestamp: Date.now() });
  }

  function getState(): WindowState {
    prune();
    const count = entries.length;
    if (count === 0) {
      return { entries: [], sum: 0, count: 0, min: 0, max: 0, avg: 0 };
    }
    const values = entries.map((e) => e.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = sum / count;
    return { entries: [...entries], sum, count, min, max, avg };
  }

  function reset(): void {
    entries = [];
  }

  return { record, getState, prune, reset };
}
