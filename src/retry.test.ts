import { withRetry, RetryOptions } from './retry';

describe('withRetry', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('returns the result on first success', async () => {
    const fn = jest.fn().mockResolvedValue('ok');
    const result = await withRetry(fn);
    expect(result).toBe('ok');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries on failure and succeeds eventually', async () => {
    const fn = jest
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const promise = withRetry(fn, { baseDelayMs: 0 });
    await jest.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('throws after maxAttempts are exhausted', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('always fails'));

    const promise = withRetry(fn, { maxAttempts: 3, baseDelayMs: 0 });
    await jest.runAllTimersAsync();

    await expect(promise).rejects.toThrow('always fails');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('does not retry when shouldRetry returns false', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('no retry'));
    const options: RetryOptions = { shouldRetry: () => false };

    await expect(withRetry(fn, options)).rejects.toThrow('no retry');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('respects custom maxAttempts', async () => {
    const fn = jest.fn().mockRejectedValue(new Error('fail'));

    const promise = withRetry(fn, { maxAttempts: 5, baseDelayMs: 0 });
    await jest.runAllTimersAsync();

    await expect(promise).rejects.toThrow();
    expect(fn).toHaveBeenCalledTimes(5);
  });
});
