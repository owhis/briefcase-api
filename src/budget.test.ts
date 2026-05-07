import { describe, it, expect, beforeEach } from "vitest";
import { createBudget } from "./budget";

describe("createBudget", () => {
  it("initialises with zero usage", () => {
    const b = createBudget({ limit: 10 });
    expect(b.getState()).toEqual({ used: 0, limit: 10, remaining: 10, exhausted: false });
  });

  it("respects initial used value", () => {
    const b = createBudget({ limit: 10, initial: 4 });
    expect(b.getState().used).toBe(4);
    expect(b.getState().remaining).toBe(6);
  });

  it("consume returns true and deducts cost", () => {
    const b = createBudget({ limit: 10 });
    expect(b.consume(3)).toBe(true);
    expect(b.getState().used).toBe(3);
  });

  it("consume defaults cost to 1", () => {
    const b = createBudget({ limit: 10 });
    b.consume();
    expect(b.getState().used).toBe(1);
  });

  it("consume returns false when over budget", () => {
    const b = createBudget({ limit: 5 });
    expect(b.consume(6)).toBe(false);
    expect(b.getState().used).toBe(0);
  });

  it("marks exhausted when limit reached", () => {
    const b = createBudget({ limit: 2 });
    b.consume(2);
    expect(b.getState().exhausted).toBe(true);
    expect(b.getState().remaining).toBe(0);
  });

  it("refund reduces used", () => {
    const b = createBudget({ limit: 10 });
    b.consume(5);
    b.refund(2);
    expect(b.getState().used).toBe(3);
  });

  it("refund does not go below zero", () => {
    const b = createBudget({ limit: 10 });
    b.refund(100);
    expect(b.getState().used).toBe(0);
  });

  it("reset clears usage", () => {
    const b = createBudget({ limit: 10 });
    b.consume(7);
    b.reset();
    expect(b.getState().used).toBe(0);
    expect(b.getState().exhausted).toBe(false);
  });

  it("throws on non-positive limit", () => {
    expect(() => createBudget({ limit: 0 })).toThrow();
    expect(() => createBudget({ limit: -1 })).toThrow();
  });
});
