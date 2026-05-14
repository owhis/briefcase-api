/**
 * meter.config.ts — Presets, builders, and validators for Meter options.
 */

import type { MeterOptions } from "./meter";

type MeterPreset = "fast" | "standard" | "slow";

const PRESETS: Record<MeterPreset, MeterOptions> = {
  fast: { windowMs: 1_000, maxSamples: 500 },
  standard: { windowMs: 10_000, maxSamples: 1_000 },
  slow: { windowMs: 60_000, maxSamples: 2_000 },
};

export function getMeterPreset(name: MeterPreset): MeterOptions {
  return { ...PRESETS[name] };
}

export function buildMeterOptions(
  overrides: Partial<MeterOptions> = {},
  preset: MeterPreset = "standard"
): MeterOptions {
  return { ...getMeterPreset(preset), ...overrides };
}

export function validateMeterOptions(options: MeterOptions): void {
  if (options.windowMs <= 0) {
    throw new RangeError(`windowMs must be positive, got ${options.windowMs}`);
  }
  if (options.maxSamples <= 0) {
    throw new RangeError(
      `maxSamples must be positive, got ${options.maxSamples}`
    );
  }
}

export function describeMeter(options: MeterOptions): string {
  const secs = (options.windowMs / 1000).toFixed(1);
  return `Meter(window=${secs}s, maxSamples=${options.maxSamples})`;
}

export function listMeterPresets(): MeterPreset[] {
  return Object.keys(PRESETS) as MeterPreset[];
}
