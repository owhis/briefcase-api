import {
  createJitter,
  applyJitter,
  getState,
  reset,
  JitterOptions,
} from "./jitter";
import {
  buildJitterOptions,
  validateJitterOptions,
  describeJitter,
  getJitterPreset,
  listJitterPresets,
} from "./jitter.config";

const baseOptions: JitterOptions = {
  strategy: "full",
  minMs: 100,
  maxMs: 5000,
};

describe("createJitter", () => {
  it("initialises state with calls=0 and lastDelay=minMs", () => {
    const state = createJitter(baseOptions);
    expect(state.calls).toBe(0);
    expect(state.lastDelay).toBe(baseOptions.minMs);
    expect(state.strategy).toBe("full");
  });
});

describe("applyJitter", () => {
  it("none strategy returns baseDelay clamped to range", () => {
    const opts: JitterOptions = { strategy: "none", minMs: 0, maxMs: 10_000 };
    const state = createJitter(opts);
    const { delayMs, state: next } = applyJitter(state, 1000, opts);
    expect(delayMs).toBe(1000);
    expect(next.calls).toBe(1);
  });

  it("full strategy returns value within [0, baseDelay]", () => {
    const opts: JitterOptions = { strategy: "full", minMs: 0, maxMs: 10_000 };
    const state = createJitter(opts);
    for (let i = 0; i < 20; i++) {
      const { delayMs } = applyJitter(state, 2000, opts);
      expect(delayMs).toBeGreaterThanOrEqual(0);
      expect(delayMs).toBeLessThanOrEqual(2000);
    }
  });

  it("equal strategy returns value in [base/2, base]", () => {
    const opts: JitterOptions = { strategy: "equal", minMs: 0, maxMs: 10_000 };
    const state = createJitter(opts);
    for (let i = 0; i < 20; i++) {
      const { delayMs } = applyJitter(state, 2000, opts);
      expect(delayMs).toBeGreaterThanOrEqual(1000);
      expect(delayMs).toBeLessThanOrEqual(2000);
    }
  });

  it("decorrelated increments calls and updates lastDelay", () => {
    const opts: JitterOptions = { strategy: "decorrelated", minMs: 100, maxMs: 30_000 };
    let state = createJitter(opts);
    for (let i = 0; i < 5; i++) {
      const result = applyJitter(state, 500, opts);
      state = result.state;
    }
    expect(state.calls).toBe(5);
    expect(state.lastDelay).toBeGreaterThanOrEqual(100);
    expect(state.lastDelay).toBeLessThanOrEqual(30_000);
  });

  it("clamps delay to maxMs", () => {
    const opts: JitterOptions = { strategy: "none", minMs: 0, maxMs: 500 };
    const state = createJitter(opts);
    const { delayMs } = applyJitter(state, 99_999, opts);
    expect(delayMs).toBe(500);
  });
});

describe("getState / reset", () => {
  it("getState returns a copy", () => {
    const state = createJitter(baseOptions);
    const copy = getState(state);
    expect(copy).toEqual(state);
    expect(copy).not.toBe(state);
  });

  it("reset restores initial state", () => {
    const opts: JitterOptions = { strategy: "full", minMs: 50, maxMs: 1000 };
    let state = createJitter(opts);
    ({ state } = applyJitter(state, 300, opts));
    const fresh = reset(state, opts);
    expect(fresh.calls).toBe(0);
    expect(fresh.lastDelay).toBe(opts.minMs);
  });
});

describe("jitter.config", () => {
  it("getJitterPreset returns known preset", () => {
    const p = getJitterPreset("decorrelated");
    expect(p.strategy).toBe("decorrelated");
  });

  it("getJitterPreset throws for unknown preset", () => {
    expect(() => getJitterPreset("unknown")).toThrow();
  });

  it("buildJitterOptions merges partial over preset", () => {
    const opts = buildJitterOptions({ strategy: "equal", maxMs: 1000 });
    expect(opts.strategy).toBe("equal");
    expect(opts.maxMs).toBe(1000);
  });

  it("validateJitterOptions throws on invalid range", () => {
    expect(() =>
      validateJitterOptions({ strategy: "full", minMs: 500, maxMs: 100 })
    ).toThrow(RangeError);
  });

  it("describeJitter returns readable string", () => {
    const desc = describeJitter({ strategy: "full", minMs: 0, maxMs: 5000 });
    expect(desc).toContain("full");
    expect(desc).toContain("5000ms");
  });

  it("listJitterPresets returns all presets", () => {
    const presets = listJitterPresets();
    expect(presets).toContain("none");
    expect(presets).toContain("decorrelated");
  });
});
