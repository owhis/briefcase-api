export interface DebounceState {
  pending: boolean;
  callCount: number;
  lastCalledAt: number | null;
  lastFiredAt: number | null;
}

export interface DebounceHandle<T extends unknown[]> {
  call: (...args: T) => void;
  flush: () => void;
  cancel: () => void;
  getState: () => DebounceState;
  reset: () => void;
}

export interface DebounceOptions {
  waitMs: number;
  maxWaitMs?: number;
  leading?: boolean;
  trailing?: boolean;
}

export function createDebounce<T extends unknown[]>(
  fn: (...args: T) => void,
  options: DebounceOptions
): DebounceHandle<T> {
  const { waitMs, maxWaitMs, leading = false, trailing = true } = options;

  let timer: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: T | null = null;
  let callCount = 0;
  let lastCalledAt: number | null = null;
  let lastFiredAt: number | null = null;
  let firstCallAt: number | null = null;

  function fire(args: T): void {
    lastFiredAt = Date.now();
    firstCallAt = null;
    fn(...args);
  }

  function schedule(args: T): void {
    if (timer !== null) clearTimeout(timer);

    const now = Date.now();
    if (firstCallAt === null) firstCallAt = now;

    const sinceFirst = now - firstCallAt;
    const remainingMax =
      maxWaitMs !== undefined ? maxWaitMs - sinceFirst : Infinity;
    const delay = Math.min(waitMs, remainingMax);

    timer = setTimeout(() => {
      timer = null;
      if (trailing && lastArgs !== null) fire(lastArgs);
    }, delay);
  }

  return {
    call(...args: T): void {
      callCount++;
      lastCalledAt = Date.now();
      lastArgs = args;

      const isFirst = timer === null && leading;
      schedule(args);
      if (isFirst) fire(args);
    },

    flush(): void {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      if (lastArgs !== null) fire(lastArgs);
    },

    cancel(): void {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      lastArgs = null;
    },

    getState(): DebounceState {
      return {
        pending: timer !== null,
        callCount,
        lastCalledAt,
        lastFiredAt,
      };
    },

    reset(): void {
      if (timer !== null) {
        clearTimeout(timer);
        timer = null;
      }
      lastArgs = null;
      callCount = 0;
      lastCalledAt = null;
      lastFiredAt = null;
      firstCallAt = null;
    },
  };
}
