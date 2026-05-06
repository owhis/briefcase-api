import { createFallback } from './fallback';
import {
  buildFallbackOptions,
  validateFallbackOptions,
  getFallbackPreset,
} from './fallback.config';

const fail = (msg = 'primary error') =>
  () => Promise.reject(new Error(msg));

const succeed = <T>(val: T) => () => Promise.resolve(val);

describe('createFallback', () => {
  it('returns primary value on success', async () => {
    const fb = createFallback({ fallbackValue: 'default' });
    const state = await fb.run(succeed('real'));
    expect(state.usedFallback).toBe(false);
    expect(state.value).toBe('real');
    expect(state.error).toBeNull();
  });

  it('uses fallbackValue when primary fails', async () => {
    const fb = createFallback({ fallbackValue: 'default' });
    const state = await fb.run(fail());
    expect(state.usedFallback).toBe(true);
    expect(state.value).toBe('default');
  });

  it('uses fallbackFn when primary fails', async () => {
    const fb = createFallback({ fallbackFn: () => 'computed' });
    const state = await fb.run(fail());
    expect(state.usedFallback).toBe(true);
    expect(state.value).toBe('computed');
  });

  it('calls onFallback when falling back', async () => {
    const onFallback = jest.fn();
    const fb = createFallback({ fallbackValue: 0, onFallback });
    await fb.run(fail());
    expect(onFallback).toHaveBeenCalledTimes(1);
  });

  it('skips fallback when shouldFallback returns false', async () => {
    const fb = createFallback({
      fallbackValue: 99,
      shouldFallback: () => false,
    });
    const state = await fb.run(fail());
    expect(state.usedFallback).toBe(false);
    expect(state.value).toBeNull();
  });

  it('resolve returns state value', async () => {
    const fb = createFallback({ fallbackValue: 42 });
    const state = await fb.run(succeed(7));
    expect(fb.resolve(state)).toBe(7);
  });
});

describe('buildFallbackOptions', () => {
  it('merges preset and overrides', () => {
    const opts = buildFallbackOptions({ fallbackValue: 'x' }, 'silent');
    expect(opts.fallbackValue).toBe('x');
    expect(typeof opts.onFallback).toBe('function');
  });

  it('throws on unknown preset', () => {
    expect(() => getFallbackPreset('nope')).toThrow();
  });
});

describe('validateFallbackOptions', () => {
  it('throws when both fallbackValue and fallbackFn are set', () => {
    expect(() =>
      validateFallbackOptions({ fallbackValue: 1, fallbackFn: () => 2 })
    ).toThrow();
  });

  it('does not throw with only fallbackValue', () => {
    expect(() => validateFallbackOptions({ fallbackValue: 1 })).not.toThrow();
  });
});
