/**
 * hedge.config.ts — Configuration helpers and presets for the hedge module.
 */

export interface HedgeOptions {
  /** Milliseconds to wait before firing the speculative hedge request */
  delayMs: number;
  /** Maximum number of total attempts (primary + hedges) */
  maxAttempts: number;
}

type HedgePreset = 'fast' | 'balanced' | 'conservative';

const PRESETS: Record<HedgePreset, HedgeOptions> = {
  fast:         { delayMs: 50,  maxAttempts: 2 },
  balanced:     { delayMs: 150, maxAttempts: 2 },
  conservative: { delayMs: 400, maxAttempts: 2 },
};

export function getHedgePreset(name: HedgePreset): HedgeOptions {
  return { ...PRESETS[name] };
}

export function buildHedgeOptions(
  overrides: Partial<HedgeOptions> = {}
): HedgeOptions {
  const base = getHedgePreset('balanced');
  return { ...base, ...overrides };
}

export function validateHedgeOptions(opts: HedgeOptions): void {
  if (opts.delayMs < 0) {
    throw new RangeError(`hedge: delayMs must be >= 0, got ${opts.delayMs}`);
  }
  if (opts.maxAttempts < 1) {
    throw new RangeError(
      `hedge: maxAttempts must be >= 1, got ${opts.maxAttempts}`
    );
  }
}

export function describeHedge(opts: HedgeOptions): string {
  return (
    `hedge(delayMs=${opts.delayMs}, maxAttempts=${opts.maxAttempts})`
  );
}
