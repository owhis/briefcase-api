/**
 * shard.config.ts — Presets and option builders for the shard module.
 */

import { ShardOptions } from "./shard";

export type ShardPreset = "small" | "medium" | "large" | "xlarge";

const PRESETS: Record<ShardPreset, ShardOptions> = {
  small:  { buckets: 4 },
  medium: { buckets: 16 },
  large:  { buckets: 64 },
  xlarge: { buckets: 256 },
};

export function getShardPreset(preset: ShardPreset): ShardOptions {
  const p = PRESETS[preset];
  if (!p) throw new Error(`Unknown shard preset: "${preset}"`);
  return { ...p };
}

export function buildShardOptions(
  overrides: Partial<ShardOptions> = {},
  preset: ShardPreset = "medium"
): ShardOptions {
  return { ...getShardPreset(preset), ...overrides };
}

export function validateShardOptions(options: ShardOptions): void {
  if (typeof options.buckets !== "number" || options.buckets < 1) {
    throw new RangeError("ShardOptions.buckets must be a positive integer");
  }
  if (options.hash !== undefined && typeof options.hash !== "function") {
    throw new TypeError("ShardOptions.hash must be a function");
  }
}

export function describeShard(options: ShardOptions): string {
  return `Shard(buckets=${options.buckets}, hash=${options.hash ? "custom" : "default"})`;
}

export function listShardPresets(): ShardPreset[] {
  return Object.keys(PRESETS) as ShardPreset[];
}
