/**
 * valve.config.ts — Configuration helpers and presets for the valve module.
 */

export interface ValveOptions {
  initiallyOpen: boolean;
  label?: string;
}

const PRESETS: Record<string, ValveOptions> = {
  default: { initiallyOpen: true },
  paused: { initiallyOpen: false },
  gated: { initiallyOpen: false, label: "gated" },
};

export function getValvePreset(name: string): ValveOptions {
  const preset = PRESETS[name];
  if (!preset) {
    throw new Error(`Unknown valve preset: "${name}". Available: ${Object.keys(PRESETS).join(", ")}`);
  }
  return { ...preset };
}

export function buildValveOptions(partial: Partial<ValveOptions> = {}): ValveOptions {
  return {
    initiallyOpen: true,
    ...partial,
  };
}

export function validateValveOptions(opts: ValveOptions): void {
  if (typeof opts.initiallyOpen !== "boolean") {
    throw new Error("ValveOptions.initiallyOpen must be a boolean");
  }
  if (opts.label !== undefined && typeof opts.label !== "string") {
    throw new Error("ValveOptions.label must be a string if provided");
  }
}

export function describeValve(opts: ValveOptions): string {
  const state = opts.initiallyOpen ? "open" : "closed";
  const label = opts.label ? ` [${opts.label}]` : "";
  return `Valve${label}: initially ${state}`;
}

export function listValvePresets(): string[] {
  return Object.keys(PRESETS);
}
