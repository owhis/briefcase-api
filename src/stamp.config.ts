/**
 * stamp.config.ts — Preset configurations and option builders for stamp.
 */

import type { Stamp } from "./stamp";

export interface StampOptions {
  autoReset: boolean;
  maxEntries: number;
  warnThresholdMs: number;
}

const PRESETS: Record<string, StampOptions> = {
  default: {
    autoReset: false,
    maxEntries: 100,
    warnThresholdMs: 1000,
  },
  strict: {
    autoReset: true,
    maxEntries: 20,
    warnThresholdMs: 200,
  },
  verbose: {
    autoReset: false,
    maxEntries: 500,
    warnThresholdMs: 5000,
  },
};

export function getStampPreset(name: string): StampOptions {
  const preset = PRESETS[name];
  if (!preset) {
    throw new Error(`Unknown stamp preset: "${name}"`);
  }
  return { ...preset };
}

export function buildStampOptions(
  overrides: Partial<StampOptions> = {}
): StampOptions {
  return { ...PRESETS.default, ...overrides };
}

export function validateStampOptions(opts: StampOptions): void {
  if (opts.maxEntries < 1) {
    throw new Error("maxEntries must be at least 1");
  }
  if (opts.warnThresholdMs < 0) {
    throw new Error("warnThresholdMs must be non-negative");
  }
}

export function describeStamp(stamp: Stamp): string {
  const state = stamp.getState();
  const count = state.entries.length;
  const total =
    count >= 2
      ? state.entries[count - 1].ts - state.entries[0].ts
      : 0;
  return `Stamp: ${count} mark(s), total span ${total}ms`;
}

export function listStampPresets(): string[] {
  return Object.keys(PRESETS);
}
