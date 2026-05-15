/**
 * Configuration helpers and presets for the circuit breaker module.
 */

import type { CircuitBreakerOptions } from './circuit';

export type CircuitPreset = 'lenient' | 'default' | 'strict';

const PRESETS: Record<CircuitPreset, CircuitBreakerOptions> = {
  lenient: {
    threshold: 10,
    resetTimeout: 30_000,
  },
  default: {
    threshold: 5,
    resetTimeout: 15_000,
  },
  strict: {
    threshold: 2,
    resetTimeout: 60_000,
  },
};

export function getCircuitPreset(preset: CircuitPreset): CircuitBreakerOptions {
  return { ...PRESETS[preset] };
}

export function buildCircuitOptions(
  overrides: Partial<CircuitBreakerOptions> & { preset?: CircuitPreset } = {}
): CircuitBreakerOptions {
  const { preset = 'default', ...rest } = overrides;
  const base = getCircuitPreset(preset);
  return { ...base, ...rest };
}

export function validateCircuitOptions(options: CircuitBreakerOptions): void {
  if (!Number.isInteger(options.threshold) || options.threshold < 1) {
    throw new RangeError(
      `CircuitBreaker: threshold must be a positive integer, got ${options.threshold}`
    );
  }
  if (!Number.isFinite(options.resetTimeout) || options.resetTimeout < 0) {
    throw new RangeError(
      `CircuitBreaker: resetTimeout must be a non-negative number, got ${options.resetTimeout}`
    );
  }
}

/**
 * Returns the names of all available circuit breaker presets.
 */
export function listCircuitPresets(): CircuitPreset[] {
  return Object.keys(PRESETS) as CircuitPreset[];
}

/**
 * Returns true if the given string is a valid circuit breaker preset name.
 */
export function isCircuitPreset(value: string): value is CircuitPreset {
  return value in PRESETS;
}
