import { createBackoff, BackoffOptions } from "./backoff";

function makeBackoff(overrides: Partial<BackoffOptions> = {}) {
  return createBackoff({
    strategy: "exponential",
    baseMs: 100,
    maxMs: 5000,
    factor: 2,
    ...overrides,
  });
}

describe("createBackoff", () => {
  it("fixed strategy returns constant delay", () => {
    const b = makeBackoff({ strategy: "fixed", baseMs: 200 });
    expect(b.next()).toBe(200);
    expect(b.next()).toBe(200);
    expect(b.next()).toBe(200);
  });

  it("linear strategy increases by baseMs * factor each step", () => {
    const b = makeBackoff({ strategy: "linear", baseMs: 100, factor: 1 });
    expect(b.next()).toBe(100);
    expect(b.next()).toBe(200);
    expect(b.next()).toBe(300);
  });

  it("exponential strategy doubles each step", () => {
    const b = makeBackoff({ strategy: "exponential", baseMs: 100, factor: 2 });
    expect(b.next()).toBe(100);
    expect(b.next()).toBe(200);
    expect(b.next()).toBe(400);
    expect(b.next()).toBe(800);
  });

  it("fibonacci strategy follows fibonacci sequence", () => {
    const b = makeBackoff({ strategy: "fibonacci", baseMs: 100 });
    expect(b.next()).toBe(100);  // fib(1) = 1
    expect(b.next()).toBe(100);  // fib(2) = 1
    expect(b.next()).toBe(200);  // fib(3) = 2
    expect(b.next()).toBe(300);  // fib(4) = 3
    expect(b.next()).toBe(500);  // fib(5) = 5
  });

  it("clamps delay to maxMs", () => {
    const b = makeBackoff({ strategy: "exponential", baseMs: 1000, maxMs: 3000, factor: 2 });
    expect(b.next()).toBe(1000);
    expect(b.next()).toBe(2000);
    expect(b.next()).toBe(3000); // clamped from 4000
  });

  it("accumulates totalDelay in state", () => {
    const b = makeBackoff({ strategy: "fixed", baseMs: 100, maxMs: 5000 });
    b.next();
    b.next();
    b.next();
    expect(b.getState().totalDelay).toBe(300);
  });

  it("reset clears attempt and delay counters", () => {
    const b = makeBackoff({ strategy: "exponential", baseMs: 100, factor: 2 });
    b.next();
    b.next();
    b.reset();
    const state = b.getState();
    expect(state.attempt).toBe(0);
    expect(state.totalDelay).toBe(0);
    expect(state.lastDelay).toBe(0);
    expect(b.next()).toBe(100); // back to initial
  });

  it("getState reflects strategy name", () => {
    const b = makeBackoff({ strategy: "linear" });
    expect(b.getState().strategy).toBe("linear");
  });
});
