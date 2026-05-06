/**
 * Throttle utility for rate-limiting outgoing API requests.
 * Ensures no more than `maxRequests` are dispatched within a `windowMs` period.
 */

export interface ThrottleOptions {
  /** Maximum number of requests allowed per window. */
  maxRequests: number;
  /** Duration of the rolling window in milliseconds. */
  windowMs: number;
}

export interface ThrottleState {
  timestamps: number[];
}

/**
 * Creates a stateful throttle function that resolves when a request slot is available.
 * Callers should `await acquire()` before dispatching each request.
 */
export function createThrottle(options: ThrottleOptions) {
  const { maxRequests, windowMs } = options;
  const state: ThrottleState = { timestamps: [] };

  function pruneExpired(now: number): void {
    const cutoff = now - windowMs;
    state.timestamps = state.timestamps.filter((t) => t > cutoff);
  }

  function nextAvailableDelay(now: number): number {
    pruneExpired(now);
    if (state.timestamps.length < maxRequests) return 0;
    const oldest = state.timestamps[0];
    return oldest + windowMs - now;
  }

  async function acquire(): Promise<void> {
    let delay = nextAvailableDelay(Date.now());
    while (delay > 0) {
      await sleep(delay);
      delay = nextAvailableDelay(Date.now());
    }
    state.timestamps.push(Date.now());
  }

  function getState(): Readonly<ThrottleState> {
    return { timestamps: [...state.timestamps] };
  }

  return { acquire, getState };
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
