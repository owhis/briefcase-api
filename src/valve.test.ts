import { createValve } from "./valve";

describe("createValve", () => {
  it("is open by default", () => {
    const v = createValve();
    expect(v.isOpen()).toBe(true);
  });

  it("can start closed", () => {
    const v = createValve(false);
    expect(v.isOpen()).toBe(false);
  });

  it("opens and closes correctly", () => {
    const v = createValve();
    v.close();
    expect(v.isOpen()).toBe(false);
    v.open();
    expect(v.isOpen()).toBe(true);
  });

  it("passes tasks through when open", async () => {
    const v = createValve();
    const result = await v.pass(() => Promise.resolve(42));
    expect(result).toBe(42);
  });

  it("increments processed count", async () => {
    const v = createValve();
    await v.pass(() => Promise.resolve(1));
    await v.pass(() => Promise.resolve(2));
    expect(v.getState().processed).toBe(2);
  });

  it("holds tasks while closed and releases on open", async () => {
    const v = createValve(false);
    const order: number[] = [];

    const p1 = v.pass(async () => { order.push(1); return 1; });
    const p2 = v.pass(async () => { order.push(2); return 2; });

    expect(v.getState().waiting).toBe(2);
    expect(order).toEqual([]);

    v.open();
    await Promise.all([p1, p2]);

    expect(order).toEqual([1, 2]);
    expect(v.getState().waiting).toBe(0);
  });

  it("drain resolves immediately when open", async () => {
    const v = createValve();
    await expect(v.drain()).resolves.toBeUndefined();
  });

  it("drain waits until open", async () => {
    const v = createValve(false);
    let drained = false;
    const p = v.drain().then(() => { drained = true; });
    expect(drained).toBe(false);
    v.open();
    await p;
    expect(drained).toBe(true);
  });

  it("getState reflects current valve status", () => {
    const v = createValve(false);
    const state = v.getState();
    expect(state.open).toBe(false);
    expect(state.waiting).toBe(0);
    expect(state.processed).toBe(0);
  });
});
