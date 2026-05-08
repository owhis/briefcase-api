import { JitterOptions, JitterStrategy } from "./jitter";

const PRESETS: Record<string, JitterOptions> = {
  none: { strategy: "none", minMs: 0, maxMs: 30_000 },
  full: { strategy: "full", minMs: 0, maxMs: 30_000 },
  equal: { strategy: "equal", minMs: 100, maxMs: 30_000 },
  decorrelated: { strategy: "decorrelated", minMs: 100, maxMs: 30_000 },
};

export function getJitterPreset(name: string): JitterOptions {
  const preset = PRESETS[name];
  if (!preset) {
    throw new Error(`Unknown jitter preset: "${name}". Valid: ${Object.keys(PRESETS).join(", ")}`);
  }
  return { ...preset };
}

export function buildJitterOptions(
  partial: Partial<JitterOptions> & { strategy: JitterStrategy }
): JitterOptions {
  const base = getJitterPreset(partial.strategy);
  return { ...base, ...partial };
}

export function validateJitterOptions(options: JitterOptions): void {
  if (options.minMs < 0) {
    throw new RangeError(`jitter minMs must be >= 0, got ${options.minMs}`);
  }
  if (options.maxMs < options.minMs) {
    throw new RangeError(
      `jitter maxMs (${options.maxMs}) must be >= minMs (${options.minMs})`
    );
  }
  const valid: JitterStrategy[] = ["none", "full", "equal", "decorrelated"];
  if (!valid.includes(options.strategy)) {
    throw new TypeError(`Unknown jitter strategy: "${options.strategy}"`);
  }
}

export function describeJitter(options: JitterOptions): string {
  return (
    `strategy=${options.strategy} ` +
    `range=[${options.minMs}ms, ${options.maxMs}ms]`
  );
}

export function listJitterPresets(): string[] {
  return Object.keys(PRESETS);
}
