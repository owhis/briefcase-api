import type { TimeoutState } from './timeout';

export interface TimeoutOptions {
  ms: number;
  onExpire?: (ms: number) => void;
}

const PRESETS: Record<string, TimeoutOptions> = {
  strict:  { ms: 1_000 },
  default: { ms: 5_000 },
  relaxed: { ms: 15_000 },
  long:    { ms: 30_000 },
};

export function getTimeoutPreset(name: string): TimeoutOptions {
  const preset = PRESETS[name];
  if (!preset) throw new Error(`Unknown timeout preset: "${name}". Valid: ${Object.keys(PRESETS).join(', ')}`);
  return { ...preset };
}

export function buildTimeoutOptions(input: Partial<TimeoutOptions> | string = 'default'): TimeoutOptions {
  if (typeof input === 'string') return getTimeoutPreset(input);
  const base = getTimeoutPreset('default');
  return { ...base, ...input };
}

export function validateTimeoutOptions(opts: TimeoutOptions): void {
  if (typeof opts.ms !== 'number' || !Number.isFinite(opts.ms) || opts.ms <= 0) {
    throw new Error(`TimeoutOptions.ms must be a finite positive number, got: ${opts.ms}`);
  }
  if (opts.onExpire !== undefined && typeof opts.onExpire !== 'function') {
    throw new Error('TimeoutOptions.onExpire must be a function');
  }
}

export function describeTimeoutState(state: Readonly<TimeoutState>): string {
  return `active=${state.active} cancelled=${state.cancelled} expired=${state.expired}`;
}

/**
 * Returns the names of all available timeout presets.
 */
export function listTimeoutPresets(): string[] {
  return Object.keys(PRESETS);
}

/**
 * Registers a custom timeout preset. Throws if the name conflicts with an
 * existing preset and `overwrite` is not set to `true`.
 */
export function registerTimeoutPreset(
  name: string,
  options: TimeoutOptions,
  overwrite = false,
): void {
  if (PRESETS[name] && !overwrite) {
    throw new Error(`Timeout preset "${name}" already exists. Pass overwrite=true to replace it.`);
  }
  validateTimeoutOptions(options);
  PRESETS[name] = { ...options };
}
