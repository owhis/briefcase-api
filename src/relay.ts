/**
 * relay.ts — Forward requests through a chain of base URLs with fallback support.
 */

export interface RelayTarget {
  baseUrl: string;
  weight?: number;
  disabled?: boolean;
}

export interface RelayState {
  current: number;
  attempts: number;
  exhausted: boolean;
}

export interface Relay {
  resolve: () => string | null;
  fail: () => void;
  reset: () => void;
  getState: () => RelayState;
}

export function createRelay(targets: RelayTarget[]): Relay {
  if (!targets || targets.length === 0) {
    throw new Error("createRelay: at least one target is required");
  }

  const active = targets.filter((t) => !t.disabled);
  if (active.length === 0) {
    throw new Error("createRelay: all targets are disabled");
  }

  let current = 0;
  let attempts = 0;

  function resolve(): string | null {
    if (current >= active.length) return null;
    return active[current].baseUrl;
  }

  function fail(): void {
    current += 1;
    attempts += 1;
  }

  function reset(): void {
    current = 0;
    attempts = 0;
  }

  function getState(): RelayState {
    return {
      current,
      attempts,
      exhausted: current >= active.length,
    };
  }

  return { resolve, fail, reset, getState };
}
