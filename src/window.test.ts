import { createWindow } from "./window";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe("createWindow", () => {
  it("records values and returns correct state", () => {
    const w = createWindow(5_000);
    w.record(10);
    w.record(20);
    w.record(30);
    const state = w.getState();
    expect(state.count).toBe(3);
    expect(state.sum).toBe(60);
    expect(state.min).toBe(10);
    expect(state.max).toBe(30);
    expect(state.avg).toBe(20);
  });

  it("returns zero state when empty", () => {
    const w = createWindow(5_000);
    const state = w.getState();
    expect(state.count).toBe(0);
    expect(state.sum).toBe(0);
    expect(state.avg).toBe(0);
  });

  it("prunes expired entries", async () => {
    const w = createWindow(50);
    w.record(100);
    await sleep(60);
    w.record(200);
    const state = w.getState();
    expect(state.count).toBe(1);
    expect(state.sum).toBe(200);
  });

  it("reset clears all entries", () => {
    const w = createWindow(5_000);
    w.record(1);
    w.record(2);
    w.reset();
    expect(w.getState().count).toBe(0);
  });

  it("prune removes only old entries", async () => {
    const w = createWindow(80);
    w.record(5);
    await sleep(50);
    w.record(10);
    w.prune();
    // first entry is ~50ms old, still within 80ms window
    expect(w.getState().count).toBe(2);
    await sleep(40);
    w.prune();
    // first entry is now ~90ms old, should be pruned
    expect(w.getState().count).toBe(1);
  });

  it("entries snapshot is immutable", () => {
    const w = createWindow(5_000);
    w.record(42);
    const state = w.getState();
    state.entries.push({ value: 99, timestamp: Date.now() });
    expect(w.getState().count).toBe(1);
  });
});
