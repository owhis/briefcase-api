import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createTimeout,
  withTimeout,
  getTimeoutState,
  resetTimeoutState,
  TimeoutError,
} from './timeout';

beforeEach(() => { resetTimeoutState(); vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });

describe('createTimeout', () => {
  it('rejects with TimeoutError after given ms', async () => {
    const t = createTimeout(100);
    vi.advanceTimersByTime(100);
    await expect(t).rejects.toBeInstanceOf(TimeoutError);
  });

  it('cancel() prevents rejection and updates state', () => {
    const t = createTimeout(100);
    t.cancel();
    vi.advanceTimersByTime(200);
    expect(getTimeoutState().cancelled).toBe(1);
    expect(getTimeoutState().expired).toBe(0);
  });

  it('increments active count while pending', () => {
    createTimeout(100);
    expect(getTimeoutState().active).toBe(1);
  });
});

describe('withTimeout', () => {
  it('resolves with value when promise settles before timeout', async () => {
    const fast = Promise.resolve(42);
    await expect(withTimeout(fast, 500)).resolves.toBe(42);
  });

  it('rejects with TimeoutError when promise is too slow', async () => {
    const slow = new Promise<number>(() => {});
    const p = withTimeout(slow, 50);
    vi.advanceTimersByTime(50);
    await expect(p).rejects.toBeInstanceOf(TimeoutError);
  });

  it('cancels timeout when underlying promise rejects', async () => {
    const failing = Promise.reject(new Error('oops'));
    await expect(withTimeout(failing, 500)).rejects.toThrow('oops');
    expect(getTimeoutState().cancelled).toBe(1);
  });

  it('updates expired count on timeout', async () => {
    const slow = new Promise<number>(() => {});
    const p = withTimeout(slow, 50);
    vi.advanceTimersByTime(50);
    await p.catch(() => {});
    expect(getTimeoutState().expired).toBe(1);
  });
});

describe('TimeoutError', () => {
  it('has correct name property', () => {
    const err = new TimeoutError('test');
    expect(err.name).toBe('TimeoutError');
    expect(err).toBeInstanceOf(Error);
  });
});
