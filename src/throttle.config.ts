/**
 * Preset configurations and factory helpers for the throttle module.
 */

import { ThrottleOptions } from "./throttle";

export type ThrottlePreset = "conservative" | "standard" | "aggressive";

const PRESETS: Record<ThrottlePreset, ThrottleOptions> = {
  /** 10 requests per 10 seconds — suitable for strict third-party APIs */
  conservative: { maxRequests: 10, windowMs: 10_000 },
  /** 30 requests per 10 seconds — general-purpose default */
  standard: { maxRequests: 30, windowMs: 10_000 },
  /** 60 requests per 10 seconds — internal or high-capacity APIs */
  aggressive: { maxRequests: 60, windowMs: 10_000 },
};

/**
 * Retrieve a named throttle preset.
 */
export function getThrottlePreset(name: ThrottlePreset): ThrottleOptions {
  return { ...PRESETS[name] };
}

/**
 * Merge user-supplied overrides on top of a named preset.
 */
export function buildThrottleOptions(
  preset: ThrottlePreset,
  overrides: Partial<ThrottleOptions> = {}
): ThrottleOptions {
  return { ...getThrottlePreset(preset), ...overrides };
}

/**
 * Validate that a ThrottleOptions object has sensible values.
 * Throws a descriptive error when validation fails.
 */
export function validateThrottleOptions(options: ThrottleOptions): void {
  if (!Number.isInteger(options.maxRequests) || options.maxRequests < 1) {
    throw new RangeError(
      `throttle: maxRequests must be a positive integer, got ${options.maxRequests}`
    );
  }
  if (!Number.isFinite(options.windowMs) || options.windowMs <= 0) {
    throw new RangeError(
      `throttle: windowMs must be a positive number, got ${options.windowMs}`
    );
  }
}
