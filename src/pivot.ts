/**
 * pivot.ts — Tracks a rotating index across a fixed set of targets,
 * advancing on each call and wrapping around when exhausted.
 */

export interface PivotState {
  index: number;
  total: number;
  cycles: number;
}

export interface Pivot {
  current: () => number;
  advance: () => number;
  reset: () => void;
  getState: () => PivotState;
  peek: (offset?: number) => number;
}

export function createPivot(total: number, startIndex = 0): Pivot {
  if (total < 1) throw new RangeError("Pivot total must be at least 1");
  if (startIndex < 0 || startIndex >= total)
    throw new RangeError("startIndex out of range");

  let index = startIndex;
  let cycles = 0;

  function current(): number {
    return index;
  }

  function advance(): number {
    const prev = index;
    index = (index + 1) % total;
    if (index === 0) cycles++;
    return prev;
  }

  function peek(offset = 1): number {
    return (index + offset) % total;
  }

  function reset(): void {
    index = startIndex;
    cycles = 0;
  }

  function getState(): PivotState {
    return { index, total, cycles };
  }

  return { current, advance, reset, getState, peek };
}
