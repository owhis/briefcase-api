import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createDebounce } from "./debounce";
import {
  getDebouncePreset,
  buildDebounceOptions,
  validateDebounceOptions,
  describeDebounce,
  listDebouncePresets,
} from "./debounce.config";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

describe("createDebounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("fires after wait period", () => {
    const fn = vi.fn();
    const d = createDebounce(fn, { waitMs: 200 });
    d.call("a");
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledWith("a");
  });

  it("resets timer on subsequent calls", () => {
    const fn = vi.fn();
    const d = createDebounce(fn, { waitMs: 200 });
    d.call("a");
    vi.advanceTimersByTime(100);
    d.call("b");
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith("b");
  });

  it("fires immediately when leading=true", () => {
    const fn = vi.fn();
    const d = createDebounce(fn, { waitMs: 200, leading: true, trailing: false });
    d.call("x");
    expect(fn).toHaveBeenCalledWith("x");
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("flush fires pending call immediately", () => {
    const fn = vi.fn();
    const d = createDebounce(fn, { waitMs: 500 });
    d.call("z");
    d.flush();
    expect(fn).toHaveBeenCalledWith("z");
  });

  it("cancel prevents pending call", () => {
    const fn = vi.fn();
    const d = createDebounce(fn, { waitMs: 300 });
    d.call("y");
    d.cancel();
    vi.advanceTimersByTime(300);
    expect(fn).not.toHaveBeenCalled();
  });

  it("getState reflects pending and callCount", () => {
    const fn = vi.fn();
    const d = createDebounce(fn, { waitMs: 200 });
    expect(d.getState().pending).toBe(false);
    d.call("a");
    expect(d.getState().pending).toBe(true);
    expect(d.getState().callCount).toBe(1);
    vi.advanceTimersByTime(200);
    expect(d.getState().pending).toBe(false);
    expect(d.getState().lastFiredAt).not.toBeNull();
  });

  it("reset clears all state", () => {
    const fn = vi.fn();
    const d = createDebounce(fn, { waitMs: 200 });
    d.call("a");
    d.reset();
    expect(d.getState().callCount).toBe(0);
    expect(d.getState().pending).toBe(false);
    vi.advanceTimersByTime(200);
    expect(fn).not.toHaveBeenCalled();
  });
});

describe("debounce.config", () => {
  it("getDebouncePreset returns known preset", () => {
    const p = getDebouncePreset("fast");
    expect(p.waitMs).toBe(100);
  });

  it("getDebouncePreset throws for unknown preset", () => {
    expect(() => getDebouncePreset("unknown" as never)).toThrow();
  });

  it("buildDebounceOptions applies defaults", () => {
    const opts = buildDebounceOptions({ waitMs: 150 });
    expect(opts.trailing).toBe(true);
    expect(opts.leading).toBe(false);
  });

  it("validateDebounceOptions throws for invalid waitMs", () => {
    expect(() => validateDebounceOptions({ waitMs: 0 })).toThrow();
  });

  it("validateDebounceOptions throws when maxWaitMs < waitMs", () => {
    expect(() =>
      validateDebounceOptions({ waitMs: 300, maxWaitMs: 100 })
    ).toThrow();
  });

  it("describeDebounce formats string", () => {
    const s = describeDebounce({ waitMs: 200, trailing: true, leading: false });
    expect(s).toContain("200ms");
    expect(s).toContain("trailing");
  });

  it("listDebouncePresets includes expected entries", () => {
    const list = listDebouncePresets();
    expect(list).toContain("default");
    expect(list).toContain("leading");
  });
});
