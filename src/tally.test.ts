import { createTally } from "./tally";
import {
  buildTallyOptions,
  describeTally,
  getTallyPreset,
  listTallyPresets,
  validateTallyOptions,
} from "./tally.config";

describe("createTally", () => {
  it("starts all keys at zero", () => {
    const t = createTally();
    expect(t.get("hits")).toBe(0);
  });

  it("increments a key", () => {
    const t = createTally();
    expect(t.increment("hits")).toBe(1);
    expect(t.increment("hits", 4)).toBe(5);
  });

  it("decrements a key, flooring at zero", () => {
    const t = createTally();
    t.increment("hits", 3);
    expect(t.decrement("hits", 2)).toBe(1);
    expect(t.decrement("hits", 10)).toBe(0);
  });

  it("respects ceiling", () => {
    const t = createTally(5);
    t.increment("x", 10);
    expect(t.get("x")).toBe(5);
  });

  it("tracks multiple keys independently", () => {
    const t = createTally();
    t.increment("a", 2);
    t.increment("b", 7);
    const state = t.getState();
    expect(state.counts).toEqual({ a: 2, b: 7 });
    expect(state.total).toBe(9);
  });

  it("resets a single key", () => {
    const t = createTally();
    t.increment("a", 3);
    t.increment("b", 1);
    t.reset("a");
    expect(t.get("a")).toBe(0);
    expect(t.get("b")).toBe(1);
  });

  it("resets all keys", () => {
    const t = createTally();
    t.increment("a", 2);
    t.increment("b", 5);
    t.reset();
    expect(t.getState().total).toBe(0);
  });

  it("throws on negative increment", () => {
    const t = createTally();
    expect(() => t.increment("x", -1)).toThrow(RangeError);
  });
});

describe("tally.config", () => {
  it("getTallyPreset returns known preset", () => {
    expect(getTallyPreset("binary").ceiling).toBe(1);
  });

  it("getTallyPreset throws on unknown preset", () => {
    expect(() => getTallyPreset("nope")).toThrow();
  });

  it("buildTallyOptions merges overrides", () => {
    const opts = buildTallyOptions({ ceiling: 42 });
    expect(opts.ceiling).toBe(42);
  });

  it("validateTallyOptions throws on non-positive ceiling", () => {
    expect(() => validateTallyOptions({ ceiling: 0 })).toThrow(RangeError);
    expect(() => validateTallyOptions({ ceiling: -5 })).toThrow(RangeError);
  });

  it("validateTallyOptions accepts null ceiling", () => {
    expect(() => validateTallyOptions({ ceiling: null })).not.toThrow();
  });

  it("describeTally formats correctly", () => {
    expect(describeTally({ ceiling: 100 })).toBe("Tally (ceiling: 100)");
    expect(describeTally({ ceiling: null })).toBe("Tally (unbounded)");
  });

  it("listTallyPresets returns array", () => {
    expect(listTallyPresets()).toContain("default");
    expect(listTallyPresets()).toContain("bounded");
  });
});
