/**
 * drain.config.ts — Presets and option builders for drain.
 */

import type { DrainOptions } from "./drain";

export interface DrainPresetName = "default" | "shallow" | "deep";

const presets: Record<string, DrainOptions<unknown>> = {
  default: {
    maxPages: 10,
    maxItems: Infinity,
  },
  shallow: {
    maxPages: 1,
    maxItems: 100,
  },
  deep: {
    maxPages: 100,
    maxItems: Infinity,
  },
};

export function getDrainPreset<T>(name: string): DrainOptions<T> {
  const preset = presets[name];
  if (!preset) {
    throw new Error(`[drain] Unknown preset: "${name}"`);
  }
  return preset as DrainOptions<T>;
}

export function buildDrainOptions<T>(
  overrides: DrainOptions<T> = {},
  presetName = "default"
): DrainOptions<T> {
  const base = getDrainPreset<T>(presetName);
  return { ...base, ...overrides };
}

export function validateDrainOptions<T>(options: DrainOptions<T>): void {
  if (options.maxPages !== undefined && options.maxPages < 1) {
    throw new RangeError("[drain] maxPages must be >= 1");
  }
  if (options.maxItems !== undefined && options.maxItems < 1) {
    throw new RangeError("[drain] maxItems must be >= 1");
  }
}

export function describeDrain<T>(options: DrainOptions<T>): string {
  const parts: string[] = [];
  if (options.maxPages !== Infinity && options.maxPages !== undefined) {
    parts.push(`maxPages=${options.maxPages}`);
  }
  if (options.maxItems !== Infinity && options.maxItems !== undefined) {
    parts.push(`maxItems=${options.maxItems}`);
  }
  if (options.signal) parts.push("abortable");
  return parts.length ? `drain(${parts.join(", ")})` : "drain(unbounded)";
}
