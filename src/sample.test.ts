import { describe, it, expect, beforeEach } from "vitest";
import { createSample } from "./sample";
import {
  getSamplePreset,
  listSamplePresets,
  buildSampleOptions,
  validateSampleOptions,
  describeSample,
} from "./sample.config";

describe("createSample", () => {
  it("throws for capacity < 1", () => {
    expect(() => createSample(0)).toThrow(RangeError);
  });

  it("collects items up to capacity", () => {
    const s = createSample<number>(3);
    s.add(1); s.add(2); s.add(3);
    expect(s.getSample()).toHaveLength(3);
    expect(s.isFull()).toBe(true);
  });

  it("tracks seen count beyond capacity", () => {
    const s = createSample<number>(2);
    s.addMany([1, 2, 3, 4, 5]);
    expect(s.getState().seen).toBe(5);
    expect(s.getSample()).toHaveLength(2);
  });

  it("reset clears items and seen count", () => {
    const s = createSample<number>(5);
    s.addMany([1, 2, 3]);
    s.reset();
    const state = s.getState();
    expect(state.items).toHaveLength(0);
    expect(state.seen).toBe(0);
    expect(s.isFull()).toBe(false);
  });

  it("getSample returns a copy", () => {
    const s = createSample<number>(3);
    s.add(42);
    const a = s.getSample();
    const b = s.getSample();
    expect(a).not.toBe(b);
  });

  it("statistically retains all items when within capacity", () => {
    const s = createSample<number>(100);
    const input = Array.from({ length: 50 }, (_, i) => i);
    s.addMany(input);
    expect(s.getSample().sort((a, b) => a - b)).toEqual(input);
  });
});

describe("sample.config", () => {
  it("getSamplePreset returns known preset", () => {
    const p = getSamplePreset("medium");
    expect(p.capacity).toBe(200);
  });

  it("getSamplePreset throws for unknown preset", () => {
    expect(() => getSamplePreset("unknown" as any)).toThrow();
  });

  it("listSamplePresets returns all preset names", () => {
    const names = listSamplePresets();
    expect(names).toContain("tiny");
    expect(names).toContain("large");
  });

  it("buildSampleOptions applies defaults", () => {
    const opts = buildSampleOptions();
    expect(opts.capacity).toBe(100);
  });

  it("validateSampleOptions throws for bad capacity", () => {
    expect(() => validateSampleOptions({ capacity: -1 })).toThrow(RangeError);
    expect(() => validateSampleOptions({ capacity: 1.5 })).toThrow(RangeError);
  });

  it("describeSample formats correctly", () => {
    expect(describeSample({ capacity: 50, label: "test" })).toContain("capacity=50");
    expect(describeSample({ capacity: 50, label: "test" })).toContain("test");
  });
});
