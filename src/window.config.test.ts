import {
  getWindowPreset,
  buildWindowOptions,
  validateWindowOptions,
  describeWindow,
  listWindowPresets,
} from "./window.config";

describe("getWindowPreset", () => {
  it("returns known preset", () => {
    const p = getWindowPreset("minute");
    expect(p.durationMs).toBe(60_000);
    expect(p.label).toBe("1m");
  });

  it("throws for unknown preset", () => {
    expect(() => getWindowPreset("decade")).toThrow(/Unknown window preset/);
  });

  it("returns a copy so mutations do not affect presets", () => {
    const p = getWindowPreset("second");
    p.durationMs = 999;
    expect(getWindowPreset("second").durationMs).toBe(1_000);
  });
});

describe("buildWindowOptions", () => {
  it("uses defaults when no overrides given", () => {
    const opts = buildWindowOptions();
    expect(opts.durationMs).toBe(60_000);
  });

  it("applies overrides", () => {
    const opts = buildWindowOptions({ durationMs: 5_000, label: "5s" });
    expect(opts.durationMs).toBe(5_000);
    expect(opts.label).toBe("5s");
  });

  it("applies partial overrides without losing other defaults", () => {
    const defaults = buildWindowOptions();
    const opts = buildWindowOptions({ label: "custom" });
    expect(opts.durationMs).toBe(defaults.durationMs);
    expect(opts.label).toBe("custom");
  });
});

describe("validateWindowOptions", () => {
  it("passes for valid options", () => {
    expect(() => validateWindowOptions({ durationMs: 1_000 })).not.toThrow();
  });

  it("throws when durationMs is zero", () => {
    expect(() => validateWindowOptions({ durationMs: 0 })).toThrow();
  });

  it("throws when durationMs is negative", () => {
    expect(() => validateWindowOptions({ durationMs: -100 })).toThrow();
  });
});

describe("describeWindow", () => {
  it("uses label when present", () => {
    expect(describeWindow({ durationMs: 1_000, label: "1s" })).toBe(
      "SlidingWindow(duration=1s)"
    );
  });

  it("falls back to ms when no label", () => {
    expect(describeWindow({ durationMs: 2_500 })).toBe(
      "SlidingWindow(duration=2500ms)"
    );
  });
});

describe("listWindowPresets", () => {
  it("returns all preset names", () => {
    const names = listWindowPresets();
    expect(names).toContain("second");
    expect(names).toContain("minute");
    expect(names).toContain("hour");
  });

  it("returns an array with no duplicate names", () => {
    const names = listWindowPresets();
    const unique = new Set(names);
    expect(unique.size).toBe(names.length);
  });
});
