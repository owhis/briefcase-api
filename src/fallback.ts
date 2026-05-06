import { FallbackOptions } from './fallback.config';

export interface FallbackState<T> {
  usedFallback: boolean;
  value: T | null;
  error: unknown | null;
}

export function createFallback<T>(options: FallbackOptions<T>) {
  const { fallbackValue, fallbackFn, onFallback, shouldFallback } = options;

  async function run(primary: () => Promise<T>): Promise<FallbackState<T>> {
    try {
      const value = await primary();
      return { usedFallback: false, value, error: null };
    } catch (err) {
      const eligible = shouldFallback ? shouldFallback(err) : true;

      if (!eligible) {
        return { usedFallback: false, value: null, error: err };
      }

      if (onFallback) {
        onFallback(err);
      }

      if (fallbackFn) {
        const value = await fallbackFn(err);
        return { usedFallback: true, value, error: err };
      }

      if (fallbackValue !== undefined) {
        return { usedFallback: true, value: fallbackValue, error: err };
      }

      return { usedFallback: false, value: null, error: err };
    }
  }

  function resolve(state: FallbackState<T>): T | null {
    return state.value;
  }

  return { run, resolve };
}
