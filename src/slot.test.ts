import { createSlot } from "./slot";

describe("createSlot", () => {
  it("allows claiming up to maxClaims", () => {
    const slot = createSlot("test", { ttl: 1000, maxClaims: 2 });
    expect(slot.claim()).toBe(true);
    expect(slot.claim()).toBe(true);
    expect(slot.claim()).toBe(false);
  });

  it("reports unavailable when full", () => {
    const slot = createSlot("test", { ttl: 1000, maxClaims: 1 });
    slot.claim();
    expect(slot.isAvailable()).toBe(false);
  });

  it("becomes available after release", () => {
    const slot = createSlot("test", { ttl: 1000, maxClaims: 1 });
    slot.claim();
    slot.release();
    expect(slot.isAvailable()).toBe(true);
  });

  it("resets claims and expiry on reset()", () => {
    const slot = createSlot("test", { ttl: 1000, maxClaims: 1 });
    slot.claim();
    slot.reset();
    const state = slot.getState();
    expect(state.claims).toBe(0);
    expect(state.expiresAt).toBeNull();
  });

  it("sets expiresAt on first claim", () => {
    const before = Date.now();
    const slot = createSlot("test", { ttl: 500, maxClaims: 3 });
    slot.claim();
    const state = slot.getState();
    expect(state.expiresAt).not.toBeNull();
    expect(state.expiresAt!).toBeGreaterThanOrEqual(before + 500);
  });

  it("treats slot as available after ttl expires", async () => {
    const slot = createSlot("test", { ttl: 20, maxClaims: 1 });
    slot.claim();
    expect(slot.isAvailable()).toBe(false);
    await new Promise((r) => setTimeout(r, 30));
    expect(slot.isAvailable()).toBe(true);
  });

  it("auto-clears expired claims on new claim attempt", async () => {
    const slot = createSlot("test", { ttl: 20, maxClaims: 1 });
    slot.claim();
    await new Promise((r) => setTimeout(r, 30));
    expect(slot.claim()).toBe(true);
  });

  it("getState reflects expired state correctly", async () => {
    const slot = createSlot("expired-slot", { ttl: 20, maxClaims: 2 });
    slot.claim();
    await new Promise((r) => setTimeout(r, 30));
    const state = slot.getState();
    expect(state.expired).toBe(true);
    expect(state.available).toBe(true);
    expect(state.claims).toBe(0);
  });

  it("does not go below 0 claims on excess release", () => {
    const slot = createSlot("test", { ttl: 1000, maxClaims: 2 });
    slot.claim();
    slot.release();
    slot.release();
    expect(slot.getState().claims).toBe(0);
  });
});
