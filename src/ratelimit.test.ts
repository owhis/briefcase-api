import {
  createRateLimit,
  isAllowed,
  record,
  retryAfterMs,
  getCount,
  resetRateLimit,
} from "./ratelimit";

describe("createRateLimit", () => {
  it("initialises with empty timestamps", () => {
    const state = createRateLimit({ windowMs: 1000, maxRequests: 5 });
    expect(state.timestamps).toEqual([]);
    expect(state.maxRequests).toBe(5);
    expect(state.windowMs).toBe(1000);
  });
});

describe("isAllowed", () => {
  it("allows requests below the limit", () => {
    const state = createRateLimit({ windowMs: 1000, maxRequests: 3 });
    const now = Date.now();
    record(state, now);
    record(state, now);
    expect(isAllowed(state, now)).toBe(true);
  });

  it("blocks requests at the limit", () => {
    const state = createRateLimit({ windowMs: 1000, maxRequests: 2 });
    const now = Date.now();
    record(state, now);
    record(state, now);
    expect(isAllowed(state, now)).toBe(false);
  });

  it("allows requests once old timestamps fall outside the window", () => {
    const state = createRateLimit({ windowMs: 500, maxRequests: 1 });
    const past = Date.now() - 600;
    record(state, past);
    expect(isAllowed(state, Date.now())).toBe(true);
  });
});

describe("retryAfterMs", () => {
  it("returns 0 when under the limit", () => {
    const state = createRateLimit({ windowMs: 1000, maxRequests: 5 });
    expect(retryAfterMs(state, Date.now())).toBe(0);
  });

  it("returns positive ms when at the limit", () => {
    const state = createRateLimit({ windowMs: 1000, maxRequests: 1 });
    const now = Date.now();
    record(state, now);
    const wait = retryAfterMs(state, now);
    expect(wait).toBeGreaterThan(0);
    expect(wait).toBeLessThanOrEqual(1000);
  });
});

describe("getCount", () => {
  it("returns the number of requests in the current window", () => {
    const state = createRateLimit({ windowMs: 1000, maxRequests: 10 });
    const now = Date.now();
    record(state, now);
    record(state, now);
    expect(getCount(state, now)).toBe(2);
  });
});

describe("resetRateLimit", () => {
  it("clears all recorded timestamps", () => {
    const state = createRateLimit({ windowMs: 1000, maxRequests: 3 });
    const now = Date.now();
    record(state, now);
    record(state, now);
    resetRateLimit(state);
    expect(state.timestamps).toHaveLength(0);
  });
});
