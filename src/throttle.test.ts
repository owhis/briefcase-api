import { createThrottle, sleep } from "./throttle";
import {
  getThrottlePreset,
  buildThrottleOptions,
  validateThrottleOptions,
} from "./throttle.config";

describe("createThrottle", () => {
  it("resolves immediately when under the request limit", async () => {
    const throttle = createThrottle({ maxRequests: 3, windowMs: 1_000 });
    const start = Date.now();
    await throttle.acquire();
    await throttle.acquire();
    await throttle.acquire();
    expect(Date.now() - start).toBeLessThan(50);
  });

  it("delays when the request limit is reached", async () => {
    const windowMs = 200;
    const throttle = createThrottle({ maxRequests: 2, windowMs });
    await throttle.acquire();
    await throttle.acquire();
    const start = Date.now();
    await throttle.acquire(); // should wait for the window to pass
    expect(Date.now() - start).toBeGreaterThanOrEqual(windowMs - 20);
  }, 1_000);

  it("tracks timestamps in state", async () => {
    const throttle = createThrottle({ maxRequests: 5, windowMs: 5_000 });
    await throttle.acquire();
    await throttle.acquire();
    expect(throttle.getState().timestamps).toHaveLength(2);
  });

  it("prunes expired timestamps before checking capacity", async () => {
    const windowMs = 100;
    const throttle = createThrottle({ maxRequests: 2, windowMs });
    await throttle.acquire();
    await throttle.acquire();
    await sleep(windowMs + 20);
    // After the window expires both slots should be free again
    const start = Date.now();
    await throttle.acquire();
    expect(Date.now() - start).toBeLessThan(50);
  }, 1_000);
});

describe("getThrottlePreset", () => {
  it("returns the conservative preset", () => {
    expect(getThrottlePreset("conservative")).toEqual({
      maxRequests: 10,
      windowMs: 10_000,
    });
  });

  it("returns independent copies to prevent mutation", () => {
    const a = getThrottlePreset("standard");
    const b = getThrottlePreset("standard");
    a.maxRequests = 999;
    expect(b.maxRequests).toBe(30);
  });
});

describe("buildThrottleOptions", () => {
  it("merges overrides onto a preset", () => {
    const opts = buildThrottleOptions("standard", { maxRequests: 50 });
    expect(opts).toEqual({ maxRequests: 50, windowMs: 10_000 });
  });
});

describe("validateThrottleOptions", () => {
  it("throws for non-positive maxRequests", () => {
    expect(() =>
      validateThrottleOptions({ maxRequests: 0, windowMs: 1_000 })
    ).toThrow(RangeError);
  });

  it("throws for non-positive windowMs", () => {
    expect(() =>
      validateThrottleOptions({ maxRequests: 5, windowMs: -1 })
    ).toThrow(RangeError);
  });

  it("does not throw for valid options", () => {
    expect(() =>
      validateThrottleOptions({ maxRequests: 10, windowMs: 5_000 })
    ).not.toThrow();
  });
});
