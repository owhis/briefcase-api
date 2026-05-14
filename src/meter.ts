/**
 * meter.ts — Tracks rate and volume metrics over a rolling time window.
 */

export interface MeterOptions {
  windowMs: number;
  maxSamples: number;
}

export interface MeterState {
  count: number;
  rate: number; // events per second
  windowMs: number;
  oldest: number | null;
  newest: number | null;
}

export interface Meter {
  record: () => void;
  getState: () => MeterState;
  reset: () => void;
}

interface Sample {
  ts: number;
}

export function createMeter(options: MeterOptions): Meter {
  const { windowMs, maxSamples } = options;
  let samples: Sample[] = [];

  function prune(now: number): void {
    const cutoff = now - windowMs;
    samples = samples.filter((s) => s.ts > cutoff);
  }

  function record(): void {
    const now = Date.now();
    prune(now);
    if (samples.length < maxSamples) {
      samples.push({ ts: now });
    }
  }

  function getState(): MeterState {
    const now = Date.now();
    prune(now);
    const count = samples.length;
    const rate = count > 0 ? (count / windowMs) * 1000 : 0;
    const oldest = count > 0 ? samples[0].ts : null;
    const newest = count > 0 ? samples[count - 1].ts : null;
    return { count, rate, windowMs, oldest, newest };
  }

  function reset(): void {
    samples = [];
  }

  return { record, getState, reset };
}
