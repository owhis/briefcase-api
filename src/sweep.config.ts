/**
 * sweep.config.ts — Configuration helpers and presets for sweep.
 */

import type { SweeperFn } from "./sweep";

export interface SweepOptions {
  intervalMs: number;
  sweepers: SweeperFn[];
  autoStart: boolean;
}

export type SweepPreset = "aggressive" | "balanced" | "lazy";

const PRESETS: Record<SweepPreset, Pick<SweepOptions, "intervalMs" | "autoStart">> = {
  aggressive: { intervalMs: 5_000, autoStart: true },
  balanced:   { intervalMs: 30_000, autoStart: true },
  lazy:       { intervalMs: 120_000, autoStart: false },
};

export function getSweepPreset(name: SweepPreset) {
  return { ...PRESETS[name] };
}

export function listSweepPresets(): SweepPreset[] {
  return Object.keys(PRESETS) as SweepPreset[];
}

export function buildSweepOptions(
  partial: Partial<SweepOptions> & { sweepers: SweeperFn[] }
): SweepOptions {
  return {
    intervalMs: 30_000,
    autoStart: false,
    ...partial,
  };
}

export function validateSweepOptions(opts: SweepOptions): void {
  if (opts.intervalMs <= 0) {
    throw new RangeError(`intervalMs must be positive, got ${opts.intervalMs}`);
  }
  if (!Array.isArray(opts.sweepers) || opts.sweepers.length === 0) {
    throw new TypeError("sweepers must be a non-empty array of functions");
  }
  for (const fn of opts.sweepers) {
    if (typeof fn !== "function") {
      throw new TypeError("each sweeper must be a function");
    }
  }
}

export function describeSweep(opts: SweepOptions): string {
  return `Sweep every ${opts.intervalMs}ms with ${opts.sweepers.length} sweeper(s) [autoStart=${opts.autoStart}]`;
}
