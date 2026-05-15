export type TracePresetName = "default" | "verbose" | "minimal";

export interface TraceOptions {
  maxSpans: number;
  autoTag: boolean;
  includeTimestamps: boolean;
  preset?: TracePresetName;
}

const PRESETS: Record<TracePresetName, TraceOptions> = {
  default: { maxSpans: 500, autoTag: true, includeTimestamps: true },
  verbose: { maxSpans: 2000, autoTag: true, includeTimestamps: true },
  minimal: { maxSpans: 100, autoTag: false, includeTimestamps: false },
};

export function getTracePreset(name: TracePresetName): TraceOptions {
  const preset = PRESETS[name];
  if (!preset) throw new Error(`Unknown trace preset: "${name}"`);
  return { ...preset, preset: name };
}

export function listTracePresets(): TracePresetName[] {
  return Object.keys(PRESETS) as TracePresetName[];
}

export function buildTraceOptions(overrides: Partial<TraceOptions> = {}): TraceOptions {
  const base = getTracePreset(overrides.preset ?? "default");
  return { ...base, ...overrides };
}

export function validateTraceOptions(opts: TraceOptions): void {
  if (opts.maxSpans < 1) throw new Error("maxSpans must be at least 1");
}

export function describeTrace(opts: TraceOptions): string {
  const parts = [
    `maxSpans=${opts.maxSpans}`,
    opts.autoTag ? "autoTag" : "no-autoTag",
    opts.includeTimestamps ? "timestamps" : "no-timestamps",
  ];
  return `Trace(${parts.join(", ")})`;
}
