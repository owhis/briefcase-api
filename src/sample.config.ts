/**
 * sample.config.ts — Preset configurations and option builders for createSample.
 */

export interface SampleOptions {
  capacity: number;
  label?: string;
}

const PRESETS: Record<string, SampleOptions> = {
  tiny:   { capacity: 10,   label: "tiny" },
  small:  { capacity: 50,   label: "small" },
  medium: { capacity: 200,  label: "medium" },
  large:  { capacity: 1000, label: "large" },
};

export type SamplePreset = keyof typeof PRESETS;

export function getSamplePreset(name: SamplePreset): SampleOptions {
  const preset = PRESETS[name];
  if (!preset) throw new Error(`Unknown sample preset: "${name}"`);
  return { ...preset };
}

export function listSamplePresets(): SamplePreset[] {
  return Object.keys(PRESETS) as SamplePreset[];
}

export function buildSampleOptions(
  overrides: Partial<SampleOptions> = {}
): SampleOptions {
  return {
    capacity: 100,
    ...overrides,
  };
}

export function validateSampleOptions(opts: SampleOptions): void {
  if (!Number.isInteger(opts.capacity) || opts.capacity < 1) {
    throw new RangeError(`SampleOptions.capacity must be a positive integer, got ${opts.capacity}`);
  }
  if (opts.label !== undefined && typeof opts.label !== "string") {
    throw new TypeError(`SampleOptions.label must be a string`);
  }
}

export function describeSample(opts: SampleOptions): string {
  const label = opts.label ? ` (${opts.label})` : "";
  return `Reservoir sampler${label}: capacity=${opts.capacity}`;
}
