export interface TickerOptions {
  intervalMs: number;
  maxTicks?: number;
  leading?: boolean;
  onTick?: (tick: number) => void;
}

export interface TickerState {
  ticks: number;
  running: boolean;
  startedAt: number | null;
  lastTickAt: number | null;
}

export interface Ticker {
  start: () => void;
  stop: () => void;
  reset: () => void;
  getState: () => TickerState;
  onTick: (handler: (tick: number) => void) => () => void;
}

export function createTicker(options: TickerOptions): Ticker {
  let ticks = 0;
  let running = false;
  let startedAt: number | null = null;
  let lastTickAt: number | null = null;
  let timerId: ReturnType<typeof setInterval> | null = null;
  const handlers = new Set<(tick: number) => void>();

  if (options.onTick) {
    handlers.add(options.onTick);
  }

  function emit(): void {
    if (options.maxTicks !== undefined && ticks >= options.maxTicks) {
      stop();
      return;
    }
    ticks += 1;
    lastTickAt = Date.now();
    for (const h of handlers) h(ticks);
  }

  function start(): void {
    if (running) return;
    running = true;
    startedAt = Date.now();
    if (options.leading) emit();
    timerId = setInterval(emit, options.intervalMs);
  }

  function stop(): void {
    if (!running) return;
    running = false;
    if (timerId !== null) {
      clearInterval(timerId);
      timerId = null;
    }
  }

  function reset(): void {
    stop();
    ticks = 0;
    startedAt = null;
    lastTickAt = null;
  }

  function getState(): TickerState {
    return { ticks, running, startedAt, lastTickAt };
  }

  function onTick(handler: (tick: number) => void): () => void {
    handlers.add(handler);
    return () => handlers.delete(handler);
  }

  return { start, stop, reset, getState, onTick };
}
