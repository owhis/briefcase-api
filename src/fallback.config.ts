export interface FallbackOptions<T> {
  fallbackValue?: T;
  fallbackFn?: (error: unknown) => Promise<T> | T;
  onFallback?: (error: unknown) => void;
  shouldFallback?: (error: unknown) => boolean;
}

const presets: Record<string, FallbackOptions<unknown>> = {
  silent: {
    shouldFallback: () => true,
    onFallback: () => {},
  },
  strict: {
    shouldFallback: (err) => {
      if (err instanceof Error && err.message.includes('NetworkError')) {
        return true;
      }
      return false;
    },
  },
  verbose: {
    shouldFallback: () => true,
    onFallback: (err) => console.warn('[fallback] using fallback due to:', err),
  },
};

export function getFallbackPreset<T>(name: string): FallbackOptions<T> {
  const preset = presets[name];
  if (!preset) {
    throw new Error(`Unknown fallback preset: "${name}"`);
  }
  return preset as FallbackOptions<T>;
}

export function buildFallbackOptions<T>(
  options: Partial<FallbackOptions<T>>,
  preset?: string
): FallbackOptions<T> {
  const base = preset ? getFallbackPreset<T>(preset) : {};
  return { ...base, ...options };
}

export function validateFallbackOptions<T>(options: FallbackOptions<T>): void {
  if (options.fallbackValue !== undefined && options.fallbackFn) {
    throw new Error(
      'FallbackOptions: provide either fallbackValue or fallbackFn, not both.'
    );
  }
}
