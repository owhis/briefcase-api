import { createFallback } from './fallback';
import { buildFallbackOptions, validateFallbackOptions } from './fallback.config';

describe('fallback integration', () => {
  it('integrates buildFallbackOptions with createFallback using verbose preset', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    const opts = buildFallbackOptions<string>(
      { fallbackValue: 'cached-data' },
      'verbose'
    );
    validateFallbackOptions(opts);

    const fb = createFallback(opts);
    const state = await fb.run(() => Promise.reject(new Error('timeout')));

    expect(state.usedFallback).toBe(true);
    expect(state.value).toBe('cached-data');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('chains fallbackFn with async resolution', async () => {
    const opts = buildFallbackOptions<number[]>({
      fallbackFn: async () => [1, 2, 3],
    });
    const fb = createFallback(opts);
    const state = await fb.run(() => Promise.reject(new Error('api down')));

    expect(state.usedFallback).toBe(true);
    expect(fb.resolve(state)).toEqual([1, 2, 3]);
  });

  it('respects shouldFallback based on error type', async () => {
    const opts = buildFallbackOptions<string>({
      fallbackValue: 'fallback',
      shouldFallback: (err) =>
        err instanceof Error && err.message === 'NetworkError',
    });
    const fb = createFallback(opts);

    const nonNetwork = await fb.run(() =>
      Promise.reject(new Error('AuthError'))
    );
    expect(nonNetwork.usedFallback).toBe(false);

    const network = await fb.run(() =>
      Promise.reject(new Error('NetworkError'))
    );
    expect(network.usedFallback).toBe(true);
    expect(network.value).toBe('fallback');
  });
});
