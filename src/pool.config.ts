/**
 * pool.config.ts — Presets and option builders for the pool module.
 */

import { PoolOptions } from './pool';

export type PoolPreset = 'low' | 'medium' | 'high' | 'unlimited';

const PRESETS: Record<PoolPreset, PoolOptions> = {
  low: { concurrency: 2, timeout: 5000 },
  medium: { concurrency: 5, timeout: 10000 },
  high: { concurrency: 10, timeout: 15000 },
  unlimited: { concurrency: Infinity },
};

export function getPoolPreset(preset: PoolPreset): PoolOptions {
  return { ...PRESETS[preset] };
}

export function buildPoolOptions(
  overrides: Partial<PoolOptions> = {},
  preset: PoolPreset = 'medium'
): PoolOptions {
  const base = getPoolPreset(preset);
  return { ...base, ...overrides };
}

export function validatePoolOptions(options: PoolOptions): void {
  if (options.concurrency <= 0) {
    throw new RangeError(
      `Pool concurrency must be greater than 0, got ${options.concurrency}`
    );
  }
  if (options.timeout !== undefined && options.timeout <= 0) {
    throw new RangeError(
      `Pool timeout must be greater than 0, got ${options.timeout}`
    );
  }
}

export function describePool(options: PoolOptions): string {
  const parts = [`concurrency=${options.concurrency}`];
  if (options.timeout !== undefined) {
    parts.push(`timeout=${options.timeout}ms`);
  }
  return `Pool(${parts.join(', ')})`;
}
