import { describe, it, expect } from "vitest";
import {
  getBudgetPreset,
  buildBudgetOptions,
  validateBudgetOptions,
  describeBudget,
} from "./budget.config";

describe("getBudgetPreset", () => {
  it("returns small preset", () => {
    expect(getBudgetPreset("small").limit).toBe(100);
  });

  it("returns large preset", () => {
    expect(getBudgetPreset("large").limit).toBe(10_000);
  });

  it("throws on unknown preset", () => {
    expect(() => getBudgetPreset("unknown" as any)).toThrow();
  });
});

describe("buildBudgetOptions", () => {
  it("uses medium preset by default", () => {
    expect(buildBudgetOptions().limit).toBe(1_000);
  });

  it("merges preset with overrides", () => {
    const opts = buildBudgetOptions({ preset: "small", initial: 10 });
    expect(opts.limit).toBe(100);
    expect(opts.initial).toBe(10);
  });

  it("override wins over preset", () => {
    const opts = buildBudgetOptions({ preset: "small", limit: 50 });
    expect(opts.limit).toBe(50);
  });
});

describe("validateBudgetOptions", () => {
  it("passes valid options", () => {
    expect(() => validateBudgetOptions({ limit: 100 })).not.toThrow();
  });

  it("throws when limit is zero", () => {
    expect(() => validateBudgetOptions({ limit: 0 })).toThrow();
  });

  it("throws when initial exceeds limit", () => {
    expect(() => validateBudgetOptions({ limit: 10, initial: 20 })).toThrow();
  });

  it("throws when initial is negative", () => {
    expect(() => validateBudgetOptions({ limit: 10, initial: -1 })).toThrow();
  });
});

describe("describeBudget", () => {
  it("returns a readable string", () => {
    const desc = describeBudget({ limit: 100, initial: 20 });
    expect(desc).toContain("limit=100");
    expect(desc).toContain("initial=20");
    expect(desc).toContain("remaining=80");
  });
});
