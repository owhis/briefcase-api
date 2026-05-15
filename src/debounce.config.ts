import type { DebounceOptions } from "./debounce";

export type DebouncePreset = "default" | "fast" | "slow" | "leading" | "maxWait";

const PRESETS: Record<DebouncePreset, DebounceOptions> = {
  default: { waitMs: 300, trailing: true, leading: false },
  fast: { waitMs: 100, trailing: true, leading: false },
  slow: { waitMs: 600, trailing: true, leading: false },
  leading: { waitMs: 300, trailing: false, leading: true },
  maxWait: { waitMs: 300, maxWaitMs: 1000, trailing: true, leading: false },
};

export function getDebouncePreset(name: DebouncePreset): DebounceOptions {
  const preset = PRESETS[name];
  if (!preset) throw new Error(`Unknown debounce preset: "${name}"`);
  return { ...preset };
}

export function listDebouncePresets(): DebouncePreset[] {
  return Object.keys(PRESETS) as DebouncePreset[];
}

export function buildDebounceOptions(
  overrides: Partial<DebounceOptions> & { waitMs: number }
): DebounceOptions {
  return {
    trailing: true,
    leading: false,
    ...overrides,
  };
}

export function validateDebounceOptions(options: DebounceOptions): void {
  if (options.waitMs <= 0) {
    throw new RangeError(`waitMs must be > 0, got ${options.waitMs}`);
  }
  if (options.maxWaitMs !== undefined && options.maxWaitMs < options.waitMs) {
    throw new RangeError(
      `maxWaitMs (${options.maxWaitMs}) must be >= waitMs (${options.waitMs})`
    );
  }
  if (!options.leading && !options.trailing) {
    throw new Error("At least one of leading or trailing must be true");
  }
}

export function describeDebounce(options: DebounceOptions): string {
  const parts: string[] = [`wait=${options.waitMs}ms`];
  if (options.maxWaitMs !== undefined) parts.push(`maxWait=${options.maxWaitMs}ms`);
  if (options.leading) parts.push("leading");
  if (options.trailing) parts.push("trailing");
  return `Debounce(${parts.join(", ")})`;
}
