/**
 * pivot.config.ts — Preset configurations and option builders for Pivot.
 */

export interface PivotOptions {
  total: number;
  startIndex?: number;
}

const PRESETS: Record<string, PivotOptions> = {
  single: { total: 1, startIndex: 0 },
  pair: { total: 2, startIndex: 0 },
  trio: { total: 3, startIndex: 0 },
  quad: { total: 4, startIndex: 0 },
};

export type PivotPreset = keyof typeof PRESETS;

export function getPivotPreset(name: PivotPreset): PivotOptions {
  const preset = PRESETS[name];
  if (!preset) throw new Error(`Unknown pivot preset: "${name}"`);
  return { ...preset };
}

export function listPivotPresets(): PivotPreset[] {
  return Object.keys(PRESETS) as PivotPreset[];
}

export function buildPivotOptions(
  overrides: Partial<PivotOptions> & { total: number }
): PivotOptions {
  return {
    startIndex: 0,
    ...overrides,
  };
}

export function validatePivotOptions(opts: PivotOptions): void {
  if (!Number.isInteger(opts.total) || opts.total < 1)
    throw new RangeError("PivotOptions.total must be a positive integer");
  const start = opts.startIndex ?? 0;
  if (!Number.isInteger(start) || start < 0 || start >= opts.total)
    throw new RangeError(
      `PivotOptions.startIndex must be in [0, ${opts.total - 1}]`
    );
}

export function describePivot(opts: PivotOptions): string {
  const start = opts.startIndex ?? 0;
  return `Pivot(total=${opts.total}, startIndex=${start})`;
}
