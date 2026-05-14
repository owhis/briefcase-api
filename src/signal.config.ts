/**
 * signal.config.ts — Presets, option builders, and validation for signal.
 */

import type { SignalOptions } from "./signal";

export type SignalPreset = "default" | "short" | "long" | "infinite";

const PRESETS: Record<SignalPreset, SignalOptions> = {
  default: { timeoutMs: 5_000 },
  short: { timeoutMs: 1_000 },
  long: { timeoutMs: 30_000 },
  infinite: { timeoutMs: undefined },
};

export function getSignalPreset(name: SignalPreset): SignalOptions {
  const preset = PRESETS[name];
  if (!preset) throw new Error(`Unknown signal preset: "${name}"`);
  return { ...preset };
}

export function buildSignalOptions(
  overrides: Partial<SignalOptions> = {},
  preset: SignalPreset = "default"
): SignalOptions {
  return { ...getSignalPreset(preset), ...overrides };
}

export function validateSignalOptions(options: SignalOptions): void {
  if (
    options.timeoutMs !== undefined &&
    (typeof options.timeoutMs !== "number" || options.timeoutMs < 0)
  ) {
    throw new RangeError(
      `timeoutMs must be a non-negative number, got: ${options.timeoutMs}`
    );
  }
  if (
    options.parent !== undefined &&
    !(options.parent instanceof AbortSignal)
  ) {
    throw new TypeError("parent must be an AbortSignal instance");
  }
}

export function describeSignal(options: SignalOptions): string {
  const parts: string[] = [];
  if (options.timeoutMs !== undefined) {
    parts.push(`timeout=${options.timeoutMs}ms`);
  } else {
    parts.push("timeout=none");
  }
  if (options.parent) parts.push("cascades-from-parent");
  return `Signal(${parts.join(", ")})`;
}

export function listSignalPresets(): SignalPreset[] {
  return Object.keys(PRESETS) as SignalPreset[];
}
