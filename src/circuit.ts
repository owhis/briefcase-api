/**
 * Circuit breaker — prevents repeated calls to a failing endpoint
 * by tracking consecutive failures and temporarily opening the circuit.
 */

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreaker {
  state: CircuitState;
  failures: number;
  lastFailureAt: number | null;
  call: <T>(fn: () => Promise<T>) => Promise<T>;
  reset: () => void;
  getState: () => CircuitState;
}

export interface CircuitBreakerOptions {
  threshold: number;      // failures before opening
  resetTimeout: number;   // ms before moving to half-open
  onStateChange?: (prev: CircuitState, next: CircuitState) => void;
}

export function createCircuitBreaker(options: CircuitBreakerOptions): CircuitBreaker {
  let state: CircuitState = 'closed';
  let failures = 0;
  let lastFailureAt: number | null = null;

  function transition(next: CircuitState): void {
    const prev = state;
    if (prev !== next) {
      state = next;
      options.onStateChange?.(prev, next);
    }
  }

  function getState(): CircuitState {
    if (state === 'open' && lastFailureAt !== null) {
      const elapsed = Date.now() - lastFailureAt;
      if (elapsed >= options.resetTimeout) {
        transition('half-open');
      }
    }
    return state;
  }

  async function call<T>(fn: () => Promise<T>): Promise<T> {
    const current = getState();

    if (current === 'open') {
      throw new Error('CircuitBreaker: circuit is open — request blocked');
    }

    try {
      const result = await fn();
      if (state === 'half-open') {
        failures = 0;
        lastFailureAt = null;
        transition('closed');
      }
      return result;
    } catch (err) {
      failures += 1;
      lastFailureAt = Date.now();
      if (failures >= options.threshold) {
        transition('open');
      }
      throw err;
    }
  }

  function reset(): void {
    failures = 0;
    lastFailureAt = null;
    transition('closed');
  }

  return { get state() { return state; }, get failures() { return failures; }, get lastFailureAt() { return lastFailureAt; }, call, reset, getState };
}
