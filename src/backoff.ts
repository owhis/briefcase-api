/**
 * backoff.ts — Configurable backoff strategies for retry delays.
 */

export type BackoffStrategy = "fixed" | "linear" | "exponential" | "fibonacci";

export interface BackoffState {
  attempt: number;
  lastDelay: number;
  totalDelay: number;
  strategy: BackoffStrategy;
}

export interface BackoffOptions {
  strategy: BackoffStrategy;
  baseMs: number;
  maxMs: number;
  factor: number;
}

export interface Backoff {
  next(): number;
  reset(): void;
  getState(): BackoffState;
}

const fibCache: number[] = [0, 1];
function fib(n: number): number {
  for (let i = fibCache.length; i <= n; i++) {
    fibCache[i] = fibCache[i - 1] + fibCache[i - 2];
  }
  return fibCache[n];
}

export function createBackoff(options: BackoffOptions): Backoff {
  const { strategy, baseMs, maxMs, factor } = options;
  let attempt = 0;
  let lastDelay = 0;
  let totalDelay = 0;

  function computeNext(): number {
    switch (strategy) {
      case "fixed":
        return baseMs;
      case "linear":
        return baseMs * (attempt + 1) * factor;
      case "exponential":
        return baseMs * Math.pow(factor, attempt);
      case "fibonacci":
        return baseMs * fib(attempt + 1);
      default:
        return baseMs;
    }
  }

  return {
    next(): number {
      const raw = computeNext();
      const clamped = Math.min(raw, maxMs);
      lastDelay = clamped;
      totalDelay += clamped;
      attempt++;
      return clamped;
    },

    reset(): void {
      attempt = 0;
      lastDelay = 0;
      totalDelay = 0;
    },

    getState(): BackoffState {
      return { attempt, lastDelay, totalDelay, strategy };
    },
  };
}
