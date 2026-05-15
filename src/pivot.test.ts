import { describe, it, expect, beforeEach } from "vitest";
import { createPivot } from "./pivot";
import {
  getPivotPreset,
  buildPivotOptions,
  validatePivotOptions,
  describePivot,
  listPivotPresets,
} from "./pivot.config";

describe("createPivot", () => {
  it("starts at the given index", () => {
    const p = createPivot(4, 2);
    expect(p.current()).toBe(2);
  });

  it("advances and returns the previous index", () => {
    const p = createPivot(3);
    expect(p.advance()).toBe(0);
    expect(p.current()).toBe(1);
  });

  it("wraps around after the last index", () => {
    const p = createPivot(2);
    p.advance(); // 0 -> 1
    p.advance(); // 1 -> 0
    expect(p.current()).toBe(0);
  });

  it("increments cycles on wrap", () => {
    const p = createPivot(2);
    p.advance();
    p.advance();
    expect(p.getState().cycles).toBe(1);
  });

  it("peek returns future index without advancing", () => {
    const p = createPivot(4);
    expect(p.peek(2)).toBe(2);
    expect(p.current()).toBe(0);
  });

  it("reset restores initial state", () => {
    const p = createPivot(3, 1);
    p.advance();
    p.advance();
    p.reset();
    expect(p.getState()).toEqual({ index: 1, total: 3, cycles: 0 });
  });

  it("throws on invalid total", () => {
    expect(() => createPivot(0)).toThrow(RangeError);
  });

  it("throws on out-of-range startIndex", () => {
    expect(() => createPivot(3, 5)).toThrow(RangeError);
  });
});

describe("pivot.config", () => {
  it("getPivotPreset returns a copy", () => {
    const p = getPivotPreset("pair");
    expect(p.total).toBe(2);
  });

  it("listPivotPresets includes known presets", () => {
    expect(listPivotPresets()).toContain("quad");
  });

  it("buildPivotOptions applies defaults", () => {
    const opts = buildPivotOptions({ total: 5 });
    expect(opts.startIndex).toBe(0);
  });

  it("validatePivotOptions throws on bad total", () => {
    expect(() => validatePivotOptions({ total: -1 })).toThrow(RangeError);
  });

  it("describePivot returns readable string", () => {
    expect(describePivot({ total: 4, startIndex: 1 })).toBe(
      "Pivot(total=4, startIndex=1)"
    );
  });
});
