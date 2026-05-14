/**
 * valve.ts — Controls flow by opening/closing a passage for async tasks.
 * When closed, enqueued tasks wait until the valve is opened.
 */

export interface ValveState {
  open: boolean;
  waiting: number;
  processed: number;
}

export interface Valve {
  open(): void;
  close(): void;
  isOpen(): boolean;
  pass<T>(fn: () => Promise<T>): Promise<T>;
  getState(): ValveState;
  drain(): Promise<void>;
}

export function createValve(initiallyOpen = true): Valve {
  let _open = initiallyOpen;
  let _processed = 0;
  const _waiters: Array<() => void> = [];

  function open(): void {
    _open = true;
    const pending = _waiters.splice(0);
    for (const resolve of pending) resolve();
  }

  function close(): void {
    _open = false;
  }

  function isOpen(): boolean {
    return _open;
  }

  function waitForOpen(): Promise<void> {
    if (_open) return Promise.resolve();
    return new Promise<void>((resolve) => {
      _waiters.push(resolve);
    });
  }

  async function pass<T>(fn: () => Promise<T>): Promise<T> {
    await waitForOpen();
    const result = await fn();
    _processed++;
    return result;
  }

  function getState(): ValveState {
    return {
      open: _open,
      waiting: _waiters.length,
      processed: _processed,
    };
  }

  async function drain(): Promise<void> {
    await waitForOpen();
  }

  return { open, close, isOpen, pass, getState, drain };
}
