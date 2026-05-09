import type { TickerOptions } from "./ticker";

export type TickerPreset = "fast" | "normal" | "slow" | "heartbeat";

const PRESETS: Record<TickerPreset, Partial<TickerOptions>> = {
  fast: { intervalMs: 100, leading: false },
  normal: { intervalMs: 1000, leading: false },
  slow: { intervalMs: 5000, leading: false },
  heartbeat: { intervalMs: 30_000, leading: true },
};

export function getTickerPreset(name: TickerPreset): Partial<TickerOptions> {
  const preset = PRESETS[name];
  if (!preset) throw new Error(`Unknown ticker preset: "${name}"`);
  return { ...preset };
}

export function buildTickerOptions(
  base: Partial<TickerOptions> = {},
  overrides: Partial<TickerOptions> = {}
): TickerOptions {
  const merged = { intervalMs: 1000, leading: false, ...base, ...overrides };
  return validateTickerOptions(merged);
}

export function validateTickerOptions(opts: Partial<TickerOptions>): TickerOptions {
  if (typeof opts.intervalMs !== "number" || opts.intervalMs <= 0) {
    throw new Error("Ticker intervalMs must be a positive number");
  }
  if (opts.maxTicks !== undefined && (typeof opts.maxTicks !== "number" || opts.maxTicks < 1)) {
    throw new Error("Ticker maxTicks must be a positive integer");
  }
  return opts as TickerOptions;
}

export function describeTicker(opts: TickerOptions): string {
  const parts = [`interval=${opts.intervalMs}ms`];
  if (opts.maxTicks !== undefined) parts.push(`maxTicks=${opts.maxTicks}`);
  if (opts.leading) parts.push("leading");
  return `Ticker(${parts.join(", ")})`;
}

export function listTickerPresets(): TickerPreset[] {
  return Object.keys(PRESETS) as TickerPreset[];
}
