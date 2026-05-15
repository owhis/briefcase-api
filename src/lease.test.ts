import { describe, it, expect, beforeEach } from "vitest";
import { createLease } from "./lease";
import {
  buildLeaseOptions,
  validateLeaseOptions,
  getLeasePreset,
  listLeasePresets,
  describeLease,
} from "./lease.config";

describe("createLease", () => {
  let lease: ReturnType<typeof createLease>;

  beforeEach(() => {
    lease = createLease(200);
  });

  it("acquires a key for an owner", () => {
    expect(lease.acquire("res:1", "alice")).toBe(true);
  });

  it("rejects acquisition when already held", () => {
    lease.acquire("res:1", "alice");
    expect(lease.acquire("res:1", "bob")).toBe(false);
  });

  it("reports isHeld correctly", () => {
    lease.acquire("res:1", "alice");
    expect(lease.isHeld("res:1")).toBe(true);
    expect(lease.isHeld("res:1", "alice")).toBe(true);
    expect(lease.isHeld("res:1", "bob")).toBe(false);
  });

  it("releases a lease", () => {
    lease.acquire("res:1", "alice");
    expect(lease.release("res:1", "alice")).toBe(true);
    expect(lease.isHeld("res:1")).toBe(false);
  });

  it("does not release when owner mismatch", () => {
    lease.acquire("res:1", "alice");
    expect(lease.release("res:1", "bob")).toBe(false);
    expect(lease.isHeld("res:1")).toBe(true);
  });

  it("renews a lease and increments renewals", () => {
    lease.acquire("res:1", "alice");
    expect(lease.renew("res:1", "alice")).toBe(true);
    expect(lease.getState("res:1")?.renewals).toBe(1);
  });

  it("allows re-acquisition after expiry", async () => {
    lease = createLease(50);
    lease.acquire("res:1", "alice");
    await new Promise((r) => setTimeout(r, 80));
    expect(lease.acquire("res:1", "bob")).toBe(true);
  });

  it("prune removes expired entries", async () => {
    lease = createLease(50);
    lease.acquire("res:1", "alice");
    await new Promise((r) => setTimeout(r, 80));
    lease.prune();
    expect(lease.getState("res:1")).toBeUndefined();
  });
});

describe("lease.config", () => {
  it("buildLeaseOptions merges defaults", () => {
    const opts = buildLeaseOptions({ ttlMs: 9000 });
    expect(opts.ttlMs).toBe(9000);
  });

  it("validateLeaseOptions throws on bad ttl", () => {
    expect(() => validateLeaseOptions({ ttlMs: -1 })).toThrow();
  });

  it("getLeasePreset returns known preset", () => {
    expect(getLeasePreset("short").ttlMs).toBe(5000);
  });

  it("listLeasePresets returns all keys", () => {
    expect(listLeasePresets()).toContain("standard");
  });

  it("describeLease formats correctly", () => {
    const state = { key: "x", owner: "alice", expiresAt: Date.now() + 5000, renewals: 2, active: true };
    expect(describeLease(state)).toMatch(/alice/);
    expect(describeLease(state)).toMatch(/renewals=2/);
  });
});
