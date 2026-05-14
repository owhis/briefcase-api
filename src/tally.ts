// tally.ts — lightweight named counter with optional ceiling and reset support

export interface TallyState {
  counts: Record<string, number>;
  total: number;
  ceiling: number | null;
}

export interface Tally {
  increment(key: string, by?: number): number;
  decrement(key: string, by?: number): number;
  get(key: string): number;
  getState(): TallyState;
  reset(key?: string): void;
}

export function createTally(ceiling: number | null = null): Tally {
  const counts: Record<string, number> = {};

  function increment(key: string, by = 1): number {
    if (by < 0) throw new RangeError("increment 'by' must be non-negative");
    const current = counts[key] ?? 0;
    const next = current + by;
    counts[key] = ceiling !== null ? Math.min(next, ceiling) : next;
    return counts[key];
  }

  function decrement(key: string, by = 1): number {
    if (by < 0) throw new RangeError("decrement 'by' must be non-negative");
    const current = counts[key] ?? 0;
    counts[key] = Math.max(0, current - by);
    return counts[key];
  }

  function get(key: string): number {
    return counts[key] ?? 0;
  }

  function getState(): TallyState {
    const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
    return { counts: { ...counts }, total, ceiling };
  }

  function reset(key?: string): void {
    if (key !== undefined) {
      delete counts[key];
    } else {
      for (const k of Object.keys(counts)) delete counts[k];
    }
  }

  return { increment, decrement, get, getState, reset };
}
