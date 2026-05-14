import { describe, it, expect } from "vitest";
import {
  getMeterPreset,
  buildMeterOptions,
  validateMeterOptions,
  describeMeter,
  listMeterPresets,
} from "./meter.config";

describe("getMeterPreset", () => {
  it("returns a copy of the fast preset", () => {
    const p = getMeterPreset("fast");
    expect(p.windowMs).toBe(1_000);
    expect(p.maxSamples).toBe(500);
  });

  it("returns a copy of the slow preset", () => {
    const p = getMeterPreset("slow");
    expect(p.windowMs).toBe(60_000);
  });
});

describe("buildMeterOptions", () => {
  it("merges overrides onto the standard preset", () => {
    const opts = buildMeterOptions({ maxSamples: 42 });
    expect(opts.maxSamples).toBe(42);
    expect(opts.windowMs).toBe(10_000);
  });

  it("uses specified preset as base", () => {
    const opts = buildMeterOptions({}, "fast");
    expect(opts.windowMs).toBe(1_000);
  });
});

describe("validateMeterOptions", () => {
  it("passes for valid options", () => {
    expect(() =>
      validateMeterOptions({ windowMs: 1_000, maxSamples: 100 })
    ).not.toThrow();
  });

  it("throws for non-positive windowMs", () => {
    expect(() =>
      validateMeterOptions({ windowMs: 0, maxSamples: 100 })
    ).toThrow(RangeError);
  });

  it("throws for non-positive maxSamples", () => {
    expect(() =>
      validateMeterOptions({ windowMs: 1_000, maxSamples: -1 })
    ).toThrow(RangeError);
  });
});

describe("describeMeter", () => {
  it("returns a human-readable description", () => {
    const desc = describeMeter({ windowMs: 5_000, maxSamples: 200 });
    expect(desc).toContain("5.0s");
    expect(desc).toContain("200");
  });
});

describe("listMeterPresets", () => {
  it("lists all preset names", () => {
    const names = listMeterPresets();
    expect(names).toContain("fast");
    expect(names).toContain("standard");
    expect(names).toContain("slow");
  });
});
