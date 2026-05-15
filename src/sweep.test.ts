import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSweep } from "./sweep";

describe("createSweep", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("initialises with idle state", () => {
    const sweep = createSweep([], 1000);
    const s = sweep.getState();
    expect(s.running).toBe(false);
    expect(s.lastRun).toBeNull();
    expect(s.totalCleaned).toBe(0);
    expect(s.cycles).toBe(0);
  });

  it("runOnce aggregates counts from all sweepers", () => {
    const a = vi.fn(() => 3);
    const b = vi.fn(() => 5);
    const sweep = createSweep([a, b], 1000);
    const cleaned = sweep.runOnce();
    expect(cleaned).toBe(8);
    expect(sweep.getState().totalCleaned).toBe(8);
    expect(sweep.getState().cycles).toBe(1);
    expect(sweep.getState().lastRun).not.toBeNull();
  });

  it("start triggers sweepers on each interval", () => {
    const sweeper = vi.fn(() => 1);
    const sweep = createSweep([sweeper], 500);
    sweep.start();
    expect(sweep.getState().running).toBe(true);
    vi.advanceTimersByTime(1500);
    expect(sweeper).toHaveBeenCalledTimes(3);
  });

  it("stop halts the interval", () => {
    const sweeper = vi.fn(() => 0);
    const sweep = createSweep([sweeper], 500);
    sweep.start();
    vi.advanceTimersByTime(600);
    sweep.stop();
    expect(sweep.getState().running).toBe(false);
    vi.advanceTimersByTime(1000);
    expect(sweeper).toHaveBeenCalledTimes(1);
  });

  it("calling start twice does not double-register the interval", () => {
    const sweeper = vi.fn(() => 0);
    const sweep = createSweep([sweeper], 500);
    sweep.start();
    sweep.start();
    vi.advanceTimersByTime(1000);
    expect(sweeper).toHaveBeenCalledTimes(2);
  });

  it("accumulates totalCleaned across multiple runOnce calls", () => {
    const sweep = createSweep([() => 4], 1000);
    sweep.runOnce();
    sweep.runOnce();
    expect(sweep.getState().totalCleaned).toBe(8);
    expect(sweep.getState().cycles).toBe(2);
  });

  it("getState returns a snapshot, not a live reference", () => {
    const sweep = createSweep([() => 1], 1000);
    const before = sweep.getState();
    sweep.runOnce();
    const after = sweep.getState();
    expect(before.cycles).toBe(0);
    expect(after.cycles).toBe(1);
  });
});
