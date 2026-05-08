/**
 * Configuration helpers for the sliding window module.
 */

export interface WindowOptions {
  durationMs: number;
  label?: string;
}

const PRESETS: Record<string, WindowOptions> = {
  second: { durationMs: 1_000, label: "1s" },
  minute: { durationMs: 60_000, label: "1m" },
  fiveMinutes: { durationMs: 300_000, label: "5m" },
  hour: { durationMs: 3_600_000, label: "1h" },
};

export function getWindowPreset(name: string): WindowOptions {
  const preset = PRESETS[name];
  if (!preset) {
    throw new Error(
      `Unknown window preset "${name}". Available: ${Object.keys(PRESETS).join(", ")}`
    );
  }
  return { ...preset };
}

export function buildWindowOptions(
  overrides: Partial<WindowOptions> = {}
): WindowOptions {
  const base: WindowOptions = { durationMs: 60_000 };
  return { ...base, ...overrides };
}

export function validateWindowOptions(opts: WindowOptions): void {
  if (typeof opts.durationMs !== "number" || opts.durationMs <= 0) {
    throw new Error("WindowOptions.durationMs must be a positive number");
  }
}

export function describeWindow(opts: WindowOptions): string {
  const label = opts.label ?? `${opts.durationMs}ms`;
  return `SlidingWindow(duration=${label})`;
}

export function listWindowPresets(): string[] {
  return Object.keys(PRESETS);
}
