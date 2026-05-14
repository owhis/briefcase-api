import { createStamp } from "./stamp";
import {
  buildStampOptions,
  describeStamp,
  getStampPreset,
  listStampPresets,
  validateStampOptions,
} from "./stamp.config";

describe("createStamp", () => {
  it("starts with no entries", () => {
    const stamp = createStamp();
    const state = stamp.getState();
    expect(state.entries).toHaveLength(0);
    expect(state.startedAt).toBeNull();
  });

  it("records marks in order", () => {
    const stamp = createStamp();
    stamp.mark("a");
    stamp.mark("b");
    const { entries } = stamp.getState();
    expect(entries).toHaveLength(2);
    expect(entries[0].label).toBe("a");
    expect(entries[1].label).toBe("b");
    expect(entries[1].ts).toBeGreaterThanOrEqual(entries[0].ts);
  });

  it("sets startedAt on first mark", () => {
    const stamp = createStamp();
    stamp.mark("start");
    expect(stamp.getState().startedAt).not.toBeNull();
  });

  it("returns null elapsed when no entries", () => {
    const stamp = createStamp();
    expect(stamp.elapsed()).toBeNull();
  });

  it("computes elapsed between first and last by default", () => {
    const stamp = createStamp();
    stamp.mark("x");
    stamp.mark("y");
    const e = stamp.elapsed();
    expect(typeof e).toBe("number");
    expect(e).toBeGreaterThanOrEqual(0);
  });

  it("computes elapsed between named marks", () => {
    const stamp = createStamp();
    stamp.mark("a");
    stamp.mark("b");
    stamp.mark("c");
    const ab = stamp.elapsed("a", "b");
    const ac = stamp.elapsed("a", "c");
    expect(ab).toBeGreaterThanOrEqual(0);
    expect(ac).toBeGreaterThanOrEqual(ab!);
  });

  it("returns null for unknown mark labels", () => {
    const stamp = createStamp();
    stamp.mark("a");
    expect(stamp.elapsed("a", "z")).toBeNull();
  });

  it("resets state", () => {
    const stamp = createStamp();
    stamp.mark("a");
    stamp.reset();
    const state = stamp.getState();
    expect(state.entries).toHaveLength(0);
    expect(state.startedAt).toBeNull();
  });

  it("toLog returns one line per mark", () => {
    const stamp = createStamp();
    stamp.mark("start");
    stamp.mark("end");
    const lines = stamp.toLog();
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain("[start]");
    expect(lines[1]).toContain("[end]");
  });
});

describe("stamp.config", () => {
  it("getStampPreset returns known preset", () => {
    const p = getStampPreset("strict");
    expect(p.autoReset).toBe(true);
    expect(p.maxEntries).toBe(20);
  });

  it("getStampPreset throws for unknown preset", () => {
    expect(() => getStampPreset("nope")).toThrow();
  });

  it("buildStampOptions merges overrides", () => {
    const opts = buildStampOptions({ maxEntries: 50 });
    expect(opts.maxEntries).toBe(50);
    expect(opts.autoReset).toBe(false);
  });

  it("validateStampOptions throws on bad maxEntries", () => {
    expect(() =>
      validateStampOptions(buildStampOptions({ maxEntries: 0 }))
    ).toThrow();
  });

  it("describeStamp returns a summary string", () => {
    const stamp = createStamp();
    stamp.mark("a");
    stamp.mark("b");
    const desc = describeStamp(stamp);
    expect(desc).toContain("2 mark(s)");
  });

  it("listStampPresets returns all preset names", () => {
    const names = listStampPresets();
    expect(names).toContain("default");
    expect(names).toContain("strict");
    expect(names).toContain("verbose");
  });
});
