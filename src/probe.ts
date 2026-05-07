/**
 * probe.ts — Lightweight health-check probe for REST API endpoints.
 * Tracks reachability and latency over a rolling window of samples.
 */

export interface ProbeSample {
  ok: boolean;
  latencyMs: number;
  timestamp: number;
}

export interface ProbeState {
  healthy: boolean;
  totalChecks: number;
  failureCount: number;
  avgLatencyMs: number;
  lastCheckedAt: number | null;
}

export interface ProbeOptions {
  windowSize: number;       // max samples to retain
  failureThreshold: number; // min failures in window to mark unhealthy
  timeoutMs: number;        // per-request timeout
}

export interface Probe {
  check: (url: string) => Promise<ProbeSample>;
  getState: () => ProbeState;
  getSamples: () => ProbeSample[];
  reset: () => void;
}

export function createProbe(options: Partial<ProbeOptions> = {}): Probe {
  const opts: ProbeOptions = {
    windowSize: options.windowSize ?? 10,
    failureThreshold: options.failureThreshold ?? 3,
    timeoutMs: options.timeoutMs ?? 5000,
  };

  let samples: ProbeSample[] = [];

  function prune(): void {
    if (samples.length > opts.windowSize) {
      samples = samples.slice(samples.length - opts.windowSize);
    }
  }

  async function check(url: string): Promise<ProbeSample> {
    const start = Date.now();
    let ok = false;
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), opts.timeoutMs);
      const res = await fetch(url, { method: "HEAD", signal: controller.signal });
      clearTimeout(timer);
      ok = res.ok;
    } catch {
      ok = false;
    }
    const sample: ProbeSample = { ok, latencyMs: Date.now() - start, timestamp: Date.now() };
    samples.push(sample);
    prune();
    return sample;
  }

  function getState(): ProbeState {
    const window = samples.slice(-opts.windowSize);
    const failureCount = window.filter((s) => !s.ok).length;
    const avgLatencyMs =
      window.length > 0
        ? Math.round(window.reduce((acc, s) => acc + s.latencyMs, 0) / window.length)
        : 0;
    return {
      healthy: failureCount < opts.failureThreshold,
      totalChecks: samples.length,
      failureCount,
      avgLatencyMs,
      lastCheckedAt: samples.length > 0 ? samples[samples.length - 1].timestamp : null,
    };
  }

  function getSamples(): ProbeSample[] {
    return [...samples];
  }

  function reset(): void {
    samples = [];
  }

  return { check, getState, getSamples, reset };
}
