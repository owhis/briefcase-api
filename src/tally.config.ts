// tally.config.ts — presets and option builders for createTally

export interface TallyOptions {
  ceiling: number | null;
}

const PRESETS: Record<string, TallyOptions> = {
  default: { ceiling: null },
  bounded: { ceiling: 1000 },
  binary: { ceiling: 1 },
  byte: { ceiling: 255 },
};

export function getTallyPreset(name: string): TallyOptions {
  const preset = PRESETS[name];
  if (!preset) {
    throw new Error(
      `Unknown tally preset "${name}". Available: ${Object.keys(PRESETS).join(", ")}`
    );
  }
  return { ...preset };
}

export function buildTallyOptions(overrides: Partial<TallyOptions> = {}): TallyOptions {
  const base = getTallyPreset("default");
  return { ...base, ...overrides };
}

export function validateTallyOptions(opts: TallyOptions): void {
  if (opts.ceiling !== null && opts.ceiling <= 0) {
    throw new RangeError(`TallyOptions.ceiling must be a positive number or null, got ${opts.ceiling}`);
  }
}

export function describeTally(opts: TallyOptions): string {
  return opts.ceiling !== null
    ? `Tally (ceiling: ${opts.ceiling})`
    : "Tally (unbounded)";
}

export function listTallyPresets(): string[] {
  return Object.keys(PRESETS);
}
