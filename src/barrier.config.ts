/**
 * barrier.config.ts — Presets and option builders for Barrier.
 */

export interface BarrierOptions {
  target: number;
  label?: string;
}

const PRESETS: Record<string, BarrierOptions> = {
  pair:   { target: 2,  label: 'pair' },
  trio:   { target: 3,  label: 'trio' },
  quorum: { target: 5,  label: 'quorum' },
  batch:  { target: 10, label: 'batch' },
};

export function getBarrierPreset(name: string): BarrierOptions {
  const preset = PRESETS[name];
  if (!preset) {
    throw new Error(`Unknown barrier preset "${name}". Available: ${Object.keys(PRESETS).join(', ')}`);
  }
  return { ...preset };
}

export function buildBarrierOptions(overrides: Partial<BarrierOptions> = {}): BarrierOptions {
  const base: BarrierOptions = { target: 2 };
  return { ...base, ...overrides };
}

export function validateBarrierOptions(opts: BarrierOptions): void {
  if (!Number.isInteger(opts.target) || opts.target < 1) {
    throw new RangeError(`BarrierOptions.target must be a positive integer, got ${opts.target}`);
  }
  if (opts.label !== undefined && typeof opts.label !== 'string') {
    throw new TypeError('BarrierOptions.label must be a string');
  }
}

export function describeBarrier(opts: BarrierOptions): string {
  const label = opts.label ? ` (${opts.label})` : '';
  return `Barrier${label}: waits for ${opts.target} parties`;
}

export function listBarrierPresets(): string[] {
  return Object.keys(PRESETS);
}
