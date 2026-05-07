/**
 * budget.config.ts — Presets and option builders for budget module.
 */

import type { BudgetOptions } from "./budget";

export type BudgetPreset = "small" | "medium" | "large" | "unlimited";

const PRESETS: Record<BudgetPreset, BudgetOptions> = {
  small:     { limit: 100 },
  medium:    { limit: 1_000 },
  large:     { limit: 10_000 },
  unlimited: { limit: Number.MAX_SAFE_INTEGER },
};

export function getBudgetPreset(preset: BudgetPreset): BudgetOptions {
  const found = PRESETS[preset];
  if (!found) throw new Error(`Unknown budget preset: "${preset}"`);
  return { ...found };
}

export function buildBudgetOptions(
  overrides: Partial<BudgetOptions> & { preset?: BudgetPreset } = {}
): BudgetOptions {
  const { preset, ...rest } = overrides;
  const base = preset ? getBudgetPreset(preset) : getBudgetPreset("medium");
  return { ...base, ...rest };
}

export function validateBudgetOptions(options: BudgetOptions): void {
  if (typeof options.limit !== "number" || options.limit <= 0) {
    throw new Error("BudgetOptions.limit must be a positive number");
  }
  if (
    options.initial !== undefined &&
    (typeof options.initial !== "number" || options.initial < 0)
  ) {
    throw new Error("BudgetOptions.initial must be a non-negative number");
  }
  if (options.initial !== undefined && options.initial > options.limit) {
    throw new Error("BudgetOptions.initial must not exceed limit");
  }
}

export function describeBudget(options: BudgetOptions): string {
  const initial = options.initial ?? 0;
  return `Budget(limit=${options.limit}, initial=${initial}, remaining=${options.limit - initial})`;
}
