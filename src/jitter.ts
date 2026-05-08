export type JitterStrategy = "none" | "full" | "equal" | "decorrelated";

export interface JitterState {
  strategy: JitterStrategy;
  lastDelay: number;
  calls: number;
}

export interface JitterOptions {
  strategy: JitterStrategy;
  minMs: number;
  maxMs: number;
  seed?: number;
}

function rand(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function createJitter(options: JitterOptions): JitterState {
  return {
    strategy: options.strategy,
    lastDelay: options.minMs,
    calls: 0,
  };
}

export function applyJitter(
  state: JitterState,
  baseDelayMs: number,
  options: JitterOptions
): { state: JitterState; delayMs: number } {
  const { minMs, maxMs } = options;
  let delayMs: number;

  switch (state.strategy) {
    case "none":
      delayMs = baseDelayMs;
      break;
    case "full":
      delayMs = rand(0, baseDelayMs);
      break;
    case "equal":
      delayMs = baseDelayMs / 2 + rand(0, baseDelayMs / 2);
      break;
    case "decorrelated":
      delayMs = rand(minMs, Math.max(minMs, state.lastDelay * 3));
      break;
    default:
      delayMs = baseDelayMs;
  }

  delayMs = Math.min(Math.max(delayMs, minMs), maxMs);

  const next: JitterState = {
    ...state,
    lastDelay: delayMs,
    calls: state.calls + 1,
  };

  return { state: next, delayMs };
}

export function getState(state: JitterState): JitterState {
  return { ...state };
}

export function reset(state: JitterState, options: JitterOptions): JitterState {
  return createJitter(options);
}
