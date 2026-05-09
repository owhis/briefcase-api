/**
 * latch.ts — A one-shot gate that resolves all waiting callers once opened.
 * Useful for coordinating initialization or first-load barriers.
 */

export interface Latch {
  wait(): Promise<void>;
  open(): void;
  close(): void;
  isOpen(): boolean;
}

export interface LatchState {
  open: boolean;
  waiters: number;
}

export function createLatch(initiallyOpen = false): Latch {
  let opened = initiallyOpen;
  let resolve: (() => void) | null = null;
  let promise: Promise<void> = initiallyOpen
    ? Promise.resolve()
    : new Promise<void>((r) => { resolve = r; });
  let waiters = 0;

  function wait(): Promise<void> {
    if (opened) return Promise.resolve();
    waiters++;
    return promise.finally(() => { waiters = Math.max(0, waiters - 1); });
  }

  function open(): void {
    if (opened) return;
    opened = true;
    if (resolve) {
      resolve();
      resolve = null;
    }
  }

  function close(): void {
    if (!opened) return;
    opened = false;
    promise = new Promise<void>((r) => { resolve = r; });
  }

  function isOpen(): boolean {
    return opened;
  }

  return { wait, open, close, isOpen };
}

export function getState(latch: Latch, waiters: number): LatchState {
  return { open: latch.isOpen(), waiters };
}
