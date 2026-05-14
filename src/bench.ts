/**
 * bench.ts — Lightweight benchmarking utility for measuring operation throughput and latency.
 */

export interface BenchSample {
  label: string;
  durationMs: number;
  timestamp: number;
}

export interface BenchState {
  label: string;
  runs: number;
  totalMs: number;
  minMs: number;
  maxMs: number;
  avgMs: number;
  p95Ms: number;
}

export interface Bench {
  run<T>(fn: () => T | Promise<T>): Promise<T>;
  getState(): BenchState;
  getSamples(): BenchSample[];
  reset(): void;
}

export function createBench(label: string): Bench {
  const samples: BenchSample[] = [];

  function computeState(): BenchState {
    if (samples.length === 0) {
      return { label, runs: 0, totalMs: 0, minMs: 0, maxMs: 0, avgMs: 0, p95Ms: 0 };
    }
    const durations = samples.map((s) => s.durationMs).sort((a, b) => a - b);
    const total = durations.reduce((sum, d) => sum + d, 0);
    const p95Index = Math.floor(durations.length * 0.95);
    return {
      label,
      runs: durations.length,
      totalMs: total,
      minMs: durations[0],
      maxMs: durations[durations.length - 1],
      avgMs: total / durations.length,
      p95Ms: durations[Math.min(p95Index, durations.length - 1)],
    };
  }

  async function run<T>(fn: () => T | Promise<T>): Promise<T> {
    const start = performance.now();
    const result = await fn();
    const durationMs = performance.now() - start;
    samples.push({ label, durationMs, timestamp: Date.now() });
    return result;
  }

  function getState(): BenchState {
    return computeState();
  }

  function getSamples(): BenchSample[] {
    return [...samples];
  }

  function reset(): void {
    samples.length = 0;
  }

  return { run, getState, getSamples, reset };
}
