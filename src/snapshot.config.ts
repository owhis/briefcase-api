/**
 * snapshot.config.ts — Configuration and presets for snapshot behaviour.
 */

import { SnapshotStore, createMemoryStore } from "./snapshot";

export interface SnapshotOptions<T> {
  store: SnapshotStore<T>;
  ttlMs: number | null;
  keyPrefix: string;
}

const PRESETS = {
  ephemeral: { ttlMs: 30_000, keyPrefix: "snap" },
  session: { ttlMs: 5 * 60_000, keyPrefix: "snap" },
  persistent: { ttlMs: null, keyPrefix: "snap" },
} as const;

export type SnapshotPreset = keyof typeof PRESETS;

export function getSnapshotPreset(preset: SnapshotPreset) {
  return PRESETS[preset];
}

export function buildSnapshotOptions<T>(
  overrides: Partial<SnapshotOptions<T>> & { preset?: SnapshotPreset } = {}
): SnapshotOptions<T> {
  const { preset = "ephemeral", ...rest } = overrides;
  const base = getSnapshotPreset(preset);
  return {
    store: createMemoryStore<T>(),
    ttlMs: base.ttlMs,
    keyPrefix: base.keyPrefix,
    ...rest,
  };
}

export function validateSnapshotOptions<T>(
  opts: SnapshotOptions<T>
): asserts opts is SnapshotOptions<T> {
  if (!opts.store) {
    throw new Error("[snapshot] store is required");
  }
  if (opts.ttlMs !== null && opts.ttlMs <= 0) {
    throw new Error("[snapshot] ttlMs must be a positive number or null");
  }
  if (!opts.keyPrefix || typeof opts.keyPrefix !== "string") {
    throw new Error("[snapshot] keyPrefix must be a non-empty string");
  }
}

export function buildSnapshotKey(prefix: string, ...parts: string[]): string {
  return [prefix, ...parts].join(":");
}
