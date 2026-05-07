/**
 * replay.config.ts — Configuration helpers for the replay module.
 */

import type { ReplayStore } from "./replay";

export interface ReplayOptions {
  mode: "record" | "replay" | "passthrough";
  keyPrefix?: string;
  maxEntries?: number;
}

const REPLAY_PRESETS: Record<string, ReplayOptions> = {
  test: { mode: "replay", keyPrefix: "test", maxEntries: 500 },
  dev: { mode: "record", keyPrefix: "dev", maxEntries: 200 },
  prod: { mode: "passthrough" },
};

export function getReplayPreset(name: string): ReplayOptions {
  const preset = REPLAY_PRESETS[name];
  if (!preset) throw new Error(`Unknown replay preset: "${name}"`);
  return { ...preset };
}

export function buildReplayOptions(partial: Partial<ReplayOptions> = {}): ReplayOptions {
  return {
    mode: partial.mode ?? "passthrough",
    keyPrefix: partial.keyPrefix ?? "",
    maxEntries: partial.maxEntries ?? 1000,
  };
}

export function validateReplayOptions(opts: ReplayOptions): void {
  const validModes = ["record", "replay", "passthrough"];
  if (!validModes.includes(opts.mode)) {
    throw new Error(`Invalid replay mode: "${opts.mode}"`);
  }
  if (opts.maxEntries !== undefined && opts.maxEntries < 1) {
    throw new Error("maxEntries must be at least 1");
  }
}

export function buildReplayKey(
  url: string,
  method: string,
  prefix = ""
): string {
  const base = `${method.toUpperCase()}:${url}`;
  return prefix ? `${prefix}::${base}` : base;
}

export function isAtCapacity<T>(
  store: ReplayStore<T>,
  opts: ReplayOptions
): boolean {
  return !!opts.maxEntries && store.entries.size >= opts.maxEntries;
}
