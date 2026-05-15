/**
 * sweep.ts — Periodic cleanup utility for expiring stale entries across stores.
 */

export interface SweepHandle {
  start: () => void;
  stop: () => void;
  runOnce: () => number;
  getState: () => SweepState;
}

export interface SweepState {
  running: boolean;
  lastRun: number | null;
  totalCleaned: number;
  cycles: number;
}

export type SweeperFn = () => number;

export function createSweep(
  sweepers: SweeperFn[],
  intervalMs: number
): SweepHandle {
  let timer: ReturnType<typeof setInterval> | null = null;
  const state: SweepState = {
    running: false,
    lastRun: null,
    totalCleaned: 0,
    cycles: 0,
  };

  function runOnce(): number {
    let cleaned = 0;
    for (const sweeper of sweepers) {
      cleaned += sweeper();
    }
    state.lastRun = Date.now();
    state.totalCleaned += cleaned;
    state.cycles += 1;
    return cleaned;
  }

  function start(): void {
    if (state.running) return;
    state.running = true;
    timer = setInterval(() => {
      runOnce();
    }, intervalMs);
  }

  function stop(): void {
    if (!state.running) return;
    state.running = false;
    if (timer !== null) {
      clearInterval(timer);
      timer = null;
    }
  }

  function getState(): SweepState {
    return { ...state };
  }

  return { start, stop, runOnce, getState };
}
