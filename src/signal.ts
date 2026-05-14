/**
 * signal.ts — Lightweight abort signal manager with timeout and cascade support.
 */

export interface SignalState {
  aborted: boolean;
  reason: string | undefined;
  timedOut: boolean;
}

export interface SignalHandle {
  signal: AbortSignal;
  abort: (reason?: string) => void;
  getState: () => SignalState;
  reset: () => void;
}

export interface SignalOptions {
  timeoutMs?: number;
  parent?: AbortSignal;
}

export function createSignal(options: SignalOptions = {}): SignalHandle {
  const { timeoutMs, parent } = options;

  let controller = new AbortController();
  let timedOut = false;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  function attachParent(sig: AbortSignal) {
    if (sig.aborted) {
      controller.abort("parent aborted");
      return;
    }
    sig.addEventListener("abort", () => controller.abort("parent aborted"), {
      once: true,
    });
  }

  function scheduleTimeout(ms: number) {
    timeoutId = setTimeout(() => {
      timedOut = true;
      controller.abort("timeout");
    }, ms);
  }

  function init() {
    if (parent) attachParent(parent);
    if (timeoutMs !== undefined && timeoutMs > 0) scheduleTimeout(timeoutMs);
  }

  init();

  return {
    get signal() {
      return controller.signal;
    },
    abort(reason = "aborted") {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      controller.abort(reason);
    },
    getState(): SignalState {
      return {
        aborted: controller.signal.aborted,
        reason: controller.signal.reason as string | undefined,
        timedOut,
      };
    },
    reset() {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      timedOut = false;
      controller = new AbortController();
      init();
    },
  };
}
