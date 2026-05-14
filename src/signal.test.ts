import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSignal } from "./signal";
import {
  buildSignalOptions,
  describeSignal,
  getSignalPreset,
  listSignalPresets,
  validateSignalOptions,
} from "./signal.config";

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("createSignal", () => {
  it("starts in non-aborted state", () => {
    const h = createSignal();
    expect(h.getState().aborted).toBe(false);
    expect(h.getState().timedOut).toBe(false);
  });

  it("aborts manually with reason", () => {
    const h = createSignal();
    h.abort("user cancelled");
    const state = h.getState();
    expect(state.aborted).toBe(true);
    expect(state.reason).toBe("user cancelled");
    expect(state.timedOut).toBe(false);
  });

  it("aborts after timeoutMs", () => {
    const h = createSignal({ timeoutMs: 500 });
    expect(h.getState().aborted).toBe(false);
    vi.advanceTimersByTime(500);
    const state = h.getState();
    expect(state.aborted).toBe(true);
    expect(state.timedOut).toBe(true);
  });

  it("does not abort before timeout elapses", () => {
    const h = createSignal({ timeoutMs: 1000 });
    vi.advanceTimersByTime(999);
    expect(h.getState().aborted).toBe(false);
  });

  it("cascades from parent signal", () => {
    const parent = createSignal();
    const child = createSignal({ parent: parent.signal });
    parent.abort("parent done");
    expect(child.getState().aborted).toBe(true);
  });

  it("reset clears aborted state", () => {
    const h = createSignal({ timeoutMs: 200 });
    vi.advanceTimersByTime(200);
    expect(h.getState().aborted).toBe(true);
    h.reset();
    expect(h.getState().aborted).toBe(false);
    expect(h.getState().timedOut).toBe(false);
  });
});

describe("signal.config", () => {
  it("getSignalPreset returns known preset", () => {
    const p = getSignalPreset("short");
    expect(p.timeoutMs).toBe(1_000);
  });

  it("getSignalPreset throws for unknown preset", () => {
    // @ts-expect-error intentional
    expect(() => getSignalPreset("unknown")).toThrow();
  });

  it("buildSignalOptions merges overrides", () => {
    const opts = buildSignalOptions({ timeoutMs: 999 }, "default");
    expect(opts.timeoutMs).toBe(999);
  });

  it("validateSignalOptions throws on negative timeoutMs", () => {
    expect(() => validateSignalOptions({ timeoutMs: -1 })).toThrow(RangeError);
  });

  it("describeSignal formats output", () => {
    const desc = describeSignal({ timeoutMs: 3000 });
    expect(desc).toContain("3000ms");
  });

  it("listSignalPresets returns all preset names", () => {
    const names = listSignalPresets();
    expect(names).toContain("default");
    expect(names).toContain("infinite");
  });
});
