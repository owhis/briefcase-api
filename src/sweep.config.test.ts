import { describe, it, expect } from "vitest";
import {
  getSweepPreset,
  listSweepPresets,
  buildSweepOptions,
  validateSweepOptions,
  describeSweep,
} from "./sweep.config";

const noop = () => 0;

describe("getSweepPreset", () => {
  it("returns aggressive preset with short interval", () => {
    const p = getSweepPreset("aggressive");
    expect(p.intervalMs).toBe(5_000);
    expect(p.autoStart).toBe(true);
  });

  it("returns lazy preset with long interval", () => {
    const p = getSweepPreset("lazy");
    expect(p.intervalMs).toBe(120_000);
    expect(p.autoStart).toBe(false);
  });

  it("returns a copy, not the original", () => {
    const a = getSweepPreset("balanced");
    const b = getSweepPreset("balanced");
    expect(a).not.toBe(b);
  });
});

describe("listSweepPresets", () => {
  it("lists all preset names", () => {
    expect(listSweepPresets()).toEqual(
      expect.arrayContaining(["aggressive", "balanced", "lazy"])
    );
  });
});

describe("buildSweepOptions", () => {
  it("applies defaults for intervalMs and autoStart", () => {
    const opts = buildSweepOptions({ sweepers: [noop] });
    expect(opts.intervalMs).toBe(30_000);
    expect(opts.autoStart).toBe(false);
  });

  it("overrides defaults with provided values", () => {
    const opts = buildSweepOptions({ sweepers: [noop], intervalMs: 1000, autoStart: true });
    expect(opts.intervalMs).toBe(1000);
    expect(opts.autoStart).toBe(true);
  });
});

describe("validateSweepOptions", () => {
  it("throws when intervalMs is zero", () => {
    expect(() =>
      validateSweepOptions({ intervalMs: 0, sweepers: [noop], autoStart: false })
    ).toThrow(RangeError);
  });

  it("throws when sweepers is empty", () => {
    expect(() =>
      validateSweepOptions({ intervalMs: 1000, sweepers: [], autoStart: false })
    ).toThrow(TypeError);
  });

  it("throws when a sweeper is not a function", () => {
    expect(() =>
      validateSweepOptions({ intervalMs: 1000, sweepers: ["bad" as any], autoStart: false })
    ).toThrow(TypeError);
  });

  it("passes for valid options", () => {
    expect(() =>
      validateSweepOptions({ intervalMs: 500, sweepers: [noop], autoStart: true })
    ).not.toThrow();
  });
});

describe("describeSweep", () => {
  it("returns a human-readable description", () => {
    const desc = describeSweep({ intervalMs: 10_000, sweepers: [noop, noop], autoStart: true });
    expect(desc).toContain("10000ms");
    expect(desc).toContain("2 sweeper");
    expect(desc).toContain("autoStart=true");
  });
});
