// lease.config.ts — Presets and option builders for lease

import type { LeaseState } from "./lease";

export interface LeaseOptions {
  ttlMs: number;
  label?: string;
}

const PRESETS: Record<string, LeaseOptions> = {
  short:    { ttlMs: 5_000,   label: "short" },
  standard: { ttlMs: 30_000,  label: "standard" },
  long:     { ttlMs: 120_000, label: "long" },
  session:  { ttlMs: 600_000, label: "session" },
};

export function getLeasePreset(name: string): LeaseOptions {
  const preset = PRESETS[name];
  if (!preset) throw new Error(`Unknown lease preset: "${name}"`);
  return { ...preset };
}

export function listLeasePresets(): string[] {
  return Object.keys(PRESETS);
}

export function buildLeaseOptions(overrides: Partial<LeaseOptions> = {}): LeaseOptions {
  const base = getLeasePreset("standard");
  return { ...base, ...overrides };
}

export function validateLeaseOptions(opts: LeaseOptions): void {
  if (typeof opts.ttlMs !== "number" || opts.ttlMs <= 0) {
    throw new Error(`LeaseOptions.ttlMs must be a positive number, got ${opts.ttlMs}`);
  }
}

export function describeLease(state: LeaseState): string {
  const remaining = Math.max(0, state.expiresAt - Date.now());
  const status = state.active ? `active, ${remaining}ms remaining` : "expired";
  return `Lease[${state.key}] owner=${state.owner} renewals=${state.renewals} (${status})`;
}
