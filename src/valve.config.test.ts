import {
  getValvePreset,
  buildValveOptions,
  validateValveOptions,
  describeValve,
  listValvePresets,
} from "./valve.config";

describe("getValvePreset", () => {
  it("returns the default preset", () => {
    const p = getValvePreset("default");
    expect(p.initiallyOpen).toBe(true);
  });

  it("returns the paused preset", () => {
    const p = getValvePreset("paused");
    expect(p.initiallyOpen).toBe(false);
  });

  it("throws on unknown preset", () => {
    expect(() => getValvePreset("nonexistent")).toThrow(/Unknown valve preset/);
  });
});

describe("buildValveOptions", () => {
  it("uses defaults when no args given", () => {
    const opts = buildValveOptions();
    expect(opts.initiallyOpen).toBe(true);
  });

  it("merges provided values", () => {
    const opts = buildValveOptions({ initiallyOpen: false, label: "test" });
    expect(opts.initiallyOpen).toBe(false);
    expect(opts.label).toBe("test");
  });
});

describe("validateValveOptions", () => {
  it("passes valid options", () => {
    expect(() => validateValveOptions({ initiallyOpen: true })).not.toThrow();
  });

  it("throws if initiallyOpen is not boolean", () => {
    expect(() => validateValveOptions({ initiallyOpen: "yes" } as any)).toThrow();
  });

  it("throws if label is not a string", () => {
    expect(() => validateValveOptions({ initiallyOpen: true, label: 123 as any })).toThrow();
  });
});

describe("describeValve", () => {
  it("describes an open valve", () => {
    expect(describeValve({ initiallyOpen: true })).toContain("open");
  });

  it("includes label when provided", () => {
    expect(describeValve({ initiallyOpen: false, label: "auth" })).toContain("[auth]");
  });
});

describe("listValvePresets", () => {
  it("returns an array of preset names", () => {
    const names = listValvePresets();
    expect(names).toContain("default");
    expect(names).toContain("paused");
  });
});
