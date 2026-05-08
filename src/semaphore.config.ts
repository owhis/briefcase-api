/**
 * semaphore.config.ts — Presets and option builders for semaphore.
 */

export interface SemaphoreOptions {
  capacity: number;
  label?: string;
}

const PRESETS: Record<string, SemaphoreOptions> = {
  single: { capacity: 1, label: "single" },
  low: { capacity: 3, label: "low" },
  medium: { capacity: 10, label: "medium" },
  high: { capacity: 25, label: "high" },
};

export function getSemaphorePreset(name: string): SemaphoreOptions {
  const preset = PRESETS[name];
  if (!preset) {
    throw new Error(`Unknown semaphore preset "${name}". Available: ${Object.keys(PRESETS).join(", ")}`);
  }
  return { ...preset };
}

export function buildSemaphoreOptions(
  overrides: Partial<SemaphoreOptions> = {}
): SemaphoreOptions {
  const base = getSemaphorePreset("medium");
  return { ...base, ...overrides };
}

export function validateSemaphoreOptions(opts: SemaphoreOptions): void {
  if (typeof opts.capacity !== "number" || opts.capacity < 1) {
    throw new RangeError(`SemaphoreOptions.capacity must be a positive integer, got ${opts.capacity}`);
  }
  if (!Number.isInteger(opts.capacity)) {
    throw new TypeError(`SemaphoreOptions.capacity must be an integer, got ${opts.capacity}`);
  }
}

export function describeSemaphore(opts: SemaphoreOptions): string {
  const label = opts.label ? ` (${opts.label})` : "";
  return `Semaphore${label}: capacity=${opts.capacity}`;
}

export function listSemaphorePresets(): string[] {
  return Object.keys(PRESETS);
}
