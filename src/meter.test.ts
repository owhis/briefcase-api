import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createMeter } from "./meter";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

describe("createMeter", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("starts with zero count", () => {
    const m = createMeter({ windowMs: 5_000, maxSamples: 100 });
    expect(m.getState().count).toBe(0);
    expect(m.getState().rate).toBe(0);
  });

  it("records events and reflects count", () => {
    const m = createMeter({ windowMs: 5_000, maxSamples: 100 });
    m.record();
    m.record();
    m.record();
    expect(m.getState().count).toBe(3);
  });

  it("prunes events outside the window", () => {
    const m = createMeter({ windowMs: 1_000, maxSamples: 100 });
    m.record();
    m.record();
    vi.advanceTimersByTime(1_100);
    m.record();
    expect(m.getState().count).toBe(1);
  });

  it("respects maxSamples cap", () => {
    const m = createMeter({ windowMs: 5_000, maxSamples: 3 });
    for (let i = 0; i < 10; i++) m.record();
    expect(m.getState().count).toBe(3);
  });

  it("computes rate as events per second", () => {
    const m = createMeter({ windowMs: 2_000, maxSamples: 100 });
    for (let i = 0; i < 10; i++) m.record();
    const { rate } = m.getState();
    // 10 events in 2s window => 5 eps
    expect(rate).toBeCloseTo(5, 0);
  });

  it("reset clears all samples", () => {
    const m = createMeter({ windowMs: 5_000, maxSamples: 100 });
    m.record();
    m.record();
    m.reset();
    const state = m.getState();
    expect(state.count).toBe(0);
    expect(state.oldest).toBeNull();
    expect(state.newest).toBeNull();
  });

  it("tracks oldest and newest timestamps", () => {
    const m = createMeter({ windowMs: 5_000, maxSamples: 100 });
    const t1 = Date.now();
    m.record();
    vi.advanceTimersByTime(200);
    m.record();
    const state = m.getState();
    expect(state.oldest).toBeGreaterThanOrEqual(t1);
    expect(state.newest).toBeGreaterThan(state.oldest!);
  });
});
